import React from "react";

/* 블로그 본문 렌더러 — 빈 줄로 블록을 나누고 간단한 마크다운 일부를 지원한다.
 *  ## 소제목 / ### 작은 소제목
 *  ![설명](이미지URL)  → 인라인 이미지(설명은 캡션)
 *  > 인용문
 *  - 목록 항목
 *  | 표 | 헤더 |  → 마크다운 파이프 표(두 번째 줄이 ---  구분선)
 *  인라인: **굵게**, [링크](url)  → 수치 강조·출처 링크에 사용
 *  그 외는 문단(<p>), 문단 내 줄바꿈은 유지. 텍스트는 JSX가 자동 이스케이프. */

// 인라인 마크다운(**굵게**, [텍스트](url))을 React 노드로 변환
function renderInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  // **bold** 또는 [text](url) 을 토큰 단위로 분해
  const re = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      nodes.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[3]) {
      const href = m[5];
      const external = /^https?:\/\//.test(href);
      nodes.push(
        <a
          key={key++}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {m[4]}
        </a>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isTable(lines: string[]): boolean {
  return (
    lines.length >= 2 &&
    lines.every((l) => l.trim().startsWith("|")) &&
    /^\|?[\s:|-]+\|?$/.test(lines[1].replace(/[^|:\-\s]/g, "")) &&
    /-/.test(lines[1])
  );
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function PostBody({ content }: { content: string }) {
  const blocks = (content || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="post-content">
      {blocks.map((block, i) => {
        const img = block.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (img) {
          const [, alt, src] = img;
          return (
            <figure key={i} className="post-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} loading="lazy" />
              {alt && <figcaption>{renderInline(alt)}</figcaption>}
            </figure>
          );
        }
        if (/^###\s+/.test(block)) return <h3 key={i}>{renderInline(block.replace(/^###\s+/, ""))}</h3>;
        if (/^##\s+/.test(block)) return <h2 key={i}>{renderInline(block.replace(/^##\s+/, ""))}</h2>;

        const lines = block.split("\n");

        if (isTable(lines)) {
          const head = splitRow(lines[0]);
          const rows = lines.slice(2).map(splitRow);
          return (
            <div key={i} className="post-table-wrap">
              <table className="post-table">
                <thead>
                  <tr>{head.map((c, j) => <th key={j}>{renderInline(c)}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r, j) => (
                    <tr key={j}>{r.map((c, k) => <td key={k}>{renderInline(c)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (lines.every((l) => /^[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="post-list">
              {lines.map((l, j) => <li key={j}>{renderInline(l.replace(/^[-*]\s+/, ""))}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^>\s?/.test(l))) {
          return (
            <blockquote key={i}>
              {renderInline(lines.map((l) => l.replace(/^>\s?/, "")).join("\n"))}
            </blockquote>
          );
        }
        return (
          <p key={i} style={{ whiteSpace: "pre-wrap" }}>
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
