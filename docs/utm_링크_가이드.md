# UTM 링크 가이드 — 잠재고객 유입 경로 추적

작성일: 2026-08-06

## 어떻게 동작하나

- 외부 채널(뉴스레터·광고·SNS 등)에 **UTM 파라미터를 붙인 링크**를 쓰면, 방문자가 어떤 페이지로 들어오든 사이트가 UTM을 세션에 저장해 둔다(`lib/utm.ts` + `UtmCapture`).
- 이후 **도입문의(/apply) 또는 소개서 신청(/brochure) 폼을 제출하면 리드에 UTM이 함께 저장**된다 → 어드민 접수 내역의 "유입" 열과 CSV에서 리드별 유입 경로 확인 가능.
- GA4도 UTM을 자동 인식하므로 별도 설정 없이 세션·전환(apply_lead / brochure_lead) 출처 리포트에 잡힌다.

## 규칙 (일관성이 생명)

| 파라미터 | 용도 | 값 규칙 |
|---|---|---|
| `utm_source` | 어디서 (매체 이름) | `stibee`, `google`, `naver`, `linkedin`, `kakao`, `facebook`, `remember` … |
| `utm_medium` | 어떤 방식 | `email`, `cpc`, `social`, `display`, `referral`, `qr` |
| `utm_campaign` | 무슨 캠페인 | 소문자·하이픈, 날짜 포함 권장. 예: `terms-v3-notice-202608`, `launch-202607` |
| `utm_content` | (선택) 같은 캠페인 내 소재 구분 | `cta-top`, `cta-bottom`, `banner-a` |
| `utm_term` | (선택) 검색광고 키워드 | `ai면접` |

- 값은 **소문자 + 하이픈**으로 통일 (GA4는 대소문자를 다른 값으로 집계).
- **사이트 내부 링크에는 UTM을 붙이지 않는다** — 내부 이동에 UTM을 붙이면 GA4 세션 출처가 "내부"로 덮여 원래 유입 채널을 잃는다. UTM은 외부 채널에 게시하는 링크에만.

## 바로 쓰는 링크 (복사용)

### 스티비 뉴스레터
```
https://www.supercoder.co/apply?utm_source=stibee&utm_medium=email&utm_campaign=뉴스레터명-YYYYMM
https://www.supercoder.co/brochure?utm_source=stibee&utm_medium=email&utm_campaign=뉴스레터명-YYYYMM
```
예 — 약관 v3.1 안내 메일:
```
https://www.supercoder.co/apply?utm_source=stibee&utm_medium=email&utm_campaign=terms-v31-notice-202608
https://www.supercoder.co/brochure?utm_source=stibee&utm_medium=email&utm_campaign=terms-v31-notice-202608
```

### 링크드인 (프로필·게시물)
```
https://www.supercoder.co/apply?utm_source=linkedin&utm_medium=social&utm_campaign=organic
https://www.supercoder.co/brochure?utm_source=linkedin&utm_medium=social&utm_campaign=organic
```

### 카카오톡 (채널·단체방 공유)
```
https://www.supercoder.co/apply?utm_source=kakao&utm_medium=social&utm_campaign=organic
https://www.supercoder.co/brochure?utm_source=kakao&utm_medium=social&utm_campaign=organic
```

### 검색광고 (구글/네이버)
```
https://www.supercoder.co/apply?utm_source=google&utm_medium=cpc&utm_campaign=캠페인명&utm_term=키워드
https://www.supercoder.co/apply?utm_source=naver&utm_medium=cpc&utm_campaign=캠페인명&utm_term=키워드
```

### 오프라인 (명함·행사 QR)
```
https://www.supercoder.co/brochure?utm_source=offline&utm_medium=qr&utm_campaign=행사명-YYYYMM
```

랜딩(/)으로 보내고 싶을 때도 같은 방식으로 붙이면 된다 — 방문자가 나중에 /apply·/brochure 폼을 제출해도 유입이 리드에 남는다:
```
https://www.supercoder.co/?utm_source=stibee&utm_medium=email&utm_campaign=캠페인명
```

## 확인하는 곳

1. **어드민 → 도입문의**: 접수 표 "유입" 열(소스/매체 칩, 상세 모달에 전체 UTM) + CSV 내보내기.
2. **어드민 → 소개서 리드**: 동일하게 "유입" 열 + CSV.
3. **GA4**: 보고서 → 획득 → 트래픽 획득(세션 소스/매체), 전환 이벤트 `apply_lead`·`brochure_lead` 분석.

## DB 마이그레이션 (적용 완료)

`signups`·`brochure_requests` 모두 UTM 컬럼 적용 완료(brochure는 2026-08-06 `supabase/brochure-utm-setup.sql` 실행). 추가 작업 불필요.
