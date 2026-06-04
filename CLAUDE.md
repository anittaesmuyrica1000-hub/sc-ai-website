# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project

Supercoder AI 웹사이트 (Supercoder AI Website).

- Remote: https://github.com/anittaesmuyrica1000-hub/sc-ai-website.git
- Default branch: `main`

## 작업 규칙 (Workflow Rules)

### 새 기능 추가 시 자동 push (MUST)

새로운 기능이 추가되거나 구현이 완료되면 **항상** 다음 순서로 `main` 브랜치에 push 한다:

1. 변경 사항을 stage 한다 — `git add -A`
2. 의미 있는 메시지로 commit 한다 — `git commit -m "<설명>"`
3. `main`에 push 한다 — `git push origin main`

- 기능 단위로 작업이 끝날 때마다 위 절차를 수행한다 (별도 지시가 없어도 자동 적용).
- commit 메시지는 무엇이/왜 바뀌었는지 명확히 작성한다.
- secret(`.env` 등)은 절대 commit 하지 않는다 — `.gitignore`로 제외되어 있는지 항상 확인한다.

## 보안 / Secrets

- `.env` 파일은 `.gitignore`에 포함되어 있으며 git에 추적되지 않는다.
- `GITHUB_TOKEN`, `GITHUB_USERNAME` 등 자격증명은 `.env`에만 보관한다.

## MCP 연결 (Connected Integrations)

- **Vercel** — `plugin:vercel:vercel` (배포/프로젝트 관리)
- **Supabase** — `supabase` (DB/백엔드)
- **Figma** — `plugin:figma:figma` (디자인 ↔ 코드)
