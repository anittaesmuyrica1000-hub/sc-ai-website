-- ============================================================
-- AIVIEW 블로그 — URL slug + SEO 메타데이터 직접 입력 컬럼
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- 비파괴(add column if not exists) — 기존 글/주소에 영향 없음.
-- ============================================================

-- 읽기 좋은 주소(slug). 비우면 기존 UUID 주소 사용. 중복 방지 unique.
alter table public.posts add column if not exists slug text;
-- (부분) 유니크 인덱스 — slug가 있는 글끼리만 중복 금지
create unique index if not exists posts_slug_key on public.posts (slug) where slug is not null;

-- 검색결과용 제목/설명(비우면 글 제목·요약 자동 사용)
alter table public.posts add column if not exists meta_title text;
alter table public.posts add column if not exists meta_description text;
