-- 소개서 다운로드 클릭 추적 컬럼 추가
-- 메일의 "자료 다운로드" 버튼이 /api/brochure-download?t=<download_token> 을 거쳐
-- 클릭 시각(downloaded_at, 최초 1회)·횟수(download_count)를 기록한 뒤 파일로 리다이렉트한다.
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- IF NOT EXISTS 이므로 중복 실행/기존 데이터에 안전. 기존 행에도 토큰이 자동 부여된다.

alter table public.brochure_requests add column if not exists download_token uuid not null default gen_random_uuid();
create unique index if not exists brochure_requests_download_token_key on public.brochure_requests (download_token);
alter table public.brochure_requests add column if not exists downloaded_at timestamptz;
alter table public.brochure_requests add column if not exists download_count integer not null default 0;
