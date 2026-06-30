-- 관리자(admins) 관리: 어드민이 admins 목록을 조회/추가/삭제할 수 있게 RLS 추가.
-- admins 정책 안에서 admins를 다시 조회하면 무한재귀가 되므로, SECURITY DEFINER 함수로 우회한다.
-- Supabase SQL Editor에서 1회 실행.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email'));
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 어드민: 전체 조회
drop policy if exists "admins select all" on public.admins;
create policy "admins select all" on public.admins
  for select to authenticated using (public.is_admin());

-- 어드민: 추가
drop policy if exists "admins insert" on public.admins;
create policy "admins insert" on public.admins
  for insert to authenticated with check (public.is_admin());

-- 어드민: 삭제
drop policy if exists "admins delete" on public.admins;
create policy "admins delete" on public.admins
  for delete to authenticated using (public.is_admin());

-- 참고: 기존 "admins self select"(본인 행 조회) 정책은 그대로 둔다(로그인 게이트에서 사용).
