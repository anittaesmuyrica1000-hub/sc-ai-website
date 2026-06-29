-- ============================================================
-- AIVIEW 페이지별 SEO 추천 문구 초안 채우기
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- page-seo-setup.sql 을 먼저 실행해 page_seo 테이블이 있어야 합니다.
--
-- published=false(초안)로만 넣습니다. 어드민 SEO 메뉴에서 검토 후
-- "적용"을 켜야 실제 페이지에 반영됩니다. (지금은 사이트에 영향 없음)
-- ============================================================

insert into public.page_seo (path, label, title, description, published, sort_order)
values
  ('/',                '홈 (랜딩)',
   'AI면접 — AI 면접으로 검증된 핵심 인재만 채용',
   'AI 면접이 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달합니다. 가짜 이력서·과장 스펙을 걸러내는 B2B 채용 검증 솔루션.',
   false, 1),

  ('/apply',           '도입문의',
   '도입 문의 — AI면접 무료로 시작하기',
   'AIVIEW 도입 상담을 신청하세요. 팀 채용 규모에 맞춰 AI 면접 검증 프로세스를 제안드립니다. 서류·면접 공수를 줄이는 가장 빠른 길.',
   false, 2),

  ('/blog',            '블로그 목록',
   '블로그 — AI 채용·면접 자동화 인사이트',
   'AI 면접, 채용 검증, HR 트렌드에 대한 최신 인사이트와 실전 사례. 채용 담당자를 위한 AI면접 블로그.',
   false, 3),

  ('/privacy',         '개인정보처리방침',
   '개인정보처리방침',
   'AIVIEW(AI면접) 개인정보처리방침 — 개인정보 수집·이용, 제3자 공유, 데이터 보안, 열람·정정·삭제 권리를 안내합니다.',
   false, 4),

  ('/terms',           '서비스 이용약관(기업)',
   '서비스 이용약관 (기업용)',
   'AIVIEW AI 면접 서비스 기업용(채용사) 이용약관 — 이용계약, 권리·의무, 유료서비스·크레딧, 환불 및 책임 범위를 규정합니다.',
   false, 5),

  ('/terms-applicant', '지원자용 이용약관',
   '지원자용 서비스 이용약관',
   'AIVIEW AI 면접 지원자용 이용약관 — 응시 절차, 면접데이터 처리, 지원자의 권리·의무와 책임 제한을 규정합니다.',
   false, 6)
on conflict (path) do update set
  title       = excluded.title,
  description = excluded.description,
  label       = excluded.label,
  updated_at  = now();
  -- 주의: published 는 일부러 덮어쓰지 않습니다.
  --       이미 "적용 중"인 페이지가 있다면 그 상태를 유지하고 문구만 갱신합니다.
  --       (처음 시드된 행은 published=false 이므로 초안으로 들어갑니다.)
