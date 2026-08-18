-- 전 페이지 서버측 조회수 집계 (경로별·일별)
-- 목적: 블로그 상세만 세던 조회수(posts.views)를 랜딩·도입문의·소개서 등 전 페이지로 확장한다.
--       쿠키·개인식별자를 쓰지 않고 "경로별 카운터 +1"만 하므로 동의(쿠키 배너)와 무관하게 집계된다.
--       GA4는 배너 미클릭 방문자를 denied로 처리해 약 19%만 집계 → 실측 보완용(2026-08-18 점검).
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행. 재실행 안전(idempotent).

create table if not exists public.page_views (
  view_date  date    not null,
  path       text    not null,
  count      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (view_date, path)
);

comment on table public.page_views is
  '경로별·일별 서버측 조회수. increment_page_view RPC로만 증가. 쿠키·개인식별자 없음(동의 무관 집계).';

-- RLS 활성 + 정책 없음 = anon/authenticated 직접 접근 전면 차단.
-- 증가는 아래 SECURITY DEFINER 함수로만, 조회는 크론(service_role)만.
alter table public.page_views enable row level security;

-- 조회수 +1. 경로 형식을 검증하고 관리자/API 경로는 세지 않는다.
create or replace function public.increment_page_view(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text;
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

  insert into public.page_views (view_date, path, count, updated_at)
  values ((now() at time zone 'Asia/Seoul')::date, clean, 1, now())
  on conflict (view_date, path)
  do update set count = public.page_views.count + 1, updated_at = now();
end;
$$;

grant execute on function public.increment_page_view(text) to anon, authenticated;

-- 조회 예시 — 어제 상위 페이지
-- select path, count from public.page_views
-- where view_date = ((now() at time zone 'Asia/Seoul')::date - 1)
-- order by count desc limit 10;
