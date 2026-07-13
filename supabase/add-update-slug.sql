-- 제품 업데이트 URL slug (블로그 slug와 동일 패턴)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 1회 실행하세요. (MCP는 읽기 전용이라 코드로는 실행 불가)

-- slug 컬럼 + 중복 방지(부분 유니크 인덱스: slug가 있을 때만 유니크)
alter table public.updates add column if not exists slug text;
create unique index if not exists updates_slug_key on public.updates (slug) where slug is not null;
