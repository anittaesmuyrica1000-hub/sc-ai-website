-- 유입 경로 직접 수집(how_found) 컬럼 추가
-- 배경: utm·referrer는 카카오톡·메일 클라이언트·인앱브라우저 유입에서 아예 전달되지 않아
--       어드민 "유입" 칸이 "—"로 남는다. 폼에서 직접 물어 그 공백을 메운다.
-- 대상: signups(도입문의), brochure_requests(소개서 신청)
-- 적용: Supabase 대시보드 → SQL Editor에 붙여넣고 Run. (여러 번 실행해도 안전)

alter table public.signups
  add column if not exists how_found        text,
  add column if not exists how_found_detail text;

alter table public.brochure_requests
  add column if not exists how_found        text,
  add column if not exists how_found_detail text;

comment on column public.signups.how_found is
  '유입 경로(폼 직접 응답): search|ad|sns|referral|email|content|event|sales|etc — lib/leadForm.ts HOW_FOUND_OPTIONS';
comment on column public.signups.how_found_detail is
  '유입 경로가 etc(기타)일 때 사용자가 직접 적은 내용';
comment on column public.brochure_requests.how_found is
  '유입 경로(폼 직접 응답): search|ad|sns|referral|email|content|event|sales|etc — lib/leadForm.ts HOW_FOUND_OPTIONS';
comment on column public.brochure_requests.how_found_detail is
  '유입 경로가 etc(기타)일 때 사용자가 직접 적은 내용';

-- 확인
-- select column_name from information_schema.columns
--  where table_schema='public' and table_name in ('signups','brochure_requests')
--    and column_name like 'how_found%';
