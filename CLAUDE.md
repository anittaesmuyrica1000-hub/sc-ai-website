# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Supercoder AI 웹사이트 — **AIVIEW** 제품 랜딩 + 블로그/도입문의. AI 면접으로 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달하는 B2B 채용 SaaS의 마케팅 웹앱이다. 카피·UI는 전부 한국어.

- Remote: https://github.com/anittaesmuyrica1000-hub/sc-ai-website.git
- **브랜치 전략:** `dev` = 작업 기본(GitHub default branch), `main` = 운영(Vercel Production Branch). 별도 지시가 없으면 **`dev`에서 작업·커밋·push**하고, 테스트 후 PR(`dev`→`main`) 머지로 운영 반영.
- 운영 도메인: https://www.supercoder.co (Vercel Production = `main` 브랜치). `supercoder.co`는 www로 308 리다이렉트. 옛 `sc-ai-website.vercel.app`은 2026-07-01 제거되어 404 — 링크로 쓰지 않는다.
- **DB는 dev·운영 공유** — 같은 Supabase 프로젝트(`supercoder-aiview`)를 쓴다. dev에서의 admin 설정·DB 변경(GA·약관·SEO·도입문의 등)은 운영에도 즉시 반영됨에 유의.

## Architecture

**Next.js 15 (App Router) + React 19 + TypeScript.** 정적 HTML 멀티페이지에서 마이그레이션됨(2026-06). Vercel 배포, Supabase 백엔드.

- **라우트(`app/`):**
  - `app/page.tsx` — 랜딤(index). 서버 컴포넌트. 섹션 CSS는 `app/landing.css`.
  - `app/apply/` — 도입 문의 폼. `page.tsx`(서버, metadata) + `ApplyForm.tsx`(클라이언트, Supabase insert).
  - `app/blog/` — 블로그 목록. `page.tsx`(서버, Supabase에서 published 글 SSR) + `BlogClient.tsx`(클라이언트, 카테고리 필터).
  - `app/blog/[id]/` — 블로그 상세. 서버 컴포넌트, `generateMetadata`로 글별 OG. 본문은 `lib/postRender.ts`(간이 마크다운)로 렌더.
  - `app/admin/` — 블로그 관리. `page.tsx`(noindex) + `AdminClient.tsx`(**Supabase Auth 로그인 게이트** + CRUD).
  - `app/privacy`, `app/terms`, `app/terms-applicant` — 법적 페이지(서버). `app/not-found.tsx` — 404.
- **공유 디자인 토큰·컴포넌트 CSS는 `app/globals.css` (SSOT).** `:root` 변수(`--blue`,`--ink`,`--soft`,`--r`,`--shadow` 등)·버튼(`.btn*`)·`.eyebrow`·GNB(`header`/`nav`)·푸터(`footer`)·모달(`.bro-*`)·챗봇(`.cbot*`)·법적 페이지(`.legal`)가 모두 여기. 루트 `layout.tsx`에서 1회 import. **공유 컴포넌트를 바꿀 땐 `app/globals.css`만 고치면 전 페이지가 함께 바뀐다.**
- **페이지 고유 CSS는 라우트 폴더에 co-located** (`app/landing.css`, `app/apply/apply.css`, `app/blog/blog.css`, `app/blog/[id]/post.css`, `app/admin/admin.css`). 해당 page에서 import. 클래스는 전역 스코프(원본 정적 사이트와 동일 동작).
- **공유 컴포넌트(`components/`):** `SiteHeader`(섹션 인지형 GNB·메뉴), `SiteFooter`, `BrochureModal`(서비스소개서 리드 — `#navBrochure` 클릭 위임), `Chatbot`(FAQ 챗봇), `HeroParticles`(canvas 입자 모션, 히어로·CTA 공용). 모두 `layout.tsx`에 마운트되거나 page에서 사용. `"use client"`.
- **섹션 = 랜딩 구조 (정의된 이름·번호·id).** `app/page.tsx`는 번호 매겨진 섹션 스택이다. 정식 목록: 01 DECLARATION(`#hero`), 02 CLIENTS(`#clients`), 03 VALUE(`#value`), 04 FLOOD(`#flood`), 05 ROLE REVERSAL(`#role`, 깔때기 SVG), 06 HOW IT WORKS(`#how`), 07 PROOF(`#proof`), 08 VOICES(`#voices`), 08.5 FAQ(`#faq`), 09 FINAL CTA(`#final`). GNB 메뉴 앵커는 `#value`·`#how`·`#proof`·`#voices`.
- **섹션 인지형 GNB:** `[data-nav="dark"]` 섹션(히어로·FINAL) 위에선 헤더 반전(흰 로고). 색 전환 클래스(`header.nav-invert`/`.nav-solid`)는 `globals.css`(SSOT), 감지 로직은 `SiteHeader.tsx`의 `syncHeader`.
- **외부 의존성은 CDN(`layout.tsx`의 `<head>`):** Pretendard 폰트(jsdelivr), Font Awesome 6.5.2(cdnjs). 아이콘은 `<i className="fa-...">`. Supabase는 `@supabase/supabase-js`(npm).
- **정적 에셋은 `public/`** (로고 SVG, 리포트 PNG/webp, 파비콘, `brochure-aiview.pdf`, `logos/`, `charts/`, `robots.txt`, `sitemap.xml`). 절대경로(`/supercoder-nav.svg`)로 참조.
- **구 `.html` URL은 `next.config.mjs` redirects로 클린 URL에 308 매핑**(`/apply.html`→`/apply` 등). 기존 인바운드 링크·SEO 보존.

## Backend (Supabase)

- **프로젝트:** `supercoder-aiview` (ref `ymzlcghqamkynuvotzgh`, region ap-northeast-2). org `uwuwftckkxbtbqjlsrav`.
- **연결:** `lib/supabase.ts` — `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수(.env.local · Vercel)에서 publishable(공개) 키 주입. publishable 키는 RLS로 보호되어 노출 안전. **`.env.example` 참고. service_role 키는 절대 클라이언트/깃에 넣지 않는다.**
- **테이블 / RLS:**
  - `signups` — 도입 문의(apply). anon `insert`만 허용.
  - `brochure_requests` — 서비스소개서 리드(모달). anon `insert`만 허용.
  - `subscribers` — 뉴스레터(예비). anon `insert`만 허용.
  - `posts` — 블로그. anon `select` 허용(공개 읽기). **`insert`/`update`/`delete`는 `authenticated` + `admins` 테이블에 이메일이 있는 관리자만**(RLS). → admin 페이지는 **Supabase Auth 로그인 필수**. (anon 키만으로는 쓰기 불가.)
  - `admins` — 관리자 이메일 목록. authenticated self-select.
- **신규 관리자 추가:** Supabase Auth에 사용자(이메일+비밀번호) 생성 + `admins`에 같은 이메일 INSERT(대시보드/MCP).

## Running / Build

```bash
npm install
npm run dev      # http://localhost:3000 개발 서버
npm run build    # 프로덕션 빌드(타입체크·린트 포함)
npm start        # 빌드 후 프로덕션 서버
```

`.env.local`에 Supabase 환경변수 필요(`.env.example` 복사). 배포는 Vercel(push 시 자동) + 동일 환경변수 등록.

## 작업 규칙 (Workflow Rules)

### 사용자 응답은 한국어로 (MUST)
사용자에게 설명·요약·진행 보고를 할 때는 **항상 한국어**로 작성한다. (코드·식별자·로그 등 원문은 그대로.)

### UI 컴포넌트 재사용 / 단일 출처 (MUST)
UI 구현 시 **기존 컴포넌트·토큰을 먼저 재사용**한다. 공유 스타일은 `app/globals.css`, 공유 마크업은 `components/`. 페이지별로 복붙하지 않는다 — 한 곳을 고치면 관련 UI가 전부 바뀌도록. 재사용할 게 없으면 새로 만들기 전에 사용자에게 먼저 물어본다.

### 구현 후 검증 (MUST)
commit/push 전에 **항상** `npm run build`로 타입·린트·빌드를 통과시킨다. 화면 변경은 `npm run dev`로 확인하고, 필요 시 스크린샷은 `screenshots/`에 저장한다.

### 브랜치 전략 (MUST)
별도 지시가 없으면 **`dev` 브랜치에서 작업**한다(GitHub default=`dev`). 작업 시작 전 현재 브랜치가 `dev`인지 확인(`git checkout dev`). `main`은 운영(Vercel Production)이므로 **`main`에 직접 push 금지** — 운영 반영은 테스트 후 **PR(`dev`→`main`) 머지로만** 한다(`gh pr create --base main --head dev`). dev에 push하면 Vercel이 preview 배포(`*-git-dev-*.vercel.app`)를 만들어 테스트 가능.

### 새 기능 추가 시 push (MUST)
기능 완료 시 `git add -A` → 의미 있는 commit → `git push`( = `dev`에 push). secret(`.env*`)은 절대 commit하지 않는다(.gitignore 확인).

### 업데이트 글(/update) 본문 스타일 (MUST)
제품 업데이트 글은 **아래 골격을 그대로 유지**한다. 어드민 본문 편집기의 `📄 템플릿 → 제품 업데이트 (표준)`이 이 구조를 그대로 채워 넣는다(`UPDATE_TEMPLATES` in `app/admin/AdminClient.tsx`). 본문은 WYSIWYG(HTML)로 저장되며 `renderBody`(`lib/postRender.ts`)가 그대로 출력한다.

- **대제목은 `<h2>` + 이모지** — `💡 Overview` → `⭐ 주요 업데이트` → `🔧 운영 경험 개선`(하위 `🐞 버그 수정` · `🔐 보안 및 안정성`) → `⚠️ 이용 안내` → `⏳ 계속 업데이트 중인 AI Interview`. 섹션 사이는 `<hr>`.
- **개별 기능은 `<h3>` + 이모지 + 번호** (`📱 1. 지원자 화면 개편`). 회사별 설정이 필요하면 제목 끝에 `(옵션 · 별도 설정 필요)`.
- **항목 나열은 표** — 2열(`항목|내용`, 버그 수정은 `영역|설명`). 표는 반드시 `<div class="post-table-wrap"><table class="post-table">` 로 넣는다. 이 클래스가 있어야 헤더 연한 블루(`--soft-2`)·라운드 테두리가 적용된다(bare `<table>`은 `renderBody`가 자동으로 감싸주지만, 작성 시엔 클래스를 붙인다).
- **짧은 나열은 `<ul>`**, 보안·운영 항목은 `<strong>제목</strong> — 설명` 형식.
- **보충 안내는 `💡 …` 문단**(`<p>`). 인라인 색상·글자 크기(`style="..."`)는 쓰지 않는다 — 색은 전부 CSS 토큰(`app/update/update.css`)이 담당한다.
- **외부 문서(Word·Notion·메일)에서 붙여넣지 말 것** — 통짜 `<pre>`/인라인 스타일이 딸려 와 표·제목 서식이 전부 죽는다. 붙여넣었다면 템플릿을 다시 적용하고 내용만 옮긴다. (편집기가 통짜 `<pre>` 붙여넣기는 문단으로 풀어주지만, 표·제목은 직접 다시 잡아야 한다.)
- 저장 전 어드민 **미리보기**로 확인한다. DB는 dev·운영 공유이므로 공개(published) 전환은 **명시적 지시가 있을 때만** 한다.

## MCP 연결 (Connected Integrations)
- **Vercel** — 배포/프로젝트 관리
- **Supabase** — DB/백엔드
