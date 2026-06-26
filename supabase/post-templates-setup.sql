-- ============================================================
-- AIVIEW 블로그 글 템플릿 테이블
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- (로컬엔 service_role/DB 접속정보가 없어 직접 적용이 안 됩니다.)
-- 관리자 판별: public.admins 테이블에 로그인 이메일이 있어야 함(기존 posts/faq와 동일 방식).
-- 용도: 어드민 '블로그 글쓰기' 편집기에서 자주 쓰는 글 구조를 저장/불러오기.
-- ============================================================

create table if not exists public.post_templates (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  html        text not null,
  created_at  timestamptz not null default now()
);

alter table public.post_templates enable row level security;

-- 관리자 전용: 읽기/쓰기 모두 admins 이메일만 (공개 노출 없음)
drop policy if exists "post_templates admin all" on public.post_templates;
create policy "post_templates admin all" on public.post_templates
  for all to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));
