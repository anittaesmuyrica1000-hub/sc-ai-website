import React from "react";

/* 블로그 본문 렌더러 — 빈 줄로 블록을 나누고 간단한 마크다운 일부를 지원한다.
 *  ## 소제목 / ### 작은 소제목
 *  ![설명](이미지URL)  → 인라인 이미지(설명은 캡션)
 *  > 인용문
 *  - 목록 항목
 *  그 외는 문단(<p>), 문단 내 줄바꿈은 유지. 텍스트는 JSX가 자동 이스케이프. */
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
              {alt && <figcaption>{alt}</figcaption>}
            </figure>
          );
        }
        if (/^###\s+/.test(block)) return <h3 key={i}>{block.replace(/^###\s+/, "")}</h3>;
        if (/^##\s+/.test(block)) return <h2 key={i}>{block.replace(/^##\s+/, "")}</h2>;

        const lines = block.split("\n");
        if (lines.every((l) => /^[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="post-list">
              {lines.map((l, j) => <li key={j}>{l.replace(/^[-*]\s+/, "")}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^>\s?/.test(l))) {
          return <blockquote key={i}>{lines.map((l) => l.replace(/^>\s?/, "")).join("\n")}</blockquote>;
        }
        return <p key={i} style={{ whiteSpace: "pre-wrap" }}>{block}</p>;
      })}
    </div>
  );
}
