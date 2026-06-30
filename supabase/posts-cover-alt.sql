-- 블로그 커버 이미지 대체텍스트(alt) 컬럼 추가
-- 접근성(스크린리더) + SEO용. 렌더링은 cover_alt가 비면 제목으로 폴백.
-- Supabase SQL Editor에서 1회 실행.

alter table public.posts add column if not exists cover_alt text;

-- (참고) 기존 글의 alt는 어드민 블로그 편집기 또는 별도 데이터 업데이트로 채운다.
