# 작업 내역 (Work Log)

날짜별 작업 요약. 최신 항목이 위로 온다. 운영 사이트: https://sc-ai-website.vercel.app
(블로그는 Supabase에서 매 요청마다 조회 — DB 변경은 재배포 없이 즉시 반영, 코드/이미지 자산 변경은 배포 후 반영)

---

## 2026-06-17

### 블로그 마무리 보정
- **'출처' 표기 약하게**: 본문 끝 출처 문단/인용구를 투명도↓(opacity .5)·작은 글씨로 표시해 본문보다 약하게(`lib/postRender.ts` + `app/blog/[id]/post.css`의 `.post-src`). 인용구(`>`)로 작성된 출처도 인용 스타일 대신 약한 출처로 렌더.
- **마크다운 내부 링크 수정**: `[무료로 도입 효과를 확인](/apply)`처럼 상대경로 링크가 raw 텍스트로 보이던 문제 수정 → 내부 링크(같은 탭)·외부 링크(새 탭)로 정상 렌더(`lib/postRender.ts`).
- 본 작업 내역 문서 정리.

---

## 2026-06-16

### A. 정적 HTML → Next.js 웹앱 마이그레이션 (대규모)
- 빌드 없는 정적 멀티페이지 HTML → **Next.js 15 (App Router) + React 19 + TypeScript**로 전환.
- 전 페이지 라우트화: `/`(랜딩), `/apply`, `/blog`, `/blog/[id]`, `/admin`, `/privacy`, `/terms`, `/terms-applicant`, 404.
- `theme.css` → `app/globals.css`(SSOT), 페이지별 CSS는 라우트에 co-located.
- `partials.js` → React 컴포넌트: `SiteHeader`(섹션 인지형 GNB)·`SiteFooter`·`BrochureModal`·`Chatbot`·`HeroParticles`(canvas).
- 구 `.html` URL → 클린 URL 308 redirect(`next.config.mjs`), 블로그/상세는 서버 SSR(SEO).
- **확인 필요 발견**: `posts` 쓰기 RLS가 "인증 관리자만"이라 기존 admin은 동작 불가 → **Supabase Auth 로그인 게이트** 추가. (관리자 계정 `admin@supercoder.co`는 이미 존재·로그인 가능.)

### B. Vercel 배포 / Supabase 구성
- 기존 Vercel 프로젝트 `sc-ai-website`(team `juhee-team`)에 link.
- 환경변수 분리: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Production·Preview·Development 3환경 등록.
- 배포 트러블슈팅: 손상 lockfile 재생성, Framework Preset `null`→`nextjs`(vercel.json + API).
- **프로덕션 배포 성공** → https://sc-ai-website.vercel.app, `main` 병합·GitHub push 완료.

### C. 브랜딩·UI 보정
- **푸터 로고**: "Supercoder AI" → 'AI' 제거한 회색 "Supercoder"(`public/supercoder-footer.svg`, 브랜드 회색으로 리컬러).
- **HOW IT WORKS** 섹션 역량평가 이미지 교체(`report-competency.png`).
- **고객 후기 회사명 익명화**: 아키스케치·가온프라임·식파마·마크애니 → A·B·C·D사("Supercoder 도입 고객" 라벨 유지).
- **'AIVIEW' → 'AI면접' 전면 교체**: 사이트 카피·메타데이터·JSON-LD(코드), DB `posts.author`, 차트 SVG 6종 라벨("AI면접 채용 데이터"). 조사·표기 보정 포함(AIVIEW가→AI면접이, (에이아이뷰) 제거).

### D. 블로그 콘텐츠 정비
- **SEO 제목 6개 보정** — 실제 검색 키워드 검증(WebSearch) 후 적용:
  - 잘못된 채용 비용 → **채용 실패 비용**, 가짜 이력서에 **평판조회** 추가, 채용 현실에 **자소서 AI** 반영, 채용 트렌드에 **스킬 기반·AI 채용** 반영 등.
- **블로그 이미지 전면 교체** (본문 이미지는 모두 **가로 비율** + 비인물/주제 적합):
  | 글 | 커버 | 본문 이미지 |
  |---|---|---|
  | 채용 트렌드 | 차트(trend.svg) | 서류 더미 |
  | 채용 현실(자소서 AI) | 차트(reality.svg) | AI로 자소서 작성(ChatGPT 화면) |
  | AI 면접이란 | 차트(ai-interview.svg) | 공정 평가(저울) |
  | 가짜 이력서/검증 | 인물(매력적) | (이미지 삭제) |
  | 채용 실패 비용 | 차트(cost.svg) | 가로 계산기 |
  | 면접 일정 조율 | **카페 화상면접** | 가로 달력/데스크 |
  - 기존 동양인 인물 사진(면접 장면 등) → 매력적 인물(커버) 및 사물·그래프·오피스(본문)로 교체.
- **새 글 2개 추가**:
  1. "1차 서류 검토를 AI 면접으로 바꾸면? **채용팀 업무 자동화** 인사이트" (카테고리: 채용 자동화)
  2. "채용에 AI 도입하는 기업들 — 사례와 2026 도입률로 보는 변화" (잡코리아 설문·마이다스인 등 실데이터 인용)

---

## 이전 (정적 운영 시기, ~2026-06-15)
정적 HTML 운영 시기 내역은 git 히스토리 참조. 관련 기획 문서: `docs/free-signup-page-plan.md`, `docs/seo-improvement-plan.md`, `docs/seo-task-checklist.md`.
