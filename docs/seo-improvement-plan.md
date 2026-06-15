# AIVIEW 웹사이트 검색 노출(SEO) 개선안

> 대상: `index.html`(랜딩), `apply.html`(무료 신청)
> 목표: **Google·Naver 검색에서 "AI 면접", "AI 채용 검증", "이력서 검증", "AIVIEW" 등으로 노출**
> 작성일: 2026-06-15 · 조사 기준

---

## 0. 요약 (TL;DR)

현재 페이지는 **검색엔진이 페이지를 이해·수집·표시하는 데 필요한 기본 요소가 거의 없다.** 디자인·콘텐츠 품질은 높지만, SEO 관점에서는 사실상 "검색엔진에 자기소개를 안 한 상태"다.

| 영역 | 현황 | 영향 |
|---|---|---|
| `<title>` | 개발용 ("컨셉 E · 스토리텔링…") | 검색결과 제목이 부적절 |
| `meta description` | **없음** | 검색결과 요약문이 자동 생성(품질↓) |
| Open Graph / Twitter Card | **없음** | 카톡·SNS 공유 시 썸네일·제목 없음 |
| `canonical` | **없음** | 중복 URL 색인 위험 |
| 구조화 데이터(JSON-LD) | **없음** | 리치 결과·지식그래프 미노출 |
| `robots.txt` | **없음** | 크롤러 제어·sitemap 안내 불가 |
| `sitemap.xml` | **없음** | 색인 누락·지연 |
| favicon | **없음** | 검색결과·탭 브랜드 아이콘 없음 |
| Google Search Console | 미등록(추정) | 색인 상태·검색어 측정 불가 |
| Naver 서치어드바이저 | 미등록(추정) | **네이버 검색에 사실상 노출 안 됨** |
| 대용량 이미지 | report-aiview.png 1.4MB, hero-globe.png 1.2MB | LCP 저하 → Core Web Vitals 감점 |

**핵심:** Naver는 Google과 별개로 **네이버 서치어드바이저에 사이트를 등록하고 sitemap·robots.txt를 제출해야** 검색에 잡힌다. 둘 다 별도 작업이 필요하다.

---

## 1. 현황 진단 (Audit)

### 잘 되어 있는 것 ✅
- `<html lang="ko">` — 한국어 명시 (Naver/Google 모두 중요)
- `<meta name="viewport">` — 모바일 대응(모바일 우선 색인 충족)
- **페이지당 `<h1>` 1개** + `<h2>`/`<h3>` 계층이 논리적 (index.html 기준 h1 1개)
- 도입사 로고 마퀴의 **장식용 복제 이미지에 `alt=""` + `aria-hidden`** 처리 (접근성·SEO 노이즈 방지 양호)
- 시맨틱 구조: 섹션별 의미 있는 마크업

### 비어 있는 것 ❌ (우선 보완 대상)
1. **메타데이터 일체** — description / OG / Twitter / canonical 전무
2. **`<title>`이 개발 메모** — `AIVIEW · AI 이력서 검증 | 컨셉 E · 스토리텔링 (화이트 & 엷은 블루)`
3. **구조화 데이터(JSON-LD) 없음** — Organization / WebSite / Product / FAQ
4. **`robots.txt` · `sitemap.xml` 없음**
5. **favicon / 웹 아이콘 없음**
6. **푸터 약관·개인정보 링크가 `href="#"`** (빈 링크) — 신뢰도·E-E-A-T 감점, 실제 페이지 필요
7. **대용량 PNG** — Hero·리포트 이미지가 1MB 이상, 압축·`loading="lazy"`·`width/height` 미지정

---

## 2. 우선순위별 실행 계획

### 🔴 P0 — 즉시 (검색 노출의 전제 조건)

#### 2-1. `<title>` · `meta description` 정비 (페이지별 고유)

> Naver 권장: **title 40자 이내, description 80자 이내(한글 기준)**. 페이지마다 **고유**해야 Yeti가 페이지를 구분·분류한다.

**`index.html` `<head>` 교체:**
```html
<title>AIVIEW · AI 면접으로 검증된 인재만 | 채용 자동화 SaaS</title>
<meta name="description" content="AI 면접이 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달합니다. 가짜 이력서·과장 스펙 걸러내는 AIVIEW.">
```

**`apply.html` `<head>` 교체:**
```html
<title>무료 신청 · AIVIEW | AI 면접 채용 검증</title>
<meta name="description" content="AIVIEW 무료 도입 신청. AI 면접으로 지원자를 자동 검증하고 채용팀에 검증된 인재 리포트를 전달받으세요.">
```
*(apply.html title은 이미 적절 — description만 추가)*

#### 2-2. Open Graph · Twitter Card (SNS·카카오톡 공유 최적화)

한국 B2B 유입의 상당수가 **카카오톡 공유 링크**다. OG가 없으면 회색 박스로 노출되어 CTR이 급락한다.

`index.html` `<head>`에 추가:
```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="AIVIEW">
<meta property="og:title" content="AI 면접으로 검증된 인재만 만나세요 · AIVIEW">
<meta property="og:description" content="AI 면접이 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달합니다.">
<meta property="og:url" content="https://[배포-도메인]/">
<meta property="og:image" content="https://[배포-도메인]/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="AI 면접으로 검증된 인재만 만나세요 · AIVIEW">
<meta name="twitter:description" content="AI 면접이 지원자를 자동 검증하고, 검증된 핵심 인재 리포트만 전달합니다.">
<meta name="twitter:image" content="https://[배포-도메인]/og-image.png">
```
> **할 일:** `1200×630` OG 이미지(`og-image.png`)를 별도 제작. 로고+핵심 카피+제품 미리보기 조합 권장. (기존 `report-aiview.png`는 비율/용량이 맞지 않음)

#### 2-3. `canonical` 추가

각 페이지 `<head>`에:
```html
<!-- index.html -->
<link rel="canonical" href="https://[배포-도메인]/">
<!-- apply.html -->
<link rel="canonical" href="https://[배포-도메인]/apply.html">
```

#### 2-4. `robots.txt` 생성 (루트)

`robots.txt` 파일을 프로젝트 루트에 새로 만든다:
```
User-agent: *
Allow: /

# Naver 크롤러 명시 허용
User-agent: Yeti
Allow: /

Sitemap: https://[배포-도메인]/sitemap.xml
```
> `Yeti`는 네이버 검색 로봇 User-Agent. 서버/방화벽에서 차단되지 않도록 한다.

#### 2-5. `sitemap.xml` 생성 (루트)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://[배포-도메인]/</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://[배포-도메인]/apply.html</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```
> 페이지를 추가할 때마다 `<url>` 항목을 갱신한다. (정적 사이트라 수동 관리)

#### 2-6. favicon · 웹 아이콘

브랜드 심볼(`supercoder-nav.svg`의 심볼)로 favicon 세트를 만들어 루트에 두고 `<head>`에 링크:
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

### 🟠 P1 — 1~2주 내 (색인 등록 + 구조화 데이터)

#### 2-7. Google Search Console 등록

1. [search.google.com/search-console](https://search.google.com/search-console) 접속 → 속성 추가
2. **도메인 속성**(DNS TXT) 또는 **URL 접두어**(HTML 메타태그/파일) 방식으로 소유권 확인
   - 메타태그 방식이면 `<head>`에 인증 태그 1줄 추가:
     `<meta name="google-site-verification" content="...">`
3. **Sitemaps** 메뉴 → `sitemap.xml` 제출
4. **URL 검사** → 색인 요청

#### 2-8. Naver 서치어드바이저 등록 ⭐ (네이버 노출의 핵심)

> Google에 등록해도 **네이버에는 안 잡힌다.** 반드시 별도 등록.

1. [searchadvisor.naver.com](https://searchadvisor.naver.com) → 네이버 아이디 로그인
2. **웹마스터 도구 → 사이트 등록** (사이트는 **호스트 단위**로만 등록)
3. **소유 확인** — "HTML 태그(메타태그)" 방식 권장:
   `<meta name="naver-site-verification" content="...">` 를 `index.html` `<head>`에 추가
4. **요청 → 사이트맵 제출**: `https://[배포-도메인]/sitemap.xml`
5. **robots.txt 수집** 확인 (Yeti 허용 상태)
6. (선택) **RSS 제출** — 블로그/뉴스 콘텐츠가 생기면 sitemap과 함께 제출 권장
7. 등록 후 **검색 노출까지 최소 2~4주** 소요될 수 있음

> 검증 메타태그는 Google·Naver 것을 **둘 다** `index.html` `<head>`에 나란히 두면 된다.

#### 2-9. 구조화 데이터(JSON-LD) 삽입

`index.html` `</body>` 직전에 추가. 리치 결과·지식그래프·신뢰도에 기여.

**(a) Organization + WebSite**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "AIVIEW",
      "url": "https://[배포-도메인]/",
      "logo": "https://[배포-도메인]/supercoder-logo.svg",
      "description": "AI 면접으로 지원자를 자동 검증하고 채용팀에 검증된 인재 리포트를 전달하는 B2B 채용 SaaS",
      "sameAs": []
    },
    {
      "@type": "WebSite",
      "name": "AIVIEW",
      "url": "https://[배포-도메인]/",
      "inLanguage": "ko-KR"
    }
  ]
}
</script>
```
> `sameAs`에 공식 LinkedIn/블로그/유튜브 등 SNS URL을 넣으면 지식그래프 신뢰도가 올라간다.

**(b) Product / SoftwareApplication** (제품 페이지 성격 강화)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AIVIEW",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI 면접 기반 채용 검증 솔루션. 지원자를 자동 검증하고 핵심 인재 리포트를 제공합니다.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW", "description": "무료 도입 신청" }
}
</script>
```

**(c) FAQPage** — 자주 묻는 질문 섹션을 추가하면(권장) FAQ 리치 결과로 검색 점유 면적이 커진다. *(현재 FAQ 섹션 없음 → 콘텐츠 추가 후 마크업)*

---

### 🟡 P2 — 콘텐츠·성능 (장기 순위 상승)

#### 2-10. 온페이지 콘텐츠 보강
- **키워드 자연 삽입**: "AI 면접", "AI 채용", "이력서 검증", "채용 자동화", "역량 평가 리포트" 등 타깃 키워드를 h2/본문에 자연스럽게 반영 (현재도 양호하나 "AI 채용 솔루션" 등 검색량 키워드 보강 여지)
- **제품 데모 이미지 `alt` 보강**: `demo-result.png`, `report-*.png`에 의미 있는 `alt`("AIVIEW AI 면접 분석 리포트 예시" 등) 지정 → 이미지 검색 유입
- **푸터 약관/개인정보 링크(`href="#"`) 실제 페이지 연결**: 개인정보처리방침·이용약관 페이지 신설. B2B 신뢰도(E-E-A-T)와 색인 가능 페이지 수 모두 ↑
- **블로그/리소스 섹션 신설(중장기)**: "AI 채용 트렌드", "채용 비용 절감" 등 정보성 콘텐츠로 롱테일 유입 확보 — Naver는 특히 신선·정보성 콘텐츠를 선호

#### 2-11. 성능 / Core Web Vitals (LCP 개선)
대용량 이미지가 LCP를 끌어내린다(모바일 색인·순위에 직접 영향):

| 파일 | 현재 | 조치 |
|---|---|---|
| `report-aiview.png` | **1.4MB** | WebP/AVIF 변환 + 리사이즈(필요 해상도까지) |
| `hero-globe.png` | **1.2MB** | WebP 변환 + 압축, Hero 외 지연로드 검토 |
| `report-interview-summary.png` 외 | 170~230KB | WebP 변환 |

- 모든 콘텐츠 이미지에 **`width`·`height` 속성 명시**(CLS 방지) + 첫 화면 밖 이미지는 **`loading="lazy"`**
- Hero LCP 이미지는 `<link rel="preload">` 또는 `fetchpriority="high"` 고려
- 폰트(Pretendard)·Font Awesome은 CDN 의존 — 사용 아이콘만 서브셋하거나 `preconnect` 추가:
  `<link rel="preconnect" href="https://cdn.jsdelivr.net">`

#### 2-12. 기타
- **HTTPS 필수** (배포 시 자동, 확인만)
- **`apply.html`에도** description·canonical·OG·favicon 동일 적용 (페이지별 고유 description)
- **404 페이지** 커스텀 제공
- 모바일 사용성(터치 타깃·폰트 크기) 점검 — 이미 반응형이라 양호

---

## 3. 구현 체크리스트

### 코드 변경 (이 저장소)
- [ ] `index.html` `<title>` + `meta description` 교체
- [ ] `index.html` OG/Twitter/canonical 추가
- [ ] `index.html` JSON-LD(Organization·WebSite·SoftwareApplication) 추가
- [ ] `apply.html` description·canonical·OG 추가
- [ ] `robots.txt` 생성 (루트)
- [ ] `sitemap.xml` 생성 (루트)
- [ ] favicon 세트 + `<head>` 링크
- [ ] OG 이미지(`og-image.png`, 1200×630) 제작
- [ ] 콘텐츠 이미지 `alt` 보강 + `loading="lazy"` + `width/height`
- [ ] 대용량 PNG → WebP 변환·압축
- [ ] 푸터 약관/개인정보 링크 실제 페이지 연결
- [ ] Google·Naver 소유확인 메타태그 삽입(발급 후)

### 외부 등록 (코드 외)
- [ ] Google Search Console 사이트 등록 + sitemap 제출 + 색인 요청
- [ ] Naver 서치어드바이저 사이트 등록 + 소유확인 + sitemap 제출 + robots.txt 확인
- [ ] (선택) Bing Webmaster Tools, Daum 검색등록
- [ ] 배포 도메인 확정 후 모든 `https://[배포-도메인]` 플레이스홀더 치환

> ⚠️ **`[배포-도메인]` 플레이스홀더**: 현재 Vercel 프로젝트·코드 내 자사 도메인 참조가 없어 운영 도메인이 미확정 상태다. 도메인 확정 후 위 모든 스니펫의 `https://[배포-도메인]`을 실제 주소로 일괄 치환해야 한다.

---

## 4. 측정 지표 (등록 후 모니터링)
- **Google Search Console**: 색인된 페이지 수, 노출수/클릭수, 평균 게재순위, 검색어
- **Naver 서치어드바이저**: 수집 현황(웹페이지 수집), 노출 키워드, 사이트 최적화 리포트(진단 점수)
- **PageSpeed Insights / Lighthouse**: LCP·CLS·INP (모바일 기준 우선)
- 핵심 키워드("AI 면접", "AI 채용 검증", "AIVIEW") 순위 추이

---

## 5. 참고 자료
- [Naver 서치어드바이저 — robots.txt·sitemap·RSS 등록 방법](https://8days.co.kr/%EB%84%A4%EC%9D%B4%EB%B2%84-%EC%84%9C%EC%B9%98%EC%96%B4%EB%93%9C%EB%B0%94%EC%9D%B4%EC%A0%80/)
- [How to Use Naver Search Advisor: A Full Guide (2026)](https://www.interad.com/en/insights/naver-search-advisor-a-full-guide)
- [The Technical Foundations of Naver Indexing (Yeti)](https://indexly.ai/blog/foundations-of-naver-indexing/)
- [Yeti User Agent — Naver 검색 크롤러](https://knownagents.com/agents/yeti)
- [Google: robots.txt 파일 작성 및 제출](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt?hl=ko)
- [Google: robots.txt 소개](https://developers.google.com/search/docs/advanced/robots/intro?hl=ko)

---

### 권장 진행 순서
**P0 코드 반영(메타·robots·sitemap·favicon) → 배포·도메인 확정 → Google/Naver 등록 → P1 구조화 데이터 → P2 성능·콘텐츠.**
P0만 적용해도 "검색엔진이 페이지를 제대로 이해하고 표시"하는 최소 조건이 충족되며, **Naver는 서치어드바이저 등록(2-8)이 노출의 사실상 필수 관문**이다.
