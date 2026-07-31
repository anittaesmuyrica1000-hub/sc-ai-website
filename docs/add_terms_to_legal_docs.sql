-- terms / terms-applicant를 legal_docs에 추가 (어드민에서 관리 가능하게)
-- Supabase 대시보드 > SQL Editor 에서 실행
-- ※ 두 INSERT를 따로 실행하거나, 한 번에 실행 모두 가능

-- ① 기업용 약관 추가
INSERT INTO legal_docs (slug, title, meta, body, sort_order, published, effective_date, version)
SELECT
  'terms' AS slug,
  title, meta, body,
  2 AS sort_order,
  true AS published,
  effective_date,
  version
FROM legal_doc_versions
WHERE id = 'f543ba46-afc9-4311-b55c-050c3050e4b6'
ON CONFLICT (slug) DO NOTHING;

-- ② 지원자용 약관 추가
INSERT INTO legal_docs (slug, title, meta, body, sort_order, published, effective_date, version)
SELECT
  'terms-applicant' AS slug,
  title, meta, body,
  3 AS sort_order,
  true AS published,
  effective_date,
  version
FROM legal_doc_versions
WHERE id = 'b45390c4-82d2-42fb-83be-92d6ac24ab7f'
ON CONFLICT (slug) DO NOTHING;

-- 결과 확인 (3건이 나와야 정상)
SELECT slug, version, effective_date, published FROM legal_docs ORDER BY sort_order;
