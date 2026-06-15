# AIVIEW SEO 개선 — 태스크 체크리스트

> 근거 문서: [`seo-improvement-plan.md`](./seo-improvement-plan.md)
> 사용법: 항목을 끝내면 `[ ]` → `[x]`로 바꾼다. **우선순위(P0→P1→P2) 순서**로 진행한다.
> 범례: 🧑‍💻 코드 변경(이 저장소) · 🌐 외부 등록(콘솔 작업) · 🎨 에셋 제작 · ✍️ 콘텐츠

## ✅ 구현 현황 요약 (2026-06-15 기준)

**배포·도메인 확정·플레이스홀더 치환까지 완료.** 남은 항목은 외부 콘솔 등록(Google·Naver)뿐 — 소유확인 코드만 받으면 삽입·재배포는 가능.

- **운영 도메인:** https://sc-ai-website.vercel.app (Vercel 프로덕션, HTTPS 자동) — 2026-06-15 배포
- **완료(코드/에셋):** title·description·canonical·OG·Twitter·favicon 세트·OG 이미지·robots.txt·sitemap.xml(5 URL)·JSON-LD(Organization·WebSite·SoftwareApplication·FAQPage)·preconnect·리포트 이미지 WebP(85%↓)·`<picture>`+width/height·약관 3종+개인정보 페이지·404·FAQ 섹션·**도메인 플레이스홀더 일괄 치환·배포**
- **외부에 남은 것:** Google Search Console·Naver 서치어드바이저 **소유확인 → sitemap 제출 → 색인 요청** → 리치결과 테스트 → 운영 모니터링. (블로그 섹션은 중장기 범위 외)
- **검토 필요:** 약관·개인정보 페이지는 **표준 초안** — 시행 전 법무 검토와 `[ ]` 항목(회사명·대표자·보유기간 등) 확정 필요.

---

## ⛳ 선행 작업 (Blocker)

- [x] **배포 도메인 확정** — Vercel 프로덕션 배포: **https://sc-ai-website.vercel.app** (juhee-team/sc-ai-website)
- [x] **HTTPS 적용 확인** — Vercel 자동 적용(전 페이지 200 확인)

---

## 🔴 P0 — 즉시 (검색 노출 전제조건)

### title · description
- [x] 🧑‍💻 `index.html` `<title>` 교체 (개발용 메모 → 실제 카피, **40자 이내**)
- [x] 🧑‍💻 `index.html` `<meta name="description">` 추가 (**80자 이내**, 고유)
- [x] 🧑‍💻 `apply.html` `<meta name="description">` 추가 (고유)
  - 완료 기준: 두 페이지의 title·description이 서로 다르고, 검색결과 미리보기가 자연스러움

### 소셜 공유 (OG / Twitter)
- [x] 🎨 OG 이미지 `og-image.png` 제작 (**1200×630**, 공식 로고+핵심카피, 브랜드 그라데이션 / 소스: `og-template.html`)
- [x] 🧑‍💻 `index.html` Open Graph 태그 추가 (`og:title/description/url/image/type/site_name/locale`)
- [x] 🧑‍💻 `index.html` Twitter Card 태그 추가 (`summary_large_image`)
- [x] 🧑‍💻 `apply.html`에도 OG/Twitter 적용
  - 완료 기준: 카카오톡·Slack에 링크 붙여넣을 때 썸네일·제목·설명이 정상 노출
  - ⚠️ `og:url`·`og:image`가 `https://[배포-도메인]` 플레이스홀더 — **도메인 확정 후 치환해야 실제 썸네일 노출됨**

### canonical
- [x] 🧑‍💻 `index.html` `<link rel="canonical">` 추가 (플레이스홀더 도메인)
- [x] 🧑‍💻 `apply.html` `<link rel="canonical">` 추가 (플레이스홀더 도메인)

### 크롤링/색인 파일
- [x] 🧑‍💻 루트에 `robots.txt` 생성 (`User-agent: *` + **`Yeti` 명시 허용** + `Sitemap:` 경로)
- [x] 🧑‍💻 루트에 `sitemap.xml` 생성 (`/`, `/apply.html` 2개 URL, `lastmod` 포함)
  - ⚠️ Sitemap 경로·`<loc>`가 플레이스홀더 도메인 — **도메인 확정 후 치환 필수**(현재 URL은 무효)
  - 완료 기준: `https://[배포-도메인]/robots.txt`, `/sitemap.xml`이 브라우저에서 정상 로드 (로컬 200 확인됨)

### favicon
- [x] 🎨 브랜드 심볼(공식 `</>` 마크)로 favicon 세트 제작 (`favicon.svg`/`favicon.ico` 16·32·48/`apple-touch-icon.png` 180)
- [x] 🧑‍💻 `index.html`·`apply.html` `<head>`에 아이콘 링크 추가
  - 완료 기준: 브라우저 탭·검색결과에 브랜드 아이콘 표시 (로컬 렌더 확인됨)

---

## 🟠 P1 — 1~2주 내 (색인 등록 + 구조화 데이터)

### Google Search Console 🌐
- [ ] 🌐 속성 추가 (도메인 또는 URL 접두어)
- [ ] 🧑‍💻 소유확인 메타태그 `<meta name="google-site-verification">` 삽입 (발급 후)
- [ ] 🌐 `sitemap.xml` 제출
- [ ] 🌐 주요 URL 색인 요청 (URL 검사)
  - 완료 기준: GSC에서 두 페이지 "색인 생성됨" 상태

### Naver 서치어드바이저 🌐 ⭐ (네이버 노출 핵심)
- [ ] 🌐 [searchadvisor.naver.com](https://searchadvisor.naver.com) 로그인 → 사이트 등록(호스트 단위)
- [ ] 🧑‍💻 소유확인 메타태그 `<meta name="naver-site-verification">` 삽입 (발급 후)
- [ ] 🌐 `sitemap.xml` 제출 (요청 메뉴)
- [ ] 🌐 robots.txt 수집 확인 (Yeti 허용 상태)
- [ ] 🌐 (선택) RSS 제출 — 블로그/뉴스 생기면
  - 완료 기준: 사이트 등록 완료 + 수집 시작. **검색 노출까지 2~4주 소요 인지**

### 구조화 데이터 (JSON-LD) 🧑‍💻
- [x] 🧑‍💻 `index.html`에 `Organization` + `WebSite` JSON-LD 추가 (`</body>` 직전, 플레이스홀더 URL)
- [x] 🧑‍💻 `index.html`에 `SoftwareApplication` JSON-LD 추가 (`@graph`로 통합)
- [ ] 🌐 [리치 결과 테스트](https://search.google.com/test/rich-results)로 오류 검증 *(배포·도메인 확정 후)*
  - 완료 기준: 리치 결과 테스트 통과(오류 0)

---

## 🟡 P2 — 콘텐츠·성능 (장기 순위)

### 성능 / Core Web Vitals
- [x] 🎨 실제 로드되는 리포트 이미지 WebP 변환 (`report-interview-summary`·`report-overall-grade`·`report-competency` → 1024w q82, **합계 ~470KB→73KB, 85%↓**)
  - ℹ️ `report-aiview.png`(1.4MB)·`hero-globe.png`(1.2MB)·`demo-result.png` → **현재 어디서도 참조되지 않는 미사용 파일**이라 변환 생략(로드되지 않음). 정리 시 별도 삭제 검토
- [x] 🧑‍💻 콘텐츠 이미지 `<picture>`(WebP+PNG 폴백) + `width`/`height` 명시 (CLS 방지)
- [x] 🧑‍💻 첫 화면 밖 이미지 `loading="lazy"` 적용 (report-* 적용 완료)
- [x] 🧑‍💻 Hero LCP — **N/A**: 히어로에 `<img>` 없음(CSS 그라데이션+canvas, LCP는 헤드라인 텍스트) → preload 불필요
- [x] 🧑‍💻 `<link rel="preconnect">` 추가 (jsdelivr·cdnjs, 양 페이지)
  - 완료 기준: PageSpeed Insights 모바일 LCP < 2.5s, CLS < 0.1 *(배포 후 측정)*

### 콘텐츠 / 온페이지
- [x] ✍️ 제품/리포트 이미지 `alt` 의미 있게 보강 (report-* 적용 완료, 이미지 검색 유입)
- [x] ✍️ 타깃 키워드 반영 — **현행 카피 유지 결정**(전환 설계 보호). 키워드는 meta·JSON-LD·FAQ·alt·legal 페이지로 커버
- [x] ✍️🧑‍💻 푸터 약관·개인정보 링크 → 실제 페이지 신설·연결 (`privacy.html`·`terms.html`·`terms-applicant.html`, `partials.js` 연결) — **초안: 법무 검토 필요**
- [x] ✍️🧑‍💻 FAQ 섹션 추가(VOICES↔FINAL 사이, `#faq`) + `FAQPage` JSON-LD → FAQ 리치 결과 (네이티브 `<details>` 아코디언)
- [ ] ✍️ (중장기) 블로그/리소스 섹션 신설 — 롱테일·신선 콘텐츠 *(별도 기획 필요, 범위 외)*

### 기타
- [x] 🧑‍💻 커스텀 404 페이지 제공 (`404.html`, `noindex`, 공유 GNB/푸터 재사용)
- [ ] 🌐 (선택) Bing Webmaster Tools / Daum 검색등록 *(도메인 확정·배포 후, 외부 콘솔)*
- [x] 🧑‍💻 모든 `https://[배포-도메인]` 플레이스홀더 → `https://sc-ai-website.vercel.app` 일괄 치환·배포 완료

---

## 📊 등록 후 모니터링 (운영)
- [ ] 🌐 Google Search Console — 색인 수·노출/클릭·평균순위·검색어 주간 점검
- [ ] 🌐 Naver 서치어드바이저 — 수집 현황·사이트 최적화 진단 점수 점검
- [ ] 🌐 PageSpeed Insights — LCP/CLS/INP 모바일 기준 점검
- [ ] 🌐 핵심 키워드("AI 면접", "AI 채용 검증", "AIVIEW") 순위 추이 추적

---

### 진행 순서 요약
**선행(도메인 확정) → P0 코드 반영 → 배포 → Google·Naver 등록(P1) → 구조화 데이터(P1) → 성능·콘텐츠(P2) → 모니터링.**
P0만 끝나도 "검색엔진이 페이지를 제대로 이해·표시"하는 최소 조건이 충족되고, **Naver는 서치어드바이저 등록이 노출의 필수 관문**이다.
