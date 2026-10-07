-- ============================================================
-- event_applications: 11/14 현장 사진의 홍보 활용 동의 [선택]
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- (로컬엔 DB 접속정보가 없어 DDL 직접 적용이 안 됩니다.)
--
-- ⚠️ **배포 전에 먼저 실행해야 한다.** /api/event-apply 가 이 컬럼을 함께 insert 하므로,
--    컬럼이 없는 상태로 코드가 올라가면 지원서 접수가 전부 실패한다(PGRST204).
--
-- 왜 필요한가
--   11월 14일 현장에서는 검사·인터뷰와 상장 수여 장면을 **사진으로만** 찍는다(영상 없음).
--   이 사진과 이름·소속을 홍보에 쓰는 동의를 예전에는 'Finalist 확정 후 따로' 받기로 했는데,
--   발표(11/11)와 현장(11/14) 사이가 사흘이라 그 사이에 동의를 못 받으면 그날 사진을 한 장도 못 쓴다.
--   그래서 지원 시점에 [선택] 항목으로 미리 받는다(2026-10-06).
--   동의하지 않아도 참가와 Finalist 선발에는 영향이 없다 — 이벤트 페이지 유의사항과 같은 약속이다.
-- ============================================================

alter table public.event_applications
  add column if not exists consent_photo boolean not null default false;

comment on column public.event_applications.consent_photo is
  '[선택] 11/14 현장 사진과 이름·소속의 홍보 활용 동의. 지원 시점에 받는다(Finalist 가 아니면 쓰이지 않는다)';

-- 확인용 — Finalist 후보 중 사진을 쓸 수 있는 사람
-- select name, phone, final_attend, consent_photo
--   from public.event_applications
--  where event_slug = 'ai-mock-challenge-2026' and is_test = false
--  order by created_at;
