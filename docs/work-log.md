# 작업 내역 (Work Log)

날짜별 주요 작업 기록. 최신 항목이 위로 온다.

---

## 2026-06-16 — 정적 HTML → Next.js 웹앱 마이그레이션 + Vercel/Supabase 구성

### 개요
기존 빌드 없는 정적 멀티페이지 HTML 사이트(index/apply/blog/post/admin/legal)를
**Next.js 15 (App Router) + React 19 + TypeScript** 웹앱으로 전환하고,
Vercel 신규 배포 연결 · Supabase 환경변수 분리 · 스키마 점검을 진행했다.
작업 브랜치: `nextjs-migration` (커밋 `22864e1`).

### 1. 사전 분석 / 확인 필요 사항 점검
- 전체 소스 구조 파악: `index.html`(943줄), `apply/blog/post/admin.html`, `partials.js`(GNB·푸터·소개서 모달·챗봇·스크롤 GNB), `theme.css`(공유 토큰/컴포넌트 SSOT), `blog-data.js`.
- Supabase 스키마·RLS 점검 결과 **중요 발견**:
  - `posts` 테이블 RLS는 이미 **쓰기(insert/update/delete) = `authenticated` + `admins` 테이블 등록 관리자**로 제한되어 있음.
  - 그런데 기존 `admin.html`은 **로그인 없이 anon 키로 쓰기 시도** → 현 RLS상 실제 동작 불가 상태였음.
  - → Next.js 버전 admin에 **Supabase Auth 로그인 게이트**를 추가해 정상화.
- 테이블 현황: `signups`(anon insert), `brochure_requests`(anon insert), `subscribers`(anon insert, 예비), `posts`(anon select / admin write), `admins`(self-select).

### 2. 프로젝트 스캐폴딩
- `package.json`(next/react/supabase-js), `tsconfig.json`, `next.config.mjs`, `.env.example`, `.env.local`.
- `.gitignore`에 Next 산출물(`.next/`, `next-env.d.ts` 등) 추가.
- 정적 에셋 → `public/`로 이동(로고 SVG, 리포트 PNG/webp, 파비콘, `brochure-aiview.pdf`, `logos/`, `charts/`, `robots.txt`, `sitemap.xml`).
- `next.config.mjs`에 구 `.html` URL → 클린 URL **308 redirect**(`/apply.html`→`/apply` 등) — SEO·기존 링크 보존.

### 3. 공유 레이어
- `theme.css` → `app/globals.css`(SSOT, 루트 layout에서 1회 import).
- `lib/supabase.ts` — `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 주입(키 하드코딩 제거, env 분리).
- `lib/format.ts`(esc·fmtDate), `lib/postRender.ts`(블로그 간이 마크다운 렌더).
- `partials.js` → React 컴포넌트로 분해:
  - `components/SiteHeader.tsx` — 섹션 인지형 GNB(스크롤 색 전환) + 메뉴 토글.
  - `components/SiteFooter.tsx`, `components/BrochureModal.tsx`(소개서 리드), `components/Chatbot.tsx`(FAQ 챗봇), `components/HeroParticles.tsx`(canvas 입자 모션).
- `app/layout.tsx` — `<html lang="ko">`, 폰트/FA CDN, Metadata API(title 템플릿·OG·twitter·favicon·google-site-verification), 공유 컴포넌트 마운트.

### 4. 페이지 마이그레이션 (HTML → JSX, 페이지 CSS는 라우트에 co-located)
- `app/page.tsx` (+`landing.css`) — 랜딩 전 섹션(히어로·깔때기 SVG·HOW·PROOF·VOICES·FAQ·CTA) + JSON-LD 구조화데이터.
- `app/apply/` — `page.tsx`(서버, metadata) + `ApplyForm.tsx`(클라이언트, signups insert, 쿼리 프리필).
- `app/blog/` — `page.tsx`(서버 SSR: published 글 조회) + `BlogClient.tsx`(카테고리 필터, 카드=크롤 가능한 `<Link>`).
- `app/blog/[id]/` — 서버 컴포넌트, `generateMetadata`로 글별 OG, 본문 마크다운 렌더, 미존재 시 `notFound()`.
- `app/admin/` — `page.tsx`(noindex) + `AdminClient.tsx`(**Supabase Auth 로그인** → posts CRUD).
- `app/privacy`, `app/terms`, `app/terms-applicant`(법적 전문 verbatim 보존), `app/not-found.tsx`(404).
- `public/sitemap.xml` 클린 URL로 갱신.

### 5. 검증
- `npm run build` 통과(9개 라우트, 타입체크·린트 포함). `HeroParticles` TS strict 오류 1건 수정.
- `npm start` 프로덕션 서버로 전 라우트 200/SSR/리다이렉트(308)/404 확인:
  - 홈·apply·privacy·terms·terms-applicant 200, blog SSR 글 로드 OK, post 상세 본문·메타 렌더 OK, admin 로그인 게이트 OK.
- 포팅 완료된 원본 파일(.html, theme.css, partials.js, blog-data.js 등) 제거.

### 6. Vercel / Supabase 구성
- 기존 프로젝트 확인: `sc-ai-website` (id `prj_iA3dSllyREa7UHyhyBDkrEn9pcNi`, team `juhee-team`, 운영 URL https://sc-ai-website.vercel.app).
- Vercel CLI로 로컬 디렉터리 ↔ 기존 프로젝트 **link** 완료(`.vercel/project.json`).
- 환경변수 등록: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - ✅ Production · Development 등록 완료.
  - ⏳ Preview 환경 등록 진행 중(`--value … --yes`로 재시도 필요).

### 남은 작업 / TODO
- [ ] Vercel **Preview** 환경 env 2건 등록 마무리.
- [ ] 프로덕션 배포 실행(`vercel --prod`) 및 라이브 URL 동작 확인.
- [ ] `nextjs-migration` → `main` 병합 및 push (Git 연동 배포 일관성).
- [ ] admin 운영을 위한 Supabase Auth 관리자 계정(이메일+비밀번호) 생성 + `admins` 테이블 등록 확인.
- [ ] 배포 후 `og:image`/canonical 등 메타 실제 도메인 기준 점검.

---

## 이전 (정적 운영 시기, ~2026-06-15)
정적 HTML로 운영하던 시기의 상세 내역은 git 히스토리 참조
(고객후기·챗봇·도입문의 폼화·블로그/소개서 모달·SEO 등). 관련 기획 문서:
`docs/free-signup-page-plan.md`, `docs/seo-improvement-plan.md`, `docs/seo-task-checklist.md`.
