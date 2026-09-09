// 제품 업데이트(/update) 본문을 기존 회차와 같은 서식으로 맞추는 규칙 기반 변환기.
// 대표가 자유 형식(워드·노션·메일·맨텍스트)으로 쓴 원고를 어드민 '표준 서식으로 맞추기' 버튼이 이 함수로 정리한다.
//
// 골격 정의는 CLAUDE.md '업데이트 글(/update) 본문 스타일'과 AdminClient의 UPDATE_TEMPLATES가 원본이다.
// 외부 API를 쓰지 않는다 — 브라우저에서 즉시 돌고 결과가 매번 똑같다. 대신 '판단'은 하지 않는다:
//   하는 일   = 섹션 제목 인식·이모지/번호 부여·hr 삽입·나열을 표로·마크다운 잔재 변환·잡태그 제거
//   안 하는 일 = 문장 다시 쓰기, 없는 내용 만들어내기, 원고 순서 바꾸기(순서는 원고를 그대로 따른다)

// ── 섹션 사전 ────────────────────────────────────────────────────────────────
// 제목 후보에서 이모지·번호·기호를 걷어낸 뒤 여기에 걸리면 표준 대제목으로 승격한다.
type SectionKey = "overview" | "features" | "ops" | "bugs" | "security" | "notice" | "closing";
type SectionDef = { key: SectionKey; level: "h2" | "h3"; title: string; match: RegExp };

const SECTIONS: SectionDef[] = [
  { key: "overview", level: "h2", title: "💡 Overview", match: /^(overview|개요|이번\s*업데이트(\s*개요|\s*요약)?|업데이트\s*개요|요약|들어가며)$/i },
  { key: "features", level: "h2", title: "⭐ 주요 업데이트", match: /^(주요\s*(업데이트|변경|기능|개선)(\s*(내용|사항))?|신규\s*기능|new\s*features?)$/i },
  { key: "ops", level: "h2", title: "🔧 운영 경험 개선", match: /^(운영\s*경험\s*개선|(기타\s*)?(개선|편의)\s*(사항|기능)?|improvements?)$/i },
  { key: "bugs", level: "h3", title: "🐞 버그 수정", match: /^(버그\s*수정|수정\s*사항|오류\s*수정|bug\s*fix(es)?)$/i },
  { key: "security", level: "h3", title: "🔐 보안 및 안정성", match: /^(보안(\s*(및|·|,)?\s*안정성)?|안정성(\s*개선)?|security)$/i },
  { key: "notice", level: "h2", title: "⚠️ 이용 안내", match: /^(이용\s*안내|안내\s*사항|유의\s*사항|참고\s*사항|주의\s*사항|공지)$/i },
  { key: "closing", level: "h2", title: "⏳ 계속 업데이트 중인 AI Interview", match: /^(계속\s*업데이트.*|마무리|맺음말?|끝으로|앞으로의?\s*계획)$/i },
];
const OPS_SECTION = SECTIONS.find((s) => s.key === "ops")!;

// 기능 제목(h3)에 붙일 이모지 — 제목 낱말로 고른다. 원고에 이미 이모지가 있으면 그대로 둔다.
// 위에서부터 먼저 걸리는 것을 쓴다 — 구체적인 낱말을 앞에 둔다.
// (예: '리포트 언어 별도 선택'은 언어(🌐)보다 리포트(📄)가 주제다.)
const H3_EMOJI: [RegExp, string][] = [
  [/리포트|보고서|문서|결과지/, "📄"],
  [/인재상|기준|평가|채점/, "🧭"],
  [/언어|다국어|번역|글로벌/, "🌐"],
  [/시간|시각|일정|마감|기한|예약/, "⏰"],
  [/질문|면접관|대화|문항/, "💬"],
  [/알림|메일|초대|발송/, "🔔"],
  [/화면|페이지|모바일|앱|ui/i, "📱"],
  [/보안|권한|인증|계정/, "🔐"],
  [/다시|재시도|반복/, "🔁"],
  [/속도|성능|안정|복구/, "🛠️"],
  [/설정|옵션|관리/, "⚙️"],
];
const DEFAULT_H3_EMOJI = "✨";
// 줄 앞의 이모지 덩어리(변이 선택자·ZWJ 포함). \p{Extended_Pictographic}로 잡아야 서로게이트가 깨지지 않는다.
const EMOJI_HEAD = /^\s*(?:\p{Extended_Pictographic}|️|‍|[←-⇿⬀-⯿])+\s*/u;
const NUMBER_HEAD = /^\s*(?:(?:\p{Extended_Pictographic}|️|‍)+\s*)?\d{1,2}\s*[.)]\s*\S/u;

// ── HTML 조각 도구 ───────────────────────────────────────────────────────────
const INLINE_KEEP = new Set(["STRONG", "EM", "U", "S", "A", "CODE", "BR"]);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const textOf = (html: string) =>
  html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();

// 인라인만 남기고 나머지 태그는 벗긴다(span·font·style 등). <b>/<i>는 <strong>/<em>으로 통일.
function cleanInline(html: string): string {
  return html
    .replace(/<b(\s[^>]*)?>/gi, "<strong>").replace(/<\/b>/gi, "</strong>")
    .replace(/<i(\s[^>]*)?>/gi, "<em>").replace(/<\/i>/gi, "</em>")
    .replace(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g, (_m, slash: string, tag: string, attrs: string) => {
      const T = tag.toUpperCase();
      if (!INLINE_KEEP.has(T)) return "";
      if (T === "A" && !slash) {
        const href = /href\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
        return href ? `<a href="${href}">` : "<a>";
      }
      return `<${slash}${tag.toLowerCase()}>`;
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// 마크다운 잔재를 인라인 태그로 — 워드·노션·메모장에서 온 원고에 흔하다.
function inlineMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

// ── 1단계: 입력을 블록 목록으로 ──────────────────────────────────────────────
type Kind = "h" | "p" | "li" | "table" | "hr";
type Block = { kind: Kind; html: string; level?: number };

const TABLE_MARK = (i: number) => `\nTABLEMARK${i}\n`;

function toBlocks(input: string): Block[] {
  let src = String(input || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");

  // 표는 통째로 보존(내부는 나중에 규격화)
  const tables: string[] = [];
  src = src.replace(/<table[\s\S]*?<\/table>/gi, (m) => TABLE_MARK(tables.push(m) - 1));

  const blocks: Block[] = [];
  const push = (kind: Kind, raw: string, level?: number) => {
    if (kind === "hr") { blocks.push({ kind, html: "" }); return; }
    if (kind === "table") { blocks.push({ kind, html: raw }); return; }
    const html = inlineMarkdown(cleanInline(raw));
    if (!textOf(html)) return;
    blocks.push({ kind, html, level });
  };

  // <div>·<br>는 줄바꿈으로 환산해 줄 단위 분류에 태운다
  src = src
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|section|article)>/gi, "\n")
    .replace(/<(?:div|section|article)(?:\s[^>]*)?>/gi, "\n");

  const blockTag = /<(h[1-6]|p|li|blockquote|pre)(?:\s[^>]*)?>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  let m: RegExpExecArray | null;
  let cursor = 0;
  while ((m = blockTag.exec(src))) {
    const between = src.slice(cursor, m.index);
    if (between.trim()) splitLines(between, "p", push, tables);
    cursor = blockTag.lastIndex;
    const tag = (m[1] || "").toLowerCase();
    if (!tag) { push("hr", ""); continue; }
    if (/^h[1-6]$/.test(tag)) { push("h", m[2] || "", Number(tag[1])); continue; }
    splitLines(m[2] || "", tag === "li" ? "li" : "p", push, tables);
  }
  const tail = src.slice(cursor);
  if (tail.trim()) splitLines(tail, "p", push, tables);
  return blocks;
}

// 한 줄을 종류별로 분류한다. <p>·<li> 안의 줄과 통짜 텍스트가 같은 규칙을 타도록 한 곳에 모았다.
// 번호(1. / 1))로 시작하는 줄은 목록으로 보지 않는다 — 업데이트 글에서 그건 대개 기능 제목이다.
// 진짜 목록인지 제목인지는 길이를 보고 조립 단계에서 가른다.
function classifyLine(
  line: string,
  defaultKind: Kind,
  push: (k: Kind, raw: string, level?: number) => void,
  tables: string[]
) {
  const s = line.trim();
  const plain = textOf(s);
  const t = /^TABLEMARK(\d+)$/.exec(plain);
  if (t) { push("table", tables[Number(t[1])]); return; }
  if (!plain) return;
  if (/^(?:[-*_=]\s*){3,}$/.test(plain)) { push("hr", ""); return; }
  const md = /^(#{1,4})\s+(.*)$/.exec(plain);
  if (md) { push("h", md[2], md[1].length); return; }
  const bullet = /^[-•·▪◦*]\s+/.exec(plain);
  if (bullet) { push("li", s.replace(/^((?:<[^>]+>\s*)*)[-•·▪◦*]\s+/, "$1")); return; }
  push(defaultKind, s);
}

function splitLines(
  chunk: string,
  defaultKind: Kind,
  push: (k: Kind, raw: string, level?: number) => void,
  tables: string[]
) {
  chunk.split("\n").forEach((line) => classifyLine(line, defaultKind, push, tables));
}

// ── 2단계: 분류 도구 ─────────────────────────────────────────────────────────
const stripLead = (s: string) =>
  s.replace(EMOJI_HEAD, "").replace(/^\s*\d{1,2}\s*[.)]\s*/, "").replace(/^[\s#\-•·*]+/, "").replace(/[\s:：.]+$/, "").trim();

function matchSection(text: string): SectionDef | null {
  const key = stripLead(text);
  if (!key || key.length > 24) return null;
  return SECTIONS.find((s) => s.match.test(key)) || null;
}

// '이름 — 설명' / '이름: 설명' 꼴이면 [이름, 설명]으로 쪼갠다(표 후보).
function splitPair(html: string): [string, string] | null {
  const bare = html.replace(/<\/?strong>/g, "").trim();
  const m = /^(.{1,24}?)\s*(?:—|–|:|：|\s-\s)\s*(\S[\s\S]*)$/.exec(bare);
  if (!m) return null;
  const [, k, v] = m;
  const key = textOf(k);
  if (!key || key.length < 2 || textOf(v).length < 2) return null;
  if (/<a\b|https?:|\d{1,2}:\d{2}/i.test(k)) return null; // 링크·시각 표기는 항목명이 아니다
  return [key, v.trim()];
}

function tableHtml(head: [string, string], rows: [string, string][]): string {
  return (
    '<div class="post-table-wrap"><table class="post-table"><thead><tr>' +
    `<th>${head[0]}</th><th>${head[1]}</th></tr></thead><tbody>` +
    rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("") +
    "</tbody></table></div>"
  );
}

// 이미 있는 표를 규격(post-table-wrap/post-table)으로 통일한다.
function normalizeTable(raw: string): string {
  const t = raw
    .replace(/<\/?div[^>]*>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/<table[^>]*>/i, '<table class="post-table">');
  return `<div class="post-table-wrap">${t}</div>`;
}

// ── 3단계: 조립 ──────────────────────────────────────────────────────────────
export function formatUpdateBody(input: string): string {
  const blocks = toBlocks(input);
  const out: string[] = [];
  let section: SectionKey | null = null;
  let inOps = false; // 🔧 운영 경험 개선 아래인지 — 🐞·🔐은 이 h2의 하위여야 한다
  let featureNo = 0;
  let sawH2 = false;

  // 연속된 '이름 — 설명' 줄을 모아 표(3개 이상) 또는 목록으로 바꾼다.
  let pairBuf: { pair: [string, string]; fromList: boolean }[] = [];
  let liBuf: string[] = [];

  const flushPairs = () => {
    if (!pairBuf.length) return;
    const head: [string, string] = section === "bugs" ? ["영역", "설명"] : ["항목", "내용"];
    // 표를 쓰는 섹션은 기능 설명·버그 수정·이용 안내뿐이다.
    // 운영 경험 개선·보안 및 안정성은 템플릿상 '<strong>항목</strong> — 설명' 목록으로 둔다.
    const tableSection = section === "features" || section === "bugs" || section === "notice";
    if (tableSection && pairBuf.length >= 3) {
      out.push(tableHtml(head, pairBuf.map((p) => p.pair)));
    } else if (pairBuf.every((p) => p.fromList)) {
      out.push("<ul>" + pairBuf.map((p) => `<li><strong>${p.pair[0]}</strong> — ${p.pair[1]}</li>`).join("") + "</ul>");
    } else {
      // 문단으로 쓰인 한두 줄은 굳이 목록으로 바꾸지 않는다(원문 훼손 방지)
      pairBuf.forEach((p) => out.push(`<p><strong>${p.pair[0]}</strong> — ${p.pair[1]}</p>`));
    }
    pairBuf = [];
  };
  const flushLis = () => {
    if (!liBuf.length) return;
    out.push("<ul>" + liBuf.map((l) => `<li>${l}</li>`).join("") + "</ul>");
    liBuf = [];
  };
  const flush = () => { flushPairs(); flushLis(); };

  const pushHeading = (def: SectionDef) => {
    flush();
    if (def.level === "h2") {
      if (sawH2) out.push("<hr>");
      sawH2 = true;
      inOps = def.key === "ops";
      if (def.key === "features") featureNo = 0;
    } else if (!inOps) {
      // 🐞·🔐은 🔧 운영 경험 개선의 하위 — 부모가 없으면 만들어 준다
      if (sawH2) out.push("<hr>");
      sawH2 = true;
      inOps = true;
      out.push(`<h2>${OPS_SECTION.title}</h2>`);
    }
    section = def.key;
    out.push(`<${def.level}>${def.title}</${def.level}>`);
  };

  for (const b of blocks) {
    if (b.kind === "table") { flush(); out.push(normalizeTable(b.html)); continue; }
    if (b.kind === "hr") continue; // 구분선은 섹션 기준으로 우리가 다시 넣는다

    const text = textOf(b.html);

    const sec = b.kind === "li" ? null : matchSection(text);
    if (sec) { pushHeading(sec); continue; }

    // 기능 제목? — 원고에서 제목 태그였거나, 번호로 시작하는 짧은 줄이거나,
    // 문장 전체가 굵은 짧은 줄(워드·메일에서 제목을 굵게만 쓴 경우)
    const numbered = NUMBER_HEAD.test(text);
    const boldTitle =
      /^<strong>[\s\S]*<\/strong>$/.test(b.html.trim()) && text.length <= 40 && !/[.!?]$|[다요]\.?$/.test(text);
    const headingish = b.kind === "h" || (b.kind === "p" && (boldTitle || (numbered && text.length <= 60)));
    if (headingish && !(b.kind === "p" && splitPair(b.html))) {
      const bare = stripLead(text);
      if (!bare) continue;
      flush();
      const emoji = EMOJI_HEAD.exec(text)?.[0]?.trim() || "";
      if (section === "features") {
        featureNo += 1;
        // '(옵션 · 별도 설정 필요)' 같은 꼬리표는 주제가 아니므로 이모지 판단에서 뺀다
        const topic = bare.replace(/[(（][^)）]*[)）]\s*$/, "").trim() || bare;
        const pick = emoji || H3_EMOJI.find(([re]) => re.test(topic))?.[1] || DEFAULT_H3_EMOJI;
        out.push(`<h3>${pick} ${featureNo}. ${esc(bare)}</h3>`);
      } else {
        out.push(`<h3>${emoji ? emoji + " " : ""}${esc(bare)}</h3>`);
      }
      continue;
    }

    // 나열 항목 — '이름 — 설명'이면 표/목록 후보로 모으고, 아니면 일반 목록
    const asList = b.kind === "li" || (b.kind === "p" && numbered);
    const pair = splitPair(b.html);
    if (pair) { flushLis(); pairBuf.push({ pair, fromList: asList }); continue; }
    if (asList) { flushPairs(); liBuf.push(b.html.replace(/^\s*\d{1,2}\s*[.)]\s*/, "")); continue; }

    flush();
    out.push(`<p>${b.html}</p>`);
  }
  flush();

  return out.join("\n").replace(/<hr>\s*(?=<hr>)/g, "").replace(/^<hr>\s*/, "").trim();
}

// 편집기·저장본의 표를 규격 래퍼로 통일(붙여넣기로 class가 날아간 경우 복구).
export function tidyUpdateHtml(raw: string): string {
  return String(raw || "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<div\s+class="post-table-wrap"\s*>([\s\S]*?)<\/div>/gi, "$1")
    .replace(/<table[^>]*>/gi, "<table>")
    .replace(/<table>([\s\S]*?)<\/table>/gi, (_m, inner: string) => `<div class="post-table-wrap"><table class="post-table">${inner}</table></div>`)
    .replace(/<hr\s*\/?>/gi, "<hr>")
    .trim();
}
