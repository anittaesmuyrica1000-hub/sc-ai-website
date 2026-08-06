-- 약관 3개 시행일 변경: 2026년 8월 15일로 업데이트
-- effective_date · meta · body 내 날짜 표기 모두 수정
-- Supabase 대시보드 > SQL Editor 에서 실행

-- ① 개인정보처리방침
UPDATE legal_docs SET
  effective_date = '2026-08-15',
  meta  = REPLACE(meta,  '2026년 8월 1일', '2026년 8월 15일'),
  body  = REPLACE(body,  '2026년 8월 1일', '2026년 8월 15일'),
  updated_at = NOW()
WHERE slug = 'privacy';

-- ② 채용회사용 서비스 이용약관
UPDATE legal_docs SET
  effective_date = '2026-08-15',
  meta  = REPLACE(meta,  '2026년 9월 1일', '2026년 8월 15일'),
  body  = REPLACE(body,  '2026년 9월 1일', '2026년 8월 15일'),
  updated_at = NOW()
WHERE slug = 'terms';

-- ③ 지원자용 서비스 이용약관
UPDATE legal_docs SET
  effective_date = '2026-08-15',
  meta  = REPLACE(meta,  '2026년 9월 1일', '2026년 8월 15일'),
  body  = REPLACE(body,  '2026년 9월 1일', '2026년 8월 15일'),
  updated_at = NOW()
WHERE slug = 'terms-applicant';

-- 결과 확인 (3건 모두 2026-08-15가 나와야 정상)
SELECT slug, effective_date, meta
FROM legal_docs
WHERE slug IN ('privacy', 'terms', 'terms-applicant')
ORDER BY sort_order;
