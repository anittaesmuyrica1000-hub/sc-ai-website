-- 소개서 신청 리드(brochure_requests)에 UTM 유입 추적 컬럼 추가
-- /brochure?utm_source=...&utm_medium=...&utm_campaign=...&utm_id=...&utm_term=...&utm_content=...
-- (랜딩(/) 등 다른 페이지로 유입돼도 세션에 저장된 utm이 폼 제출 시 함께 저장됨 — lib/utm.ts)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- 모두 nullable text, IF NOT EXISTS 이므로 중복 실행/기존 데이터에 안전.

alter table public.brochure_requests add column if not exists utm_source   text;
alter table public.brochure_requests add column if not exists utm_medium   text;
alter table public.brochure_requests add column if not exists utm_campaign text;
alter table public.brochure_requests add column if not exists utm_id       text;
alter table public.brochure_requests add column if not exists utm_term     text;
alter table public.brochure_requests add column if not exists utm_content  text;
