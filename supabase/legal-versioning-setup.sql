-- ============================================================
-- AIVIEW 약관 — 버전 관리(시행일 + 버전 이력)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- 비파괴 — 기존 legal_docs 데이터에 영향 없음.
-- ============================================================

-- 1) 현재 약관에 시행일·버전번호
alter table public.legal_docs add column if not exists effective_date date;
alter table public.legal_docs add column if not exists version int not null default 1;

-- 2) 버전 스냅샷 보관 테이블 (저장할 때마다 직전 내용 1줄 적재)
create table if not exists public.legal_doc_versions (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null,
  version        int  not null,
  title          text not null,
  meta           text,
  body           text not null,
  effective_date date,
  created_at     timestamptz not null default now()
);
create index if not exists legal_doc_versions_slug_idx on public.legal_doc_versions (slug, version desc);

alter table public.legal_doc_versions enable row level security;

-- 공개: 게시 약관의 과거 버전도 열람 가능(아카이브)
drop policy if exists "legal versions public read" on public.legal_doc_versions;
create policy "legal versions public read" on public.legal_doc_versions
  for select using (true);

-- 관리자: 전체 CRUD (기존 legal_docs와 동일 패턴)
drop policy if exists "legal versions admin all" on public.legal_doc_versions;
create policy "legal versions admin all" on public.legal_doc_versions
  for all to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));
