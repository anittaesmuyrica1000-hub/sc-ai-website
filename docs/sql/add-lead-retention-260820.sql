-- ============================================================
-- 고객문의 개인정보 보유기간(1년) 관리 · 파기
-- 근거: 개인정보처리방침 제2조 — "문의, 고충처리 또는 자료 제공 완료일부터 1년"
-- 대상: signups(도입문의), brochure_requests(소개서 신청 리드)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- ============================================================

-- 1) 도입문의 상담 완료일 -------------------------------------
-- 보유기간 기산점. 어드민에서 상태를 '완료'로 바꾸면 기록되고, 되돌리면 지워진다.
alter table public.signups add column if not exists completed_at timestamptz;
comment on column public.signups.completed_at is '상담(문의 처리) 완료일 — 보유기간 1년의 기산점';

-- 2) 파기 기록(증적) -----------------------------------------
create table if not exists public.retention_purges (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,            -- 'signups' | 'brochure_requests'
  record_id  uuid not null,
  company    text,                     -- 어느 건이 파기됐는지 확인용(법인 정보)
  basis_at   timestamptz not null,     -- 보유기간 기산일
  purged_at  timestamptz not null default now(),
  purged_by  text                      -- 관리자 이메일(자동 파기는 null)
);

alter table public.retention_purges enable row level security;

drop policy if exists "retention_purges admin read" on public.retention_purges;
create policy "retention_purges admin read" on public.retention_purges
  for select to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins));

-- 3) 만료 건 파기 함수 ----------------------------------------
-- 보유기간 경과 여부를 함수가 다시 검사하므로, 만료되지 않은 행은 절대 삭제되지 않는다.
-- p_source: 특정 테이블만(생략 시 둘 다) / p_id: 특정 1건만(생략 시 만료 건 전체)
create or replace function public.purge_expired_leads(p_source text default null, p_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
  v_cut   timestamptz := now() - interval '1 year';
  v_n     integer := 0;
  v_c     integer;
begin
  -- 사람이 호출할 땐 관리자만. JWT 없는 서버 호출(cron)은 통과.
  if v_email is not null and v_email not in (select email from public.admins) then
    raise exception 'not authorized';
  end if;

  if p_source is null or p_source = 'signups' then
    with gone as (
      delete from public.signups s
      where coalesce(s.completed_at, s.created_at) < v_cut
        and (p_id is null or s.id = p_id)
      returning s.id, s.company, coalesce(s.completed_at, s.created_at) as basis_at
    )
    insert into public.retention_purges (source, record_id, company, basis_at, purged_by)
    select 'signups', id, company, basis_at, v_email from gone;
    get diagnostics v_c = row_count;
    v_n := v_n + v_c;
  end if;

  if p_source is null or p_source = 'brochure_requests' then
    with gone as (
      delete from public.brochure_requests b
      where coalesce(b.downloaded_at, b.created_at) < v_cut
        and (p_id is null or b.id = p_id)
      returning b.id, b.company, coalesce(b.downloaded_at, b.created_at) as basis_at
    )
    insert into public.retention_purges (source, record_id, company, basis_at, purged_by)
    select 'brochure_requests', id, company, basis_at, v_email from gone;
    get diagnostics v_c = row_count;
    v_n := v_n + v_c;
  end if;

  return v_n;
end;
$$;

revoke all on function public.purge_expired_leads(text, uuid) from public, anon;
grant execute on function public.purge_expired_leads(text, uuid) to authenticated;

-- 4) (선택) 매일 자동 파기 — 지금은 켜지 않음 ------------------
-- 현재 운영 방식: 어드민이 만료 알림을 보고 직접 파기(수동). 무인 삭제는 되돌릴 수 없으므로
-- 운영이 안정된 뒤 아래 블록의 주석을 풀어 실행하면 매일 새벽 4시(KST)에 자동 파기된다.
-- (Supabase 대시보드 → Database → Extensions 에서 pg_cron 활성화 필요.)
--
-- create extension if not exists pg_cron;
-- select cron.unschedule('purge-expired-leads')
-- where exists (select 1 from cron.job where jobname = 'purge-expired-leads');
-- select cron.schedule('purge-expired-leads', '0 19 * * *', $$select public.purge_expired_leads();$$);

-- 확인용
-- select count(*) from public.signups   where coalesce(completed_at, created_at) < now() - interval '1 year';
-- select count(*) from public.brochure_requests where coalesce(downloaded_at, created_at) < now() - interval '1 year';
-- select * from public.retention_purges order by purged_at desc limit 20;
