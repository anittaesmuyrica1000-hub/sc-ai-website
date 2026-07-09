// 블로그 커버 썸네일(SVG) 일괄 생성 — 밝고 깔끔한 에디토리얼.
// SVG는 <img>로 렌더되며 시스템 한글폰트로 표시된다(Pretendard 근사).
// 실행: node scripts/gen-covers.mjs  → public/blog-covers/*.svg
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = new URL("../public/blog-covers/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// 한 줄 = 세그먼트 배열 [{t, hl?}] → <tspan> 연결
const line = (segs) => segs.map((s) => `<tspan${s.hl ? ' fill="#2E6CF0"' : ""}>${esc(s.t)}</tspan>`).join("");

// posts: id(=파일명 코드), category, subtitle, lines[], fs(제목 폰트크기)
const POSTS = [
  { code: "g1", cat: "AI 면접", fs: 72, lines: [[{ t: "질문을 외운 지원자," }], [{ t: "검증되는 " }, { t: "질문 설계법", hl: true }]], sub: "예상질문 대비를 무력화하는 구조화 면접 설계" },
  { code: "g2", cat: "채용 검증", fs: 64, lines: [[{ t: "지원자는 완벽히 준비합니다," }], [{ t: "채용팀은 " }, { t: "무엇을 볼까", hl: true }]], sub: "준비된 답변 너머, 진짜 역량을 보는 법" },
  { code: "g3", cat: "AI 면접", fs: 76, lines: [[{ t: "AI 역량검사", hl: true }, { t: "만으로" }], [{ t: "충분할까?" }]], sub: "역량검사 vs AI 면접 — 무엇을 검증하나" },
  { code: "g4", cat: "채용 검증", fs: 72, lines: [[{ t: "AI 면접이 1차에서" }], [{ t: "잡아내는 " }, { t: "7가지 신호", hl: true }]], sub: "서류·필기로는 안 보이던 위험 신호" },
  { code: "n1", cat: "채용 검증", fs: 72, lines: [[{ t: "AI vs AI, 진화하는" }], [{ t: "면접 " }, { t: "부정행위와 탐지", hl: true }]], sub: "원격·비대면 면접 시대의 무결성 확보" },
  { code: "n2", cat: "채용 검증", fs: 76, lines: [[{ t: "AI 채용은 " }, { t: "공정한가", hl: true }]], sub: "AI 채용의 편향 리스크와 관리 방법" },
  { code: "n3", cat: "AI 면접", fs: 76, lines: [[{ t: "대화형 AI 면접", hl: true }, { t: "의" }], [{ t: "빛과 그림자" }]], sub: "지원자 경험과 검증력, 두 마리 토끼" },
  { code: "n4", cat: "채용 트렌드", fs: 68, lines: [[{ t: "학벌보다 실력, AI가 이끄는" }], [{ t: "역량 중심 채용", hl: true }]], sub: "스펙 대신 직무 역량으로 뽑는 법" },
  { code: "n5", cat: "HR 인사이트", fs: 72, lines: [[{ t: "에이전틱 AI", hl: true }, { t: "의 효율" }], [{ t: "vs 인간적 유대" }]], sub: "자동화와 사람의 판단, 어디서 나눌까" },
  { code: "n6", cat: "HR 인사이트", fs: 76, lines: [[{ t: "스펙은 " }, { t: "성과를 예측", hl: true }], [{ t: "하지 못한다" }]], sub: "채용 예측타당도, 무엇을 봐야 하나" },
  { code: "n7", cat: "채용 자동화", fs: 72, lines: [[{ t: "채용팀이 바로 쓰는" }], [{ t: "AI 프롬프트", hl: true }, { t: " 모음" }]], sub: "공고·평가·리포트 실무 프롬프트 템플릿" },
  { code: "n8", cat: "AI 면접", fs: 72, lines: [[{ t: "AI 면접 " }, { t: "도입 ROI", hl: true }, { t: "," }], [{ t: "기업이 응답한 결과" }]], sub: "도입 기업이 밝힌 시간·비용 효과" },
  { code: "n9", cat: "채용 자동화", fs: 70, lines: [[{ t: "채용을 " }, { t: "AX하는 5단계", hl: true }, { t: "," }], [{ t: "어디부터 AI를?" }]], sub: "채용 프로세스 자동화 로드맵" },
  { code: "n10", cat: "채용 트렌드", fs: 68, lines: [[{ t: "HR의 AX, 어디서 시작할까" }], [{ t: "AI " }, { t: "1차 스크리닝", hl: true }, { t: "부터" }]], sub: "가짜 이력서 시대의 첫 자동화 지점" },
];

function svg(p) {
  const n = p.lines.length;
  const lh = Math.round(p.fs * 1.18);
  const blockH = n * lh;
  const cy = 360; // 제목 블록 세로 중심
  let y0 = Math.round(cy - blockH / 2 + p.fs * 0.78);
  const titleEls = p.lines
    .map((segs, i) => `  <text x="90" y="${y0 + i * lh}" font-size="${p.fs}" font-weight="800" letter-spacing="-3" fill="#142036">${line(segs)}</text>`)
    .join("\n");
  const chipW = 40 + p.cat.length * 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" font-family="'Pretendard','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif">
  <defs>
    <radialGradient id="g1" cx="100%" cy="0%" r="70%"><stop offset="0" stop-color="#2E6CF0" stop-opacity="0.10"/><stop offset="0.62" stop-color="#2E6CF0" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="#2E6CF0" stop-opacity="0.06"/><stop offset="0.6" stop-color="#2E6CF0" stop-opacity="0"/></radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E6CF0"/><stop offset="1" stop-color="#5B8DF7"/></linearGradient>
    <linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E6CF0"/><stop offset="1" stop-color="#5B8DF7"/></linearGradient>
  </defs>
  <rect width="1280" height="720" fill="#ffffff"/>
  <rect width="1280" height="720" fill="url(#g1)"/>
  <rect width="1280" height="720" fill="url(#g2)"/>
  <rect x="0" y="104" width="8" height="512" rx="4" fill="url(#bar)"/>
  <rect x="92" y="86" width="${chipW}" height="44" rx="22" fill="#EAF1FE" stroke="#DCE8FE"/>
  <text x="${92 + chipW / 2}" y="115" text-anchor="middle" font-size="22" font-weight="800" fill="#1F54CC">${esc(p.cat)}</text>
  <text x="${92 + chipW + 18}" y="115" font-size="19" font-weight="700" fill="#8A93A8">AI 면접 · 채용 검증</text>
${titleEls}
  <text x="92" y="${y0 + (n - 1) * lh + 78}" font-size="26" font-weight="600" fill="#566179">${esc(p.sub)}</text>
  <rect x="92" y="612" width="40" height="40" rx="11" fill="url(#mk)"/>
  <text x="112" y="639" text-anchor="middle" font-size="19" font-weight="900" fill="#fff" font-family="monospace">&lt;/&gt;</text>
  <text x="144" y="641" font-size="26" font-weight="800" fill="#142036">Supercoder</text>
  <circle cx="322" cy="633" r="3" fill="#8A93A8"/>
  <text x="340" y="641" font-size="20" font-weight="600" fill="#566179">AI면접 블로그</text>
</svg>
`;
}

// 코드 → 기존 cover_url 파일명(덮어쓰기 → DB 수정 불필요, 자동 반영)
const FILE = {
  g1: "hr-ai-interview-questions.svg",
  g2: "what-to-verify-first-screening.svg",
  g3: "ai-assessment-vs-ai-interview.svg",
  g4: "what-ai-interview-verifies.svg",
  n1: "ai-interview-cheating-detection.svg",
  n2: "ai-hiring-bias-fairness.svg",
  n3: "conversational-ai-interview-pros-cons.svg",
  n4: "skills-based-hiring-2026.svg",
  n5: "agentic-ai-vs-human-touch.svg",
  n6: "spec-doesnt-predict-performance.svg",
  n7: "recruiter-ai-prompts.svg",
  n8: "ai-interview-roi.svg",
  n9: "recruiting-ax-5-steps.svg",
  n10: "hr-ax-ai-screening.svg",
};

for (const p of POSTS) {
  const file = FILE[p.code];
  if (!file) throw new Error(`no filename for ${p.code}`);
  writeFileSync(new URL(file, OUT), svg(p));
}
console.log(`generated ${POSTS.length} covers → public/blog-covers/ (기존 파일명 덮어쓰기)`);
