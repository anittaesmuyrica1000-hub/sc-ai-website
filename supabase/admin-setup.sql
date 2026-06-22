-- ============================================================
-- AIVIEW 어드민 확장용 마이그레이션
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- (로컬엔 service_role/DB 접속정보가 없어 직접 적용이 안 됩니다.)
-- 관리자 판별: public.admins 테이블에 로그인 이메일이 있어야 함(기존 posts와 동일 방식).
-- ============================================================

-- 1) FAQ 테이블 -------------------------------------------------
create table if not exists public.faq (
  id          uuid primary key default gen_random_uuid(),
  category    text,
  question    text not null,
  answer      text not null,
  sort_order  int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
-- 이미 테이블이 있던 경우 대비
alter table public.faq add column if not exists category text;

alter table public.faq enable row level security;

-- 공개: 게시된 FAQ만 읽기
drop policy if exists "faq public read" on public.faq;
create policy "faq public read" on public.faq
  for select using (published = true);

-- 관리자: 전체 CRUD
drop policy if exists "faq admin all" on public.faq;
create policy "faq admin all" on public.faq
  for all to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

-- 기존 5개 FAQ 시드 (테이블이 비어 있을 때만)
insert into public.faq (category, question, answer, sort_order, published)
select * from (values
  ('도입', 'AI 면접은 어떻게 진행되나요?', '지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AI가 응답을 분석해 역량 평가와 핵심 요약이 담긴 리포트를 생성하며, 채용팀은 리포트를 바탕으로 후보자를 검토합니다.', 1, true),
  ('기능', '기존 ATS·채용 툴과 연동되나요?', '리포트는 표준 형식으로 제공되어 기존 채용 프로세스에 바로 활용할 수 있습니다. 상세 연동 방식은 도입 상담에서 안내해 드립니다.', 2, true),
  ('도입', '도입까지 얼마나 걸리나요?', '무료 신청 후 담당자가 도입 방식과 데모를 안내드립니다. 별도 설치 없이 온라인으로 진행할 수 있습니다.', 3, true),
  ('보안', '지원자 데이터는 안전하게 관리되나요?', '모든 데이터는 전송 구간 암호화(HTTPS)와 접근 통제 정책 아래 관리됩니다. 수집 항목과 처리 방식은 개인정보처리방침에서 확인하실 수 있습니다.', 4, true),
  ('비용', '비용은 어떻게 책정되나요?', '채용 규모와 활용 방식에 맞춰 책정됩니다. 우선 무료로 도입 효과를 확인해 보신 뒤, 상담을 통해 안내해 드립니다.', 5, true)
) as v(category, question, answer, sort_order, published)
where not exists (select 1 from public.faq);

-- 2) signups(도입문의) 관리자 읽기 + 상태 관리 ----------------
-- 기존: anon insert만 허용. 어드민이 목록을 보고 상태/내부메모를 바꾸려면 select/update 정책 필요.
alter table public.signups add column if not exists status text not null default '신규';
alter table public.signups add column if not exists admin_note text;

drop policy if exists "signups admin read" on public.signups;
create policy "signups admin read" on public.signups
  for select to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins));

drop policy if exists "signups admin update" on public.signups;
create policy "signups admin update" on public.signups
  for update to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

-- 3) brochure_requests(소개서 신청 리드) 관리자 읽기 정책 -------
drop policy if exists "brochure_requests admin read" on public.brochure_requests;
create policy "brochure_requests admin read" on public.brochure_requests
  for select to authenticated
  using (auth.jwt() ->> 'email' in (select email from public.admins));
