-- 약관 본문에서 버전 표기 제거
-- Supabase 대시보드 > SQL Editor 에서 실행

-- ① 기업용/지원자용 약관: "시행·개정 이력" 표에서 [버전] 열 제거
UPDATE legal_doc_versions SET body =
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(body,
          '| 시행일 | 버전 | 주요',
          '| 시행일 | 주요'),
        '|---|---|---|---|',
        '|---|---|---|'),
      '| v1.0 | 최초 제정 |',
      '| 최초 제정 |'),
    '| v3.1 | ',
    '| ')
WHERE slug IN ('terms', 'terms-applicant');

-- ② 개인정보처리방침 (legal_docs): "v1.1" "v1.0" 등 버전 표기 제거
UPDATE legal_docs SET body =
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(body,
          '개정 안내 (v1.1):', '개정 안내:'),
        '- v1.0 — ', '- '),
      '- v1.1 — ', '- '),
    '본 방침(v1.1)은 ', '본 방침은 ')
WHERE slug = 'privacy';

-- ③ 개인정보처리방침 이력(versions)도 동일하게 처리
UPDATE legal_doc_versions SET body =
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(body,
          '개정 안내 (v1.1):', '개정 안내:'),
        '- v1.0 — ', '- '),
      '- v1.1 — ', '- '),
    '본 방침(v1.1)은 ', '본 방침은 ')
WHERE slug = 'privacy';

-- 확인
SELECT slug, version, effective_date FROM legal_doc_versions ORDER BY slug, version DESC;
