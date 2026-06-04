# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Supercoder AI 웹사이트 — **AIVIEW** 제품 랜딩 페이지. AI 면접으로 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달하는 B2B 채용 SaaS의 마케팅 페이지다. 카피·UI는 전부 한국어.

- Remote: https://github.com/anittaesmuyrica1000-hub/sc-ai-website.git
- Default branch: `main`

## Architecture

**정적 멀티 페이지.** 빌드 시스템·프레임워크·패키지 매니저가 없다. 각 페이지는 자체 인라인 `<style>`을 가진 단일 HTML 파일이다.

- **페이지:** `index.html`(랜딩), `apply.html`(무료 신청 — 폼·검증·완료 상태). 모든 CTA는 `apply.html`로 연결된다.
- **공유 GNB/푸터는 `partials.js`.** `<site-header>`/`<site-footer>` 커스텀 엘리먼트로 nav·footer 마크업을 한 곳에서 관리(내부에 `<header>`/`<footer>` 태그를 렌더하므로 기존 CSS 셀렉터가 그대로 적용). 빌드/`fetch` 없이 `file://`·정적서버 양쪽에서 동작. nav/footer **CSS 자체**는 각 페이지 인라인 `<style>`에 동일하게 둔다(마크업만 공유).
- **디자인 시스템 규격은 `docs/design-system.md`.** 토큰·폰트·컴포넌트 정의. 색/반경/그림자/폰트는 하드코딩하지 말고 이 규격(`:root` 변수)을 따른다.

- **CSS는 `<style>` 인라인 블록 하나.** 외부 스타일시트 없음. 디자인 토큰은 `:root`의 CSS 변수로 정의(`--blue`, `--ink`, `--soft`, `--r`, `--shadow` 등) — 색상/반경/그림자를 바꿀 때는 하드코딩 대신 이 변수를 수정한다.
- **섹션 = 페이지 구조.** 본문은 번호가 매겨진 `<section>` 블록의 세로 스택이다(DECLARATION → VALUE → FLOOD → ROLE → HOW IT WORKS → PROOF → VOICES → FINAL CTA → FOOTER). 각 섹션은 고유 클래스(`.decl`, `.value`, `.flood`, `.role`, `.how`, `.proof2`, `.voices`, `.final`)를 가지며, 해당 섹션의 CSS는 주석 헤더(`/* 1. DECLARATION */` 등) 아래에 모여 있다. 섹션을 편집할 땐 마크업과 그 주석 블록을 함께 본다.
- **실험적/대체 레이아웃이 공존한다.** 동일 메시지의 변형 컴포넌트가 여러 개 들어 있다 — 예: ROLE REVERSAL은 `.role`(2-컬럼)과 `.role-funnel`(깔때기) 두 버전이 있고, 깔때기에도 `.tri`/`.fA`/`.fB`/`.fC` 변형 CSS가 남아 있다. 일부는 현재 마크업에서 렌더링되지 않는 "보관용" 스타일이니, 클래스를 지우기 전 실제 사용 여부를 확인한다.
- **반응형은 컴포넌트별 `@media`로.** 전역 브레이크포인트 시스템이 아니라 각 섹션 CSS 끝에 개별 `@media(max-width:...)` 규칙이 붙어 있다. 주 브레이크포인트는 880/760/560px 대.
- **외부 의존성은 CDN:** Pretendard 폰트(jsdelivr), Font Awesome 6.5.2 아이콘(cdnjs), `apply.html`은 `@supabase/supabase-js@2`(jsdelivr) 추가. 아이콘은 `<i class="fa-...">`로 사용.
- **로컬 에셋:** `supercoder-nav.png`(헤더 로고), `supercoder-logo.png`(푸터 로고), `demo-result.png`(HOW IT WORKS 제품 데모 스크린샷). 상대경로로 직접 참조한다.
- **무료 신청 폼은 Supabase 저장(기능).** `apply.html` 폼은 제출 시 클라이언트에서 직접 Supabase `public.signups` 테이블에 INSERT 한다(검증 → insert → 완료 화면). `index.html` 최종 CTA는 폼이 아니라 `apply.html`로 가는 버튼이다.

## Backend (Supabase)

- **프로젝트:** `supercoder-aiview` (ref `ymzlcghqamkynuvotzgh`, region ap-northeast-2). org `uwuwftckkxbtbqjlsrav`.
- **테이블:** `public.signups` — 컬럼: `id, created_at, name, company, email, role, phone, size, memo`. RLS 활성, **anon `insert`만 허용**(SELECT 정책 없음 → 익명 읽기 불가, 쓰기 전용).
- **연결 방식:** 정적 페이지라 백엔드 없이 `apply.html`에 **publishable(공개) 키 + 프로젝트 URL을 인라인**한다. publishable 키는 공개용이라 노출돼도 안전(RLS가 INSERT로 제한). 로컬(`file://`·localhost)·배포 모두 동일 프로젝트/데이터에 연결된다.
- **service_role 키는 절대 클라이언트/깃에 넣지 않는다.** 신청 데이터 조회·관리는 Supabase 대시보드 또는 MCP(`execute_sql`)로 한다.

## Running / Preview

빌드 단계 없음. 브라우저에서 바로 열거나 정적 서버로 띄운다:

```bash
open index.html                 # macOS에서 바로 열기
python3 -m http.server 8000     # http://localhost:8000 로 서빙 (CDN/이미지 경로 확인용 권장)
```

테스트·린트·빌드 명령은 없다(정적 HTML).

## 작업 규칙 (Workflow Rules)

### 구현 후 로컬 Playwright 테스트 (MUST)

구현이 끝나면 **commit/push 전에 항상** 로컬에서 Playwright로 검증한다:

1. 정적 서버를 띄운다 — `python3 -m http.server 8000` (백그라운드).
2. Playwright(`mcp__playwright__*`)로 `http://localhost:8000`에 접속해 변경한 화면을 확인한다.
3. 캡처한 스크린샷은 **반드시 `screenshots/` 폴더**에 저장한다(없으면 생성). 파일명은 의미 있게 — 예: `screenshots/<섹션-또는-기능>-<desktop|mobile>.png`.
4. 콘솔 에러·레이아웃 깨짐이 없는지 확인한 뒤에야 다음의 push 단계로 넘어간다.

- 데스크톱뿐 아니라 주요 반응형 브레이크포인트(880/760/560px)도 필요 시 캡처한다.
- `screenshots/`는 git에 커밋해 변경 이력의 시각적 근거로 남긴다.

### 새 기능 추가 시 자동 push (MUST)

새로운 기능이 추가되거나 구현이 완료되면 **항상** 다음 순서로 `main` 브랜치에 push 한다:

1. `git add -A`
2. 의미 있는 메시지로 commit — `git commit -m "<설명>"`
3. `git push origin main`

- 기능 단위로 작업이 끝날 때마다 별도 지시가 없어도 자동 적용한다.
- secret(`.env` 등)은 절대 commit 하지 않는다 — `.gitignore` 제외 여부를 항상 확인한다.

## 보안 / Secrets

- `.env`는 `.gitignore`에 포함되어 git에 추적되지 않는다. `GITHUB_TOKEN`, `GITHUB_USERNAME` 등 자격증명은 `.env`에만 보관한다.

## MCP 연결 (Connected Integrations)

- **Vercel** — `plugin:vercel:vercel` (배포/프로젝트 관리)
- **Supabase** — `supabase` (DB/백엔드)
- **Figma** — `plugin:figma:figma` (디자인 ↔ 코드)
