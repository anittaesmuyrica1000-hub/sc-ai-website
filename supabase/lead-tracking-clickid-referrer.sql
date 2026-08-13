-- 리드(signups·brochure_requests)에 광고 클릭 ID·referrer 유입 추적 컬럼 추가
-- gclid   : 구글애즈 자동 태깅 클릭 ID (utm 없이 gclid만 붙는 캠페인 대응)
-- fbclid  : 메타(페이스북·인스타그램) 광고 클릭 ID
-- referrer: utm·클릭 ID가 없는 유입의 외부 referrer 호스트명(예: www.google.com)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- 모두 nullable text, IF NOT EXISTS 이므로 중복 실행/기존 데이터에 안전.

alter table public.signups add column if not exists gclid    text;
alter table public.signups add column if not exists fbclid   text;
alter table public.signups add column if not exists referrer text;

alter table public.brochure_requests add column if not exists gclid    text;
alter table public.brochure_requests add column if not exists fbclid   text;
alter table public.brochure_requests add column if not exists referrer text;
