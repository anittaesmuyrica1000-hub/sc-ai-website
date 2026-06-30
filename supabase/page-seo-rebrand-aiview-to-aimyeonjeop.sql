-- ============================================================
-- AIVIEW → AI면접 워딩 일괄 변경 (페이지별 SEO 메타데이터)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
--
-- "AIVIEW"가 들어간 description·og_title·og_description 만 자연스럽게 교체합니다.
-- title 6개와 홈(/)에는 AIVIEW가 없어 변경 대상이 아닙니다.
-- published(적용) 상태는 건드리지 않고 문구만 갱신합니다. (적용 중인 페이지는 즉시 반영)
-- ============================================================

-- /apply ----------------------------------------------------
update public.page_seo set
  description = 'AI면접 도입 상담을 신청하세요. 팀 채용 규모에 맞춰 AI 면접 검증 프로세스를 제안드립니다. 서류·면접 공수를 줄이는 가장 빠른 길.',
  updated_at = now()
where path = '/apply';

-- /blog -----------------------------------------------------
update public.page_seo set
  og_title = 'AI면접 블로그 — AI 채용·면접 인사이트',
  updated_at = now()
where path = '/blog';

-- /privacy --------------------------------------------------
update public.page_seo set
  description = 'AI면접 개인정보처리방침 — 개인정보 수집·이용, 제3자 공유, 데이터 보안, 열람·정정·삭제 권리를 안내합니다.',
  og_title = '개인정보처리방침 · AI면접',
  og_description = 'AI면접이 개인정보를 어떻게 수집·이용·보호하는지 안내합니다.',
  updated_at = now()
where path = '/privacy';

-- /terms ----------------------------------------------------
update public.page_seo set
  description = 'AI면접 채용 서비스의 기업용(채용사) 이용약관 — 이용계약, 권리·의무, 유료서비스·크레딧, 환불 및 책임 범위를 규정합니다.',
  og_title = '서비스 이용약관(기업용) · AI면접',
  og_description = 'AI면접 채용 서비스 기업용(채용사) 이용약관 안내.',
  updated_at = now()
where path = '/terms';

-- /terms-applicant ------------------------------------------
update public.page_seo set
  description = 'AI면접 채용 서비스의 지원자용 이용약관 — 응시 절차, 면접데이터 처리, 지원자의 권리·의무와 책임 제한을 규정합니다.',
  og_title = '지원자용 이용약관 · AI면접',
  og_description = 'AI면접 채용 서비스 응시 지원자를 위한 이용약관 안내.',
  updated_at = now()
where path = '/terms-applicant';
