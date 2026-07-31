-- terms / terms-applicant 도입부 단락 추가
-- legal_docs 본문 맨 앞에 "시행일 + 이전 약관 안내 + 구분선" 삽입

UPDATE legal_docs SET
  body = '**시행일: 2026년 9월 1일**

이전 약관은 회사 웹사이트에서 확인할 수 있습니다.

---

' || body,
  updated_at = NOW()
WHERE slug IN ('terms', 'terms-applicant');

-- 확인: 앞 200자
SELECT slug, LEFT(body, 200) AS body_start
FROM legal_docs
WHERE slug IN ('terms', 'terms-applicant');
