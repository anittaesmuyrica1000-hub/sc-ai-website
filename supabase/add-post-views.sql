-- 블로그 글별 조회수(view) 카운터
-- Supabase 대시보드 → SQL Editor에 붙여넣고 1회 실행하세요. (MCP는 읽기 전용이라 코드로는 실행 불가)

-- 1) posts에 views 컬럼 추가 (기본 0)
alter table public.posts add column if not exists views bigint not null default 0;

-- 2) anon(비로그인 방문자)도 "조회수 +1"만 안전하게 할 수 있는 함수.
--    posts 테이블 UPDATE 권한을 주지 않고, 이 함수로만 views를 증가시킨다(SECURITY DEFINER).
--    공개(published) 글만 카운트.
create or replace function public.increment_post_views(pid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts set views = views + 1 where id = pid and published = true;
$$;

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
