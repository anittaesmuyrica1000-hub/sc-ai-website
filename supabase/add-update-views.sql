-- 제품 업데이트별 조회수(view) 카운터 (블로그 add-post-views.sql와 동일 패턴)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 1회 실행하세요. (MCP는 읽기 전용이라 코드로는 실행 불가)

-- 1) updates에 views 컬럼 추가 (기본 0)
alter table public.updates add column if not exists views bigint not null default 0;

-- 2) anon(비로그인 방문자)도 "조회수 +1"만 안전하게 하는 함수(SECURITY DEFINER). 공개 항목만 카운트.
create or replace function public.increment_update_views(pid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.updates set views = views + 1 where id = pid and published = true;
$$;

grant execute on function public.increment_update_views(uuid) to anon, authenticated;
