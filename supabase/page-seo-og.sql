-- ============================================================
-- AIVIEW 페이지별 OG(공유 카드) 문구 채우기
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- page-seo-setup.sql / page-seo-recommended.sql 이후에 실행합니다.
--
-- 이미 published=true 인 행의 OG 필드만 갱신하며, published 상태는 건드리지 않습니다.
-- (적용 중인 페이지는 그대로 적용 유지 + OG만 보강)
-- ============================================================

update public.page_seo set
  og_title = 'AI 면접으로 검증된 핵심 인재만 만나세요',
  og_description = '지원자는 AI 면접이 자동 검증, 채용팀엔 검증된 핵심 인재 리포트만. 가짜 이력서·과장 스펙 없는 채용을 시작하세요.',
  og_image = '/og-image.png?v=2',
  updated_at = now()
where path = '/';

update public.page_seo set
  og_title = 'AI면접 무료 도입 — 우리 팀 채용에 맞춰 제안',
  og_description = '도입 상담을 신청하면 채용 규모에 맞는 AI 면접 검증 프로세스를 제안드립니다. 공수를 줄이는 가장 빠른 길.',
  og_image = '/og-image.png?v=2',
  updated_at = now()
where path = '/apply';

update public.page_seo set
  og_title = 'AIVIEW 블로그 — AI 채용·면접 인사이트',
  og_description = 'AI 면접·채용 검증·HR 트렌드까지, 채용 담당자를 위한 실전 인사이트와 사례.',
  og_image = '/og-image.png?v=2',
  updated_at = now()
where path = '/blog';

update public.page_seo set
  og_title = '개인정보처리방침 · AIVIEW',
  og_description = 'AIVIEW가 개인정보를 어떻게 수집·이용·보호하는지 안내합니다.',
  og_image = '/og-image.png?v=2',
  updated_at = now()
where path = '/privacy';

update public.page_seo set
  og_title = '서비스 이용약관(기업용) · AIVIEW',
  og_description = 'AIVIEW AI 면접 서비스 기업용(채용사) 이용약관 안내.',
  og_image = '/og-image.png?v=2',
  updated_at = now()
where path = '/terms';

update public.page_seo set
  og_title = '지원자용 이용약관 · AIVIEW',
  og_description = 'AIVIEW AI 면접 응시 지원자를 위한 이용약관 안내.',
  og_image = '/og-image.png?v=2',
  updated_at = now()
where path = '/terms-applicant';
