-- terms / terms-applicant를 legal_docs에 추가 (어드민에서 관리 가능하게)
-- Supabase 대시보드 > SQL Editor 에서 실행
-- 이미 있으면 중복 삽입 안 함(NOT EXISTS 조건)

INSERT INTO legal_docs (slug, title, meta, body, sort_order, published, effective_date, version)
SELECT slug, title, meta, body, sort_order, true, effective_date, version
FROM (
  SELECT
    v.slug, v.title, v.meta, v.body, v.effective_date, v.version,
    CASE WHEN v.slug = 'terms' THEN 2 ELSE 3 END AS sort_order
  FROM legal_doc_versions v
  WHERE v.id IN (
    'f543ba46-afc9-4311-b55c-050c3050e4b6',  -- terms v2 (2026-09-01)
    'b45390c4-82d2-42fb-83be-92d6ac24ab7f'   -- terms-applicant v2 (2026-09-01)
  )
) src
WHERE NOT EXISTS (
  SELECT 1 FROM legal_docs d WHERE d.slug = src.slug
);

-- 결과 확인
SELECT slug, version, effective_date, published FROM legal_docs ORDER BY sort_order;
