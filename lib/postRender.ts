import { esc } from "./format";

// 간이 마크다운 렌더 — 기존 post.html 의 renderContent 포팅.
// esc 후 토큰만 치환하므로 XSS 안전. 결과는 dangerouslySetInnerHTML 로 출력.

function inline(s: string): string {
  let t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // 외부 링크(http/https)는 새 탭, 내부 상대경로(/apply 등)는 같은 탭으로 렌더
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, (_m, text, url) => {
    const external = /^https?:/.test(url);
    return external
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
      : `<a href="${url}">${text}</a>`;
  });
  return t;
}

function isTable(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const allPipe = lines.every((l) => l.trim().charAt(0) === "|");
  const sep = lines[1];
  return allPipe && sep.indexOf("-") >= 0 && /^[\s|:\-]+$/.test(sep);
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

// 목록 한 줄 파싱 — 들여쓰기(중첩 단계), 순서/비순서, 내용을 추출.
// 마커: 비순서 `- `/`* `, 순서 `1. `/`1) `. 들여쓰기는 공백/탭(탭=2칸 환산)으로 단계 구분.
type ListLine = { indent: number; ordered: boolean; num: number; content: string };
function parseListLine(line: string): ListLine | null {
  const m = line.match(/^([ \t]*)(?:([0-9]+)[.)]|[-*])[ \t]+(.*)$/);
  if (!m) return null;
  return { indent: m[1].replace(/\t/g, "  ").length, ordered: m[2] !== undefined, num: m[2] ? parseInt(m[2], 10) : 0, content: m[3] };
}

// 블록의 모든 줄이 목록 항목이면 true (중첩 목록 블록 판별)
function isList(lines: string[]): boolean {
  return lines.length > 0 && lines.every((l) => parseListLine(l) !== null);
}

// 들여쓰기 기반으로 중첩 <ol>/<ul> 생성. 같은 들여쓰기=형제, 더 깊으면 자식.
function renderList(lines: string[]): string {
  const items = lines.map((l) => parseListLine(l)!);
  let i = 0;
  function build(): string {
    const indent = items[i].indent;
    const ordered = items[i].ordered;
    const tag = ordered ? "ol" : "ul";
    // 순서목록이 1이 아닌 번호로 시작하면 start로 이어지는 번호 보존(표 등으로 끊긴 항목)
    const start = ordered && items[i].num > 1 ? ' start="' + items[i].num + '"' : "";
    let out = "";
    while (i < items.length && items[i].indent === indent) {
      let li = inline(items[i].content);
      i++;
      if (i < items.length && items[i].indent > indent) li += build(); // 자식 목록
      out += "<li>" + li + "</li>";
    }
    return '<' + tag + start + ' class="post-list">' + out + "</" + tag + ">";
  }
  return build();
}

export function renderContent(text: string | null | undefined): string {
  const blocks = String(text || "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (/^:::\s*요약/.test(block)) {
        const items = block
          .split("\n")
          .slice(1)
          .filter((l) => l.trim() && l.trim() !== ":::")
          .map((l) => "<li>" + inline(l.replace(/^[-*]\s*/, "")) + "</li>")
          .join("");
        return '<div class="post-tldr"><div class="tldr-head"><i class="fa-solid fa-bolt"></i> 핵심 요약</div><ul>' + items + "</ul></div>";
      }
      const img = block.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (img) {
        const cap = img[1] ? "<figcaption>" + inline(img[1]) + "</figcaption>" : "";
        return '<figure class="post-figure"><img src="' + esc(img[2]) + '" alt="' + esc(img[1]) + '" loading="lazy">' + cap + "</figure>";
      }
      if (/^###\s+/.test(block)) return "<h3>" + inline(block.replace(/^###\s+/, "")) + "</h3>";
      if (/^##\s+/.test(block)) return "<h2>" + inline(block.replace(/^##\s+/, "")) + "</h2>";
      if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(block)) return '<hr class="post-hr">';

      const lines = block.split("\n");

      if (isTable(lines)) {
        const head = splitRow(lines[0]).map((c) => "<th>" + inline(c) + "</th>").join("");
        const body = lines
          .slice(2)
          .map((r) => "<tr>" + splitRow(r).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>")
          .join("");
        return '<div class="post-table-wrap"><table class="post-table"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
      }
      if (isList(lines)) {
        return renderList(lines);
      }
      const isSrc = (txt: string) => /^출처[\s:：]/.test(txt.trim()) || txt.trim() === "출처";
      if (lines.every((l) => /^>\s?/.test(l))) {
        const inner = lines.map((l) => l.replace(/^>\s?/, "")).join("\n");
        // '출처' 인용구는 인용 스타일 대신 약한 출처 표기로
        if (isSrc(inner)) return '<p class="post-src">' + inline(inner).replace(/\n/g, "<br>") + "</p>";
        return "<blockquote>" + inline(inner) + "</blockquote>";
      }
      // '출처'로 시작하는 문단은 본문보다 약하게(투명도↓) 표시
      return '<p' + (isSrc(block) ? ' class="post-src"' : "") + ">" + inline(block).replace(/\n/g, "<br>") + "</p>";
    })
    .join("");
}
