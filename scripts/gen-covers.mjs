/* 블로그 커버 썸네일(데이터 차트) 생성기 — 1200x675 SVG.
 * public/charts/ (Next) 와 charts/ (정적) 양쪽에 동일 파일을 쓴다.
 * 브랜드 토큰: blue #2E6CF0, blue-d #1F54CC, ink #142036, slate #566179,
 *             slate-2 #8A93A8, soft #F4F8FF, soft-2 #EAF1FE, tint #DCE8FE, amber #E0890B. */
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1200, H = 675;
const C = {
  blue: "#2E6CF0", blueD: "#1F54CC", blue2: "#5B8DF7",
  ink: "#142036", slate: "#566179", slate2: "#8A93A8",
  soft: "#F4F8FF", soft2: "#EAF1FE", tint: "#DCE8FE",
  amber: "#E0890B", line: "#E5EBF5",
};
const FONT = "Pretendard, 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif";

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function header(eyebrow, titleLines) {
  const ew = 34 + eyebrow.length * 11.4;
  let s = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  s += `<rect x="64" y="56" width="${Math.round(ew)}" height="40" rx="20" fill="${C.tint}"/>`;
  s += `<circle cx="86" cy="76" r="5" fill="${C.blue}"/>`;
  s += `<text x="100" y="83" font-size="19" font-weight="700" fill="${C.blueD}">${esc(eyebrow)}</text>`;
  titleLines.forEach((t, i) => {
    s += `<text x="64" y="${162 + i * 50}" font-size="42" font-weight="800" fill="${C.ink}" letter-spacing="-1.2">${esc(t)}</text>`;
  });
  return s;
}
function source(txt) {
  return `<text x="64" y="636" font-size="18" fill="${C.slate2}">${esc(txt)}</text>`;
}
function wrap(inner, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${C.soft2}"/><stop offset="0.5" stop-color="${C.soft}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>` +
    `<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent || C.blue}"/><stop offset="1" stop-color="${C.blue2}"/></linearGradient>` +
    `<linearGradient id="barv" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${accent || C.blue}"/><stop offset="1" stop-color="${C.blue2}"/></linearGradient></defs>` +
    inner + `</svg>`;
}

/* 가로 막대 */
function hbars({ eyebrow, title, bars, unit, max, source: src, accent }) {
  let s = header(eyebrow, title);
  const x0 = 64, barX = 470, barMaxW = 1072 - barX;
  const top = 290, rowH = (560 - top) / bars.length;
  bars.forEach((b, i) => {
    const cy = top + rowH * i + rowH / 2;
    const w = Math.max(10, (b.val / max) * barMaxW);
    s += `<text x="${x0}" y="${cy + 7}" font-size="20" font-weight="600" fill="${C.slate}">${esc(b.label)}</text>`;
    s += `<rect x="${barX}" y="${cy - 16}" width="${barMaxW}" height="32" rx="9" fill="${C.soft2}"/>`;
    s += `<rect x="${barX}" y="${cy - 16}" width="${w.toFixed(1)}" height="32" rx="9" fill="url(#bar)"/>`;
    s += `<text x="${(barX + w + 14).toFixed(1)}" y="${cy + 8}" font-size="23" font-weight="800" fill="${accent || C.blue}">${b.disp}</text>`;
  });
  s += source(src);
  return wrap(s, accent);
}

/* 세로 막대 */
function vbars({ eyebrow, title, bars, unit, max, source: src, accent }) {
  let s = header(eyebrow, title);
  const baseY = 560, top = 280, chartH = baseY - top;
  const n = bars.length, slot = (1080 - 80) / n, bw = Math.min(120, slot * 0.5);
  bars.forEach((b, i) => {
    const cx = 80 + slot * i + slot / 2;
    const h = Math.max(8, (b.val / max) * chartH);
    s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="10" fill="url(#barv)"/>`;
    s += `<text x="${cx.toFixed(1)}" y="${(baseY - h - 16).toFixed(1)}" font-size="26" font-weight="800" fill="${accent || C.blue}" text-anchor="middle">${b.disp}</text>`;
    const words = b.label.split("\n");
    words.forEach((wd, j) => {
      s += `<text x="${cx.toFixed(1)}" y="${baseY + 32 + j * 24}" font-size="18" font-weight="600" fill="${C.slate}" text-anchor="middle">${esc(wd)}</text>`;
    });
  });
  s += `<line x1="64" y1="${baseY}" x2="1136" y2="${baseY}" stroke="${C.line}" stroke-width="2"/>`;
  s += source(src);
  return wrap(s, accent);
}

/* 도넛 + 보조 지표 */
function ring({ eyebrow, title, pct, big, sub, stats, source: src, accent }) {
  let s = header(eyebrow, title);
  const cx = 320, cy = 420, r = 130, sw = 34;
  const circ = 2 * Math.PI * r;
  const on = (pct / 100) * circ;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.soft2}" stroke-width="${sw}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent || C.blue}" stroke-width="${sw}" stroke-linecap="round" ` +
    `stroke-dasharray="${on.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
  s += `<text x="${cx}" y="${cy + 6}" font-size="68" font-weight="800" fill="${C.ink}" text-anchor="middle">${big}</text>`;
  s += `<text x="${cx}" y="${cy + 44}" font-size="19" font-weight="600" fill="${C.slate}" text-anchor="middle">${esc(sub)}</text>`;
  // 보조 지표 리스트(우측)
  const lx = 560;
  stats.forEach((st, i) => {
    const y = 318 + i * 96;
    s += `<text x="${lx}" y="${y}" font-size="40" font-weight="800" fill="${accent || C.blue}">${st.v}</text>`;
    s += `<text x="${lx}" y="${y + 30}" font-size="19" font-weight="600" fill="${C.slate}">${esc(st.label)}</text>`;
  });
  s += source(src);
  return wrap(s, accent);
}

const POSTS = {
  "trend": hbars({
    eyebrow: "AIVIEW 채용 데이터",
    title: ["2026 채용, 숫자로 읽는", "일곱 가지 변화"],
    unit: "%", max: 100, accent: C.blue,
    bars: [
      { label: "1년 내 조기퇴사 경험 기업", val: 84.7, disp: "84.7%" },
      { label: "조기퇴사 손실 2,000만원 이상", val: 75.6, disp: "75.6%" },
      { label: "챗GPT로 자소서 쓴 취준생", val: 60, disp: "60%" },
      { label: "AI 작성 의심 자소서", val: 48.5, disp: "48.5%" },
    ],
    source: "출처: 사람인·고용노동부·진학사 캐치·무하유",
  }),
  "reality": vbars({
    eyebrow: "AIVIEW 채용 데이터",
    title: ["데이터로 보는", "2026 채용 현실"],
    unit: "%", max: 100, accent: C.blue,
    bars: [
      { label: "AI 의심\n자소서", val: 48.5, disp: "48.5%" },
      { label: "챗GPT\n자소서", val: 60, disp: "60%" },
      { label: "조기퇴사\n경험 기업", val: 84.7, disp: "84.7%" },
      { label: "신규입사자\n조기퇴사", val: 28.7, disp: "28.7%" },
    ],
    source: "출처: 무하유·진학사 캐치·사람인",
  }),
  "ai-interview": ring({
    eyebrow: "AIVIEW 채용 데이터",
    title: ["AI 면접이 채용을", "바꾸는 3가지 방식"],
    pct: 65, big: "65%+", sub: "AI 채용 도입·검토", accent: C.blue,
    stats: [
      { v: "83.9%", label: "면접 노쇼 경험 기업" },
      { v: "33%", label: "평균 면접 노쇼율" },
      { v: "32일", label: "직원 1명 채용 소요" },
    ],
    source: "출처: 잡코리아·사람인",
  }),
  "verify": ring({
    eyebrow: "AIVIEW 채용 데이터",
    title: ["가짜 이력서를 걸러내는", "검증의 기술"],
    pct: 80, big: "80%", sub: "지원자 거짓말 경험", accent: C.blue,
    stats: [
      { v: "62.7%", label: "실무 면접에서 적발" },
      { v: "48.5%", label: "AI 작성 의심 자소서" },
      { v: "17%", label: "서류 전형에서 적발" },
    ],
    source: "출처: 사람인·무하유",
  }),
  "cost": hbars({
    eyebrow: "AIVIEW 채용 데이터",
    title: ["채용 1건의 진짜 비용", "보이지 않아서 더 비싸다"],
    unit: "만원", max: 4000, accent: C.amber,
    bars: [
      { label: "대졸 신입 평균 초임", val: 3675, disp: "3,675만원" },
      { label: "조기퇴사 손실(1인)", val: 2000, disp: "2,000만원+" },
      { label: "직원 1명 채용 비용", val: 1272, disp: "1,272만원" },
    ],
    source: "출처: 경총·고용노동부·사람인",
  }),
  "schedule": vbars({
    eyebrow: "AIVIEW 채용 데이터",
    title: ["면접 일정 조율,", "자동화로 줄이는 법"],
    unit: "%", max: 100, accent: C.blue,
    bars: [
      { label: "노쇼 경험\n기업", val: 83.9, disp: "83.9%" },
      { label: "평균\n노쇼율", val: 33, disp: "33%" },
      { label: "AI 채용\n도입·검토", val: 65, disp: "65%+" },
    ],
    source: "출처: 사람인·잡코리아 · 평균 채용 소요 32일",
  }),
};

for (const dir of ["public/charts", "charts"]) mkdirSync(dir, { recursive: true });
for (const [name, svg] of Object.entries(POSTS)) {
  writeFileSync(`public/charts/${name}.svg`, svg);
  writeFileSync(`charts/${name}.svg`, svg);
  console.log(`wrote charts/${name}.svg (${svg.length}b)`);
}
