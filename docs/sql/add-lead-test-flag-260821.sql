-- ============================================================
-- 테스트·스팸 리드 표시(is_test) + 표시된 건 즉시 삭제
-- 배경: 보유기간 파기(purge_expired_leads)는 1년 경과 건만 지운다. 내부 테스트·스팸 제출은
--       실제 리드가 아닌데도 집계에 섞이고 1년간 지울 방법이 없었다.
-- 방식: ① 어드민에서 '테스트' 표시 → 집계·일일 리포트에서 제외(되돌릴 수 있음)
--       ② 표시된 건만 즉시 삭제 허용(만료 무관) — 증적은 retention_purges에 남김
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- ============================================================

-- 1) 표시 컬럼 ------------------------------------------------
alter table public.signups           add column if not exists is_test boolean not null default false;
alter table public.brochure_requests add column if not exists is_test boolean not null default false;

comment on column public.signups.is_test           is '내부 테스트·스팸 제출 표시 — 집계 제외 및 즉시 삭제 대상';
comment on column public.brochure_requests.is_test is '내부 테스트·스팸 제출 표시 — 집계 제외 및 즉시 삭제 대상';

-- 만료 알림·집계 쿼리가 자주 거르는 컬럼이라 부분 인덱스를 둔다.
create index if not exists signups_is_test_idx           on public.signups (created_at desc) where is_test;
create index if not exists brochure_requests_is_test_idx on public.brochure_requests (created_at desc) where is_test;

-- 2) 파기 증적에 사유 칸 추가 ---------------------------------
-- 보유기간 만료 파기와 테스트 삭제를 구분해 기록한다.
alter table public.retention_purges add column if not exists reason text;
comment on column public.retention_purges.reason is '파기 사유 — ''retention''(보유기간 만료) | ''test''(테스트·스팸 표시분)';

-- 3) 테스트 표시분 즉시 삭제 함수 -----------------------------
-- 만료 여부와 무관하게 지우되, is_test = true 인 건만 지운다.
-- 표시되지 않은 실제 리드는 이 함수로도 삭제되지 않는다(오삭제 방지).
create or replace function public.delete_test_leads(p_source text default null, p_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';
  v_n     integer := 0;
  v_c     integer;
begin
  -- 관리자만 호출할 수 있다.
  if v_email is null or v_email not in (select email from public.admins) then
    raise exception 'not authorized';
  end if;

  if p_source is null or p_source = 'signups' then
    with gone as (
      delete from public.signups s
      where s.is_test
        and (p_id is null or s.id = p_id)
      returning s.id, s.company, coalesce(s.completed_at, s.created_at) as basis_at
    )
    insert into public.retention_purges (source, record_id, company, basis_at, purged_by, reason)
    select 'signups', id, company, basis_at, v_email, 'test' from gone;
    get diagnostics v_c = row_count;
    v_n := v_n + v_c;
  end if;

  if p_source is null or p_source = 'brochure_requests' then
    with gone as (
      delete from public.brochure_requests b
      where b.is_test
        and (p_id is null or b.id = p_id)
      returning b.id, b.company, coalesce(b.downloaded_at, b.created_at) as basis_at
    )
    insert into public.retention_purges (source, record_id, company, basis_at, purged_by, reason)
    select 'brochure_requests', id, company, basis_at, v_email, 'test' from gone;
    get diagnostics v_c = row_count;
    v_n := v_n + v_c;
  end if;

  return v_n;
end;
$$;

revoke all on function public.delete_test_leads(text, uuid) from public, anon;
grant execute on function public.delete_test_leads(text, uuid) to authenticated;

-- 4) 기존 보유기간 파기 함수도 사유를 남기도록 갱신 -----------
-- (동작은 그대로. retention_purges.reason 에 'retention' 을 채우는 것만 추가.)
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
    insert into public.retention_purges (source, record_id, company, basis_at, purged_by, reason)
    select 'signups', id, company, basis_at, v_email, 'retention' from gone;
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
    insert into public.retention_purges (source, record_id, company, basis_at, purged_by, reason)
    select 'brochure_requests', id, company, basis_at, v_email, 'retention' from gone;
    get diagnostics v_c = row_count;
    v_n := v_n + v_c;
  end if;

  return v_n;
end;
$$;

revoke all on function public.purge_expired_leads(text, uuid) from public, anon;
grant execute on function public.purge_expired_leads(text, uuid) to authenticated;

-- 5) 관리자 UPDATE 권한 (테스트 표시 토글용) -----------------
-- 어드민에서 is_test 를 켜고 끄려면 authenticated 관리자에게 UPDATE 권한이 필요하다.
-- (도입문의는 상태 변경으로 이미 UPDATE를 쓰지만, 소개서 리드는 지금까지 읽기만 했다.)
drop policy if exists "signups admin update" on public.signups;
create policy "signups admin update" on public.signups
  for update to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

drop policy if exists "brochure_requests admin update" on public.brochure_requests;
create policy "brochure_requests admin update" on public.brochure_requests
  for update to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

-- 확인용 ------------------------------------------------------
-- select count(*) filter (where is_test) as 테스트, count(*) as 전체 from public.signups;
-- select count(*) filter (where is_test) as 테스트, count(*) as 전체 from public.brochure_requests;
-- select source, reason, count(*) from public.retention_purges group by 1, 2;
