-- 도입문의(signups)에 UTM 유입 추적 컬럼 추가
-- /apply?utm_source=...&utm_medium=...&utm_campaign=...&utm_id=...&utm_term=...&utm_content=...
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- 모두 nullable text, IF NOT EXISTS 이므로 중복 실행/기존 데이터에 안전.

alter table public.signups add column if not exists utm_source   text;
alter table public.signups add column if not exists utm_medium   text;
alter table public.signups add column if not exists utm_campaign text;
alter table public.signups add column if not exists utm_id       text;
alter table public.signups add column if not exists utm_term     text;
alter table public.signups add column if not exists utm_content  text;
