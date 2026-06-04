# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Supercoder AI 웹사이트 — **AIVIEW** 제품 랜딩 페이지. AI 면접으로 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달하는 B2B 채용 SaaS의 마케팅 페이지다. 카피·UI는 전부 한국어.

- Remote: https://github.com/anittaesmuyrica1000-hub/sc-ai-website.git
- Default branch: `main`

## Architecture

**단일 정적 파일.** 빌드 시스템·프레임워크·패키지 매니저가 없다. `index.html` 한 파일에 마크업·CSS·(소량의) JS가 모두 들어 있다.

- **CSS는 `<style>` 인라인 블록 하나.** 외부 스타일시트 없음. 디자인 토큰은 `:root`의 CSS 변수로 정의(`--blue`, `--ink`, `--soft`, `--r`, `--shadow` 등) — 색상/반경/그림자를 바꿀 때는 하드코딩 대신 이 변수를 수정한다.
- **섹션 = 페이지 구조.** 본문은 번호가 매겨진 `<section>` 블록의 세로 스택이다(DECLARATION → VALUE → FLOOD → ROLE → HOW IT WORKS → PROOF → VOICES → FINAL CTA → FOOTER). 각 섹션은 고유 클래스(`.decl`, `.value`, `.flood`, `.role`, `.how`, `.proof2`, `.voices`, `.final`)를 가지며, 해당 섹션의 CSS는 주석 헤더(`/* 1. DECLARATION */` 등) 아래에 모여 있다. 섹션을 편집할 땐 마크업과 그 주석 블록을 함께 본다.
- **실험적/대체 레이아웃이 공존한다.** 동일 메시지의 변형 컴포넌트가 여러 개 들어 있다 — 예: ROLE REVERSAL은 `.role`(2-컬럼)과 `.role-funnel`(깔때기) 두 버전이 있고, 깔때기에도 `.tri`/`.fA`/`.fB`/`.fC` 변형 CSS가 남아 있다. 일부는 현재 마크업에서 렌더링되지 않는 "보관용" 스타일이니, 클래스를 지우기 전 실제 사용 여부를 확인한다.
- **반응형은 컴포넌트별 `@media`로.** 전역 브레이크포인트 시스템이 아니라 각 섹션 CSS 끝에 개별 `@media(max-width:...)` 규칙이 붙어 있다. 주 브레이크포인트는 880/760/560px 대.
- **외부 의존성은 CDN 2개뿐:** Pretendard 폰트(jsdelivr), Font Awesome 6.5.2 아이콘(cdnjs). 아이콘은 `<i class="fa-...">`로 사용.
- **로컬 에셋:** `supercoder-nav.png`(헤더 로고), `supercoder-logo.png`(푸터 로고), `demo-result.png`(HOW IT WORKS 제품 데모 스크린샷). `index.html`이 상대경로로 직접 참조한다.
- **CTA 폼은 비기능.** 최종 CTA의 `<form>`은 `onsubmit="return false"`로 제출을 막아 둔 더미다 — 실제 백엔드/제출 처리는 아직 없다.

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
