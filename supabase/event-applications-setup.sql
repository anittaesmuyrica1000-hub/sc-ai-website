-- ============================================================
-- 이벤트 참가 신청(event_applications)
-- 2026 슈퍼코더 AI 면접 대회 — /event/ai-mock-challenge-2026/apply
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- (로컬엔 DB 접속정보가 없어 DDL 직접 적용이 안 됩니다.)
--
-- ⚠️ signups·brochure_requests(기업 리드)와 성격이 다르다. 여기 담기는 건 개인(지원자)
--    정보이고 보유기간이 이벤트 페이지 유의사항에 공지돼 있다 —
--    **2027-02-28 전량 파기**. 그날 아래 4) 파기 쿼리를 1회 실행한다.
-- ============================================================

-- 1) 테이블 -----------------------------------------------------
create table if not exists public.event_applications (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  -- 어떤 이벤트인지. lib/events.ts 의 slug 와 같은 값
  event_slug        text not null,

  -- 지원자 입력
  name              text not null,
  phone             text not null,           -- 숫자만 정규화해서 저장(쿠폰 발송용)
  email             text not null,           -- 면접 링크 발송용
  job               text not null,           -- marketing | dev  (한 직군만 선택)
  applicant_type    text not null,           -- undergrad | grad | graduated | etc
  final_attend      text not null,           -- yes | no | undecided (11/14 오프라인 AI 역량 검사)
  how_found         text,                    -- 유입 경로 직접 응답(채널별 성과 측정)
  how_found_detail  text,

  -- 동의 (지원 폼에서 받은 값을 그대로 보존 — 분쟁 시 근거가 된다)
  consent_privacy   boolean not null default false,  -- [필수] 개인정보 수집·이용
  consent_fiction   boolean not null default false,  -- [필수] 슈퍼전자가 가상기업임을 확인
  consent_content   boolean not null default false,  -- [선택] 응답의 비식별 콘텐츠 활용

  -- 운영
  is_test           boolean not null default false,   -- 내부 제출 테스트·스팸. 집계에서 제외
  status            text not null default '신규',
  admin_note        text,
  coupon_sent_at    timestamptz,             -- 쿠폰 발송 완료 시각(11/13 일괄 발송)

  -- 유입 추적 (lib/utm.ts — signups 와 같은 컬럼 구성)
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_id            text,
  utm_term          text,
  utm_content       text,
  gclid             text,
  fbclid            text,
  referrer          text
);

-- 이미 테이블이 있던 경우 대비(중복 실행 안전)
alter table public.event_applications add column if not exists coupon_sent_at timestamptz;
-- 쿠폰 선착순 판정 기준. 자세한 배경은 supabase/event-applications-interview-done-at.sql
alter table public.event_applications add column if not exists interview_done_at timestamptz;
alter table public.event_applications add column if not exists consent_content boolean not null default false;

-- 2) 중복 지원 차단 ---------------------------------------------
-- 기획안 slide 10: "중복 지원·허위 기재·참가 대상이 아닌 경우는 빼고 다음 순번으로 넘깁니다."
-- 선착순 판정이 제출 시각 기준이므로 중복은 DB에서 막는다(애플리케이션 체크만으론 동시 제출에 샌다).
-- is_test 행은 제외 — 10/2 제출 테스트를 몇 번이든 다시 할 수 있어야 한다.
create unique index if not exists event_applications_slug_phone_uidx
  on public.event_applications (event_slug, phone) where is_test = false;
create unique index if not exists event_applications_slug_email_uidx
  on public.event_applications (event_slug, lower(email)) where is_test = false;

-- 선착순 집계·어드민 목록 정렬용
create index if not exists event_applications_created_idx
  on public.event_applications (event_slug, created_at);

-- 3) RLS -------------------------------------------------------
alter table public.event_applications enable row level security;

-- anon 은 읽기·쓰기 모두 불가. 저장은 서버 라우트(/api/event-apply)가 service_role 로 한다.
-- (policy 를 만들지 않으면 RLS 가 전부 차단한다 — signups 와 같은 방식)
drop policy if exists "event_applications anon insert" on public.event_applications;

-- 관리자: 읽기 + 상태/메모 수정
drop policy if exists "event_applications admin read" on public.event_applications;
create policy "event_applications admin read" on public.event_applications
  for select to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins));

drop policy if exists "event_applications admin update" on public.event_applications;
create policy "event_applications admin update" on public.event_applications
  for update to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

drop policy if exists "event_applications admin delete" on public.event_applications;
create policy "event_applications admin delete" on public.event_applications
  for delete to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins));


-- ============================================================
-- 운영 쿼리 (필요할 때 SQL Editor 에서 실행)
-- ============================================================

-- 선착순 30명 — 쿠폰 지급 대상. 기준은 "1차 AI 면접 완료 선착순"이므로
-- 면접 응시 결과와 대조한 뒤 발송한다(이 쿼리는 지원 순번만 보여준다).
-- select row_number() over (order by created_at) as no, created_at, name, phone, job
--   from public.event_applications
--  where event_slug = 'ai-mock-challenge-2026' and is_test = false
--  order by created_at limit 150;

-- 직군별 지원자 수 (10/16 판정용)
-- select job, count(*) from public.event_applications
--  where event_slug = 'ai-mock-challenge-2026' and is_test = false group by job;

-- 4) 개인정보 파기 — 2027-02-28 에 1회 실행 -------------------
-- 이벤트 페이지 유의사항에 "2027년 2월 28일까지 전량 파기"로 공지한 값이다. 반드시 실행한다.
-- delete from public.event_applications where event_slug = 'ai-mock-challenge-2026';
