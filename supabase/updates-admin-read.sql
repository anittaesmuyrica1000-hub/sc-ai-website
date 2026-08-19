-- updates: 관리자 조회 정책 추가
--
-- 배경: updates-setup.sql의 SELECT 정책이 "published = true" 하나뿐이라,
--       로그인한 관리자도 미공개(초안) 글을 조회할 수 없었다. 어드민 목록이
--       select("*")로 불러와도 DB가 걸러내 초안이 사라진 것처럼 보인다.
--       → "비공개로 준비 → 확인 후 공개" 흐름이 막혀 있던 상태.
--
-- 해결: 관리자용 SELECT 정책을 하나 더 둔다. Postgres RLS는 같은 명령(SELECT)에
--       걸린 PERMISSIVE 정책들을 OR로 묶으므로, 기존 공개 읽기는 그대로 유지되고
--       관리자만 추가로 전체 행을 볼 수 있다.
--
-- 적용: Supabase 대시보드 → SQL Editor에 붙여넣고 Run. (여러 번 실행해도 안전)
-- 참고: 쓰기 정책(insert/update/delete)은 updates-setup.sql 그대로 두고 건드리지 않는다.

drop policy if exists "updates admin read" on public.updates;
create policy "updates admin read" on public.updates
  for select to authenticated using (public.is_admin());

-- 확인: SELECT 정책이 2개(공개 읽기 + 관리자 읽기)여야 한다.
select policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'updates' and cmd = 'SELECT'
order by policyname;
