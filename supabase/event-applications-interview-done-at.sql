-- ============================================================
-- event_applications: 1차 직무 AI 면접 완료 시각 기록
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- (로컬엔 DB 접속정보가 없어 DDL 직접 적용이 안 됩니다.)
--
-- 왜 필요한가
--   쿠폰 지급 기준은 "1차 직무 AI 면접 완료 선착순 30명"(2026-09-28 확정, 10/2 회의에서 100명 → 30명)인데,
--   지금 어드민의 '순번'은 **지원서 제출 순서**다. 둘은 다른 값이다 —
--   먼저 지원한 사람이 면접을 늦게 볼 수 있다.
--   면접을 마친 시각을 남겨 두지 않으면 나중에 누가 30등 안인지 되살릴 방법이 없다.
--
-- 값이 채워지는 경로
--   어드민에서 진행 상태를 '면접 완료' 로 바꾸는 순간 자동으로 now() 가 찍힌다.
--   이미 값이 있으면 덮어쓰지 않는다(상태를 오갔다고 순번이 밀리면 안 된다).
--   실제 응시 시각과 다르면 어드민 표에서 직접 고칠 수 있다.
-- ============================================================

alter table public.event_applications
  add column if not exists interview_done_at timestamptz;

comment on column public.event_applications.interview_done_at is
  '1차 직무 AI 면접을 끝까지 마친 시각. 쿠폰 선착순 100명 판정 기준(지원 순서가 아니다)';

-- 선착순 판정용 정렬 인덱스. is_test 행은 집계에서 빠지므로 제외한다.
create index if not exists event_applications_interview_done_idx
  on public.event_applications (event_slug, interview_done_at)
  where interview_done_at is not null and is_test = false;

-- 확인용 — 쿠폰 지급 대상 30명을 면접 완료 시각 순으로 뽑는다.
-- (파기일 전까지 이 쿼리 하나로 지급 대상을 다시 만들 수 있어야 한다)
--
-- select row_number() over (order by interview_done_at) as 쿠폰순번,
--        name, phone, email, interview_done_at
--   from public.event_applications
--  where event_slug = 'ai-mock-challenge-2026'
--    and is_test = false
--    and interview_done_at is not null
--  order by interview_done_at
--  limit 30;
