-- page_views 에 '쿠키 동의 상태' 차원 추가
-- 목적: 비동의자 총합만 알 수 있던 것을 미클릭 / 거부 / 허용으로 분해한다.
--       미클릭이 많으면 "배너가 무시당함"(제거 검토 근거), 거부가 많으면 "명시적 거부"(배너 유지가 타당).
--       개인식별자가 아니라 집계 차원이므로 동의 대상이 아니다.
-- 선행: add-page-views.sql 이 먼저 적용돼 있어야 한다.
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행. 재실행 안전(idempotent).

-- 1) 동의 상태 컬럼 추가. 기존 행(차원 추가 이전 수집분)은 'unknown'으로 남는다.
alter table public.page_views
  add column if not exists consent text not null default 'unknown';

comment on column public.page_views.consent is
  '쿠키 동의 상태: none=배너 미클릭 · denied=거부 클릭 · granted=허용 클릭 · unknown=차원 추가 이전 수집분';

-- 2) 기본키를 (날짜, 경로) → (날짜, 경로, 동의상태)로 확장
alter table public.page_views drop constraint if exists page_views_pkey;
alter table public.page_views add constraint page_views_pkey
  primary key (view_date, path, consent);

-- 3) RPC 교체 — 인자 1개짜리 옛 버전을 지우고 동의 상태를 받는 버전으로 대체.
--    p_consent 에 기본값이 있어 배포 과도기의 옛 클라이언트(1개 인자 호출)도 계속 동작한다.
drop function if exists public.increment_page_view(text);

create or replace function public.increment_page_view(p_path text, p_consent text default 'unknown')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean     text;
  v_consent text;  -- 변수명을 컬럼명(consent)과 다르게 둔다. 같으면 INSERT에서 모호성 오류(42702).
begin
  clean := left(coalesce(p_path, ''), 200);

  -- 우리 사이트 경로 형태만 허용(한글 slug 포함). 그 외는 조용히 무시.
  if clean !~ '^/[A-Za-z0-9/_.%가-힣-]*$' then
    return;
  end if;

  -- 관리자·API 경로는 집계 제외(내부 트래픽 오염 방지)
  if clean like '/admin%' or clean like '/api%' then
    return;
  end if;

  -- 허용된 값만 통과, 나머지는 unknown 으로 정규화
  v_consent := case coalesce(p_consent, '')
                 when 'none'    then 'none'
                 when 'denied'  then 'denied'
                 when 'granted' then 'granted'
                 else 'unknown'
               end;

  insert into public.page_views (view_date, path, consent, count, updated_at)
  values ((now() at time zone 'Asia/Seoul')::date, clean, v_consent, 1, now())
  on conflict (view_date, path, consent)
  do update set count = public.page_views.count + 1, updated_at = now();
end;
$$;

grant execute on function public.increment_page_view(text, text) to anon, authenticated;

-- 조회 예시 — 어제 동의 상태별 비중
-- select consent, sum(count) as views
-- from public.page_views
-- where view_date = ((now() at time zone 'Asia/Seoul')::date - 1)
-- group by consent order by views desc;
