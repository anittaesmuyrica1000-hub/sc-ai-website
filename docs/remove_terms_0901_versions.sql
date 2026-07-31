-- terms / terms-applicant 의 legal_doc_versions 에서
-- 잘못 아카이브된 2026-09-01 행 삭제
-- (v3.1 업데이트 시 아카이브 과정에서 생긴 중간 버전)

DELETE FROM legal_doc_versions
WHERE slug IN ('terms', 'terms-applicant')
  AND effective_date = '2026-09-01';

-- 결과 확인: terms/terms-applicant 이력에 2026-02-01만 남아야 정상
SELECT slug, effective_date, version
FROM legal_doc_versions
WHERE slug IN ('terms', 'terms-applicant')
ORDER BY slug, effective_date DESC;
