-- ============================================================
-- AIVIEW 페이지별 SEO 메타데이터(초안) 관리 마이그레이션
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- (로컬엔 service_role/DB 접속정보가 없어 직접 적용이 안 됩니다.)
-- 관리자 판별: public.admins 테이블에 로그인 이메일이 있어야 함(기존 posts·faq·legal과 동일 방식).
-- ============================================================

-- 1) page_seo 테이블 ----------------------------------------
-- path 1건 = 페이지 1개. 어드민에서 초안을 만들고 수정하며,
-- published=true 인 행만 실제 페이지 metadata 로 반영된다(미적용/초안은 코드 기본값 유지).
create table if not exists public.page_seo (
  id              uuid primary key default gen_random_uuid(),
  path            text unique not null,   -- "/", "/apply", "/blog", "/privacy", "/terms", "/terms-applicant"
  label           text not null,          -- 어드민 표시용 이름(예: 홈(랜딩))
  title           text,                   -- <title> (비우면 코드 기본값)
  description     text,                   -- meta description
  og_title        text,                   -- 비우면 title 사용
  og_description  text,                   -- 비우면 description 사용
  og_image        text,                   -- 절대/상대 경로 (비우면 기본 og-image)
  noindex         boolean not null default false,  -- true 면 검색 색인 제외
  published       boolean not null default false,  -- false = 초안(미반영), true = 실제 페이지에 적용
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

alter table public.page_seo enable row level security;

-- 공개: 적용(published) 상태만 읽기 — 페이지 metadata 생성에 사용
drop policy if exists "page_seo public read" on public.page_seo;
create policy "page_seo public read" on public.page_seo
  for select using (published = true);

-- 관리자: 전체 CRUD (초안 포함 모두 조회/수정)
drop policy if exists "page_seo admin all" on public.page_seo;
create policy "page_seo admin all" on public.page_seo
  for all to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

-- 2) 기본 페이지 6건 시드 (테이블이 비어 있을 때만) ----------------
-- 초안(published=false)으로만 넣어 둔다. 어드민에서 내용 채우고 "적용"하면 반영됨.
insert into public.page_seo (path, label, sort_order)
select * from (values
  ('/',                '홈 (랜딩)',            1),
  ('/apply',           '도입문의',             2),
  ('/blog',            '블로그 목록',          3),
  ('/privacy',         '개인정보처리방침',     4),
  ('/terms',           '서비스 이용약관(기업)', 5),
  ('/terms-applicant', '지원자용 이용약관',    6)
) as v(path, label, sort_order)
where not exists (select 1 from public.page_seo);
