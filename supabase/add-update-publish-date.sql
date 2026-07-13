-- 제품 업데이트 '배포일'(publish_date) — 생성일(created_at)과 별개로 릴리즈 날짜를 직접 지정.
-- Supabase 대시보드 → SQL Editor에 붙여넣고 1회 실행. (기존 데이터 무손실)

alter table public.updates add column if not exists publish_date date;

-- 기존 항목은 생성일(날짜)로 초기화(선택) — 배포일 비어 있으면 created_at 날짜로 채움
update public.updates set publish_date = (created_at at time zone 'Asia/Seoul')::date where publish_date is null;
