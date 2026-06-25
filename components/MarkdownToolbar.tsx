"use client";

import { RefObject } from "react";

// 마크다운 본문 편집용 삽입 툴바. textarea(ref)의 선택영역을 기준으로 마크다운 토큰을 넣는다.
// 렌더러(lib/postRender.ts)가 지원하는 문법만 노출: 제목 ##, 굵게 **, 목록 -, 번호 1., 들여쓰기, 인용 >, 링크, 표.
type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
};

type Result = { text: string; selStart: number; selEnd: number };

export default function MarkdownToolbar({ textareaRef, value, onChange }: Props) {
  function apply(fn: (before: string, sel: string, after: string) => Result) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart ?? value.length;
    const e = ta.selectionEnd ?? value.length;
    const { text, selStart, selEnd } = fn(value.slice(0, s), value.slice(s, e), value.slice(e));
    onChange(text);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  // 선택영역을 줄 단위로 확장해 각 줄을 변환
  function eachLine(map: (line: string, idx: number) => string) {
    apply((before, sel, after) => {
      const lineStart = before.lastIndexOf("\n") + 1;
      const head = before.slice(0, lineStart);
      const region = before.slice(lineStart) + sel;
      const block = region.split("\n").map(map).join("\n");
      return { text: head + block + after, selStart: head.length, selEnd: head.length + block.length };
    });
  }

  // 줄바꿈 삽입 — 커서 위치에 줄바꿈(렌더 시 <br>). 빈 줄(엔터 2번)은 문단 분리.
  function lineBreak() {
    apply((before, sel, after) => {
      const text = before + sel + "\n" + after;
      const pos = before.length + sel.length + 1;
      return { text, selStart: pos, selEnd: pos };
    });
  }

  function wrap(token: string, placeholder: string) {
    apply((before, sel, after) => {
      const body = sel || placeholder;
      const ins = token + body + token;
      return { text: before + ins + after, selStart: before.length + token.length, selEnd: before.length + token.length + body.length };
    });
  }

  function link() {
    apply((before, sel, after) => {
      const label = sel || "링크텍스트";
      const ins = `[${label}](https://)`;
      const urlStart = before.length + label.length + 3; // [label]( 다음
      return { text: before + ins + after, selStart: urlStart, selEnd: urlStart + "https://".length };
    });
  }

  function table() {
    apply((before, sel, after) => {
      const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const tbl = "| 제목1 | 제목2 |\n| --- | --- |\n| 내용 | 내용 |";
      const trail = after.startsWith("\n") ? "" : "\n";
      const ins = lead + tbl + trail;
      return { text: before + ins + after, selStart: before.length + lead.length, selEnd: before.length + lead.length + tbl.length };
    });
  }

  // 블록 단위 삽입(앞뒤 빈 줄 확보) — 구분선/핵심요약 등
  function insertBlock(content: string, selFrom = 0, selLen = content.length) {
    apply((before, sel, after) => {
      const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const trail = after.startsWith("\n") ? "" : "\n";
      const base = before.length + lead.length;
      return { text: before + lead + content + trail + after, selStart: base + selFrom, selEnd: base + selFrom + selLen };
    });
  }

  function image() {
    apply((before, sel, after) => {
      const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const trail = after.startsWith("\n") ? "" : "\n";
      const alt = sel || "이미지 설명";
      const urlStart = before.length + lead.length + alt.length + 4; // ![alt](
      return { text: before + lead + `![${alt}](이미지URL)` + trail + after, selStart: urlStart, selEnd: urlStart + "이미지URL".length };
    });
  }

  function callout() {
    const c = ":::요약\n- 핵심 내용\n:::";
    insertBlock(c, c.indexOf("핵심 내용"), "핵심 내용".length);
  }

  const B = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" className="md-btn" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );

  return (
    <div className="md-toolbar" role="toolbar" aria-label="마크다운 서식">
      <B title="제목 (##)" onClick={() => eachLine((l) => (l.startsWith("## ") && !l.startsWith("### ") ? l : "## " + l.replace(/^#+\s*/, "")))}>
        <span className="md-txt">제목</span>
      </B>
      <B title="소제목 (###)" onClick={() => eachLine((l) => (l.startsWith("### ") ? l : "### " + l.replace(/^#+\s*/, "")))}>
        <span className="md-txt md-txt-sm">소제목</span>
      </B>
      <span className="md-sep" />
      <B title="굵게 (**텍스트**)" onClick={() => wrap("**", "텍스트")}>
        <i className="fa-solid fa-bold" />
      </B>
      <B title="줄바꿈 (커서 위치에서 줄 바꿈)" onClick={lineBreak}>
        <span className="md-br" aria-hidden>↵</span>
      </B>
      <span className="md-sep" />
      <B title="글머리 목록 (-)" onClick={() => eachLine((l) => "- " + l.replace(/^(\s*)(?:[-*]|\d+[.)])\s+/, "$1"))}>
        <i className="fa-solid fa-list-ul" />
      </B>
      <B title="번호 목록 (1.)" onClick={() => eachLine((l, i) => `${i + 1}. ` + l.replace(/^(\s*)(?:[-*]|\d+[.)])\s+/, "$1"))}>
        <i className="fa-solid fa-list-ol" />
      </B>
      <B title="내어쓰기 (단계 줄임)" onClick={() => eachLine((l) => l.replace(/^ {1,2}/, ""))}>
        <i className="fa-solid fa-outdent" />
      </B>
      <B title="들여쓰기 (단계 늘림)" onClick={() => eachLine((l) => "  " + l)}>
        <i className="fa-solid fa-indent" />
      </B>
      <span className="md-sep" />
      <B title="인용 (>)" onClick={() => eachLine((l) => (l.startsWith("> ") ? l : "> " + l))}>
        <i className="fa-solid fa-quote-right" />
      </B>
      <B title="구분선 (---)" onClick={() => insertBlock("---")}>
        <i className="fa-solid fa-minus" />
      </B>
      <B title="핵심요약 박스" onClick={callout}>
        <i className="fa-solid fa-bolt" />
      </B>
      <span className="md-sep" />
      <B title="링크 삽입" onClick={link}>
        <i className="fa-solid fa-link" />
      </B>
      <B title="이미지 삽입" onClick={image}>
        <i className="fa-solid fa-image" />
      </B>
      <B title="표 삽입" onClick={table}>
        <i className="fa-solid fa-table-cells" />
      </B>
    </div>
  );
}
