"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// 네이버 블로그식 WYSIWYG 편집기(보이는 대로). contentEditable + 서식 버튼 + 이미지 업로드.
// 결과는 HTML(innerHTML)로 onChange 전달 → 블로그/FAQ 본문에 저장. 약관은 마크다운(MarkdownEditor) 유지.
// 부모에서 항목별로 key를 주면 글 전환 시 remount되어 초기 HTML이 주입된다(편집 중 커서 튐 방지).
export type EditorTemplate = { label: string; html: string };

// 빈 본문 판별용 — 태그 제거 후 공백/줄바꿈만 남으면 빈 것으로 본다.
const stripText = (html: string) => String(html || "").replace(/<[^>]+>/g, "").replace(/[\s ]+/g, "").trim();

const MAX_ROWS = 30;
const MAX_COLS = 8;
const GRID = 8; // 격자 픽커 최대(8×8)
const FONT_SIZES = [
  { label: "아주 작게", px: "13px" },
  { label: "작게", px: "15px" },
  { label: "보통", px: "17px" },
  { label: "크게", px: "21px" },
  { label: "아주 크게", px: "26px" },
  { label: "제목 크기", px: "32px" },
];
// 글자색 / 형광펜 색 팔레트
const TEXT_COLORS = ["#1a2233", "#2e6cf0", "#1f59d6", "#e5484d", "#0f9d58", "#f5a623", "#8b5cf6", "#64748b", "#ffffff"];
const HILITE_COLORS = ["#fff3a3", "#cdebff", "#d6f5d6", "#ffd9dc", "#ece0ff", "#ffe2c2", "#e9edf3", "transparent"];

type Box = { top: number; left: number; width: number; height: number };

type Props = {
  value: string; // 초기 HTML
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  templates?: EditorTemplate[]; // 있으면 '템플릿' 드롭다운 노출(블로그 전용)
};

// 붙여넣기 HTML 정리 — 지원하는 서식 태그만 남기고(제목·굵게·목록·표·링크 등)
// 나머지 태그는 내용만 남겨 풀고(span/font 등), style·class 등 잡스러운 속성은 전부 제거한다.
const PASTE_ALLOWED = new Set([
  "H1", "H2", "H3", "H4", "P", "BR", "STRONG", "B", "EM", "I", "U", "S",
  "UL", "OL", "LI", "A", "BLOCKQUOTE", "HR", "PRE", "CODE",
  "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "FIGURE", "IMG", "FIGCAPTION",
]);
// 통짜 <pre> 붙여넣기 방어 — 문서 전체가 <pre> 하나면 서식 없이 텍스트만 복사해 온 것이므로
// 코드블록이 아니라 문단(<p>)으로 푼다. 그대로 두면 본문 전체가 monospace 한 덩어리가 되고,
// 제목·표 서식을 다시 잡을 수 없다(2026-08 업데이트 글 사례).
function unwrapWholePre(body: HTMLElement) {
  const kids = Array.from(body.childNodes).filter((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent || "").trim());
  if (kids.length !== 1) return;
  const el = kids[0] as HTMLElement;
  if (el.nodeType !== Node.ELEMENT_NODE || el.tagName !== "PRE") return;
  const paras = el.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!paras.length) return;
  el.replaceWith(
    ...paras.map((t) => {
      const p = body.ownerDocument.createElement("p");
      p.innerHTML = t.replace(/\n/g, "<br>");
      return p;
    })
  );
}

function sanitizePastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  body.querySelectorAll("script,style,meta,link,noscript").forEach((n) => n.remove());
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        walk(el);
        if (!PASTE_ALLOWED.has(el.tagName)) {
          el.replaceWith(...Array.from(el.childNodes)); // 태그는 벗기고 내용만 유지
        } else {
          Array.from(el.attributes).forEach((a) => {
            const keep =
              (el.tagName === "A" && a.name === "href") ||
              (el.tagName === "IMG" && (a.name === "src" || a.name === "alt"));
            if (!keep) el.removeAttribute(a.name);
          });
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    });
  };
  walk(body);
  unwrapWholePre(body);
  return body.innerHTML.trim();
}

export default function RichEditor({ value, onChange, placeholder, minHeight = 380, templates }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const [palette, setPalette] = useState<"fore" | "back" | null>(null);

  // 플로팅 툴바 대상/좌표
  const [tableEl, setTableEl] = useState<HTMLTableElement | null>(null);
  const [imgFig, setImgFig] = useState<HTMLElement | null>(null); // 선택된 이미지의 figure
  const [tablePos, setTablePos] = useState<Box | null>(null);
  const [imgPos, setImgPos] = useState<Box | null>(null);

  // 초기 1회만 주입(이후엔 사용자 입력이 출처)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }
  function exec(command: string, val?: string) {
    ref.current?.focus();
    try { document.execCommand("styleWithCSS", false, "true"); } catch { /* noop */ }
    document.execCommand(command, false, val);
    emit();
  }
  // 선택 영역을 inline style span으로 감싼다(글자 크기 등 execCommand가 없는 서식용).
  function wrapStyle(prop: "fontSize", value: string) {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;
    const span = document.createElement("span");
    span.style[prop] = value;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(span);
      sel.addRange(r);
    } catch { /* 복잡한 선택은 무시 */ }
    emit();
  }
  function onFontSize(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    e.target.selectedIndex = 0;
    if (v) wrapStyle("fontSize", v);
  }
  function onAlign(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    e.target.selectedIndex = 0;
    if (v) exec(v);
  }
  function applyColor(which: "fore" | "back", color: string) {
    exec(which === "fore" ? "foreColor" : "hiliteColor", color);
    setPalette(null);
  }
  // 동영상 임베드 — YouTube/Vimeo URL을 반응형 iframe으로 삽입.
  function insertVideo() {
    const url = window.prompt("동영상 주소를 붙여넣으세요 (YouTube · Vimeo)", "https://");
    if (!url) return;
    let src = "";
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (yt) src = `https://www.youtube.com/embed/${yt[1]}`;
    else if (vm) src = `https://player.vimeo.com/video/${vm[1]}`;
    else { alert("YouTube 또는 Vimeo 주소만 넣을 수 있습니다."); return; }
    const html = `<div class="post-video"><iframe src="${src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`;
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    emit();
  }
  function onBlockChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tag = e.target.value;
    exec("formatBlock", tag);
    e.target.selectedIndex = 0;
  }
  function addLink() {
    const url = window.prompt("링크 주소를 입력하세요", "https://");
    if (url) exec("createLink", url);
  }
  function clearFmt() {
    exec("removeFormat");
    exec("formatBlock", "p");
  }
  // 인용 토글 — 선택 영역이 이미 인용(blockquote) 안이면 본문(p)으로 되돌리고, 아니면 인용으로 감싼다.
  function toggleQuote() {
    ref.current?.focus();
    const sel = window.getSelection();
    let node: Node | null = sel?.anchorNode ?? null;
    let inQuote = false;
    while (node && node !== ref.current) {
      if (node.nodeType === 1 && (node as HTMLElement).tagName === "BLOCKQUOTE") { inQuote = true; break; }
      node = node.parentNode;
    }
    exec("formatBlock", inQuote ? "p" : "blockquote");
  }

  // ── 좌표 계산 ─────────────────────────────────────────────
  const boxOf = useCallback((el: HTMLElement): Box | null => {
    if (!wrapRef.current) return null;
    const w = wrapRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { top: r.top - w.top, left: r.left - w.left, width: r.width, height: r.height };
  }, []);

  // 활성 표/이미지 좌표 재계산(스크롤·리사이즈·내용변경 시)
  const reposition = useCallback(() => {
    setTablePos(tableEl ? boxOf(tableEl) : null);
    setImgPos(imgFig ? boxOf(imgFig) : null);
  }, [tableEl, imgFig, boxOf]);

  useEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    const onScrollResize = () => reposition();
    const area = ref.current;
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    area?.addEventListener("scroll", onScrollResize);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      area?.removeEventListener("scroll", onScrollResize);
    };
  }, [reposition]);

  // 표 안에 커서가 있는지 추적 → 표 편집 툴바 표시
  useEffect(() => {
    function onSelChange() {
      const root = ref.current;
      if (!root) return;
      const sel = window.getSelection();
      let node: Node | null = sel?.anchorNode ?? null;
      if (!node || !root.contains(node)) return; // 에디터 밖 선택은 무시(툴바 유지)
      let cell: HTMLTableCellElement | null = null;
      while (node && node !== root) {
        if (node.nodeType === 1) {
          const tag = (node as HTMLElement).tagName;
          if (tag === "TD" || tag === "TH") { cell = node as HTMLTableCellElement; break; }
        }
        node = node.parentNode;
      }
      cellRef.current = cell;
      setTableEl(cell ? cell.closest("table") : null);
    }
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, []);

  // 이미지 클릭 → 선택, 그 외 클릭 → 선택 해제
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      // 툴바 밖 클릭이면 열린 격자·팔레트 닫기
      if (!t.closest(".rich-toolbar")) { setGridOpen(false); setPalette(null); }
      if (t.closest(".rich-imgbar") || t.closest(".rich-handle")) return; // 툴바/핸들 클릭은 유지
      if (t.tagName === "IMG" && ref.current?.contains(t)) {
        setImgFig((t.closest("figure") as HTMLElement) || t);
      } else {
        setImgFig(null);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // ── 표 삽입(격자 픽커) ─────────────────────────────────────
  function insertTable(rows: number, cols: number) {
    const r = Math.min(Math.max(rows, 1), MAX_ROWS);
    const c = Math.min(Math.max(cols, 1), MAX_COLS);
    const head = "<tr>" + Array.from({ length: c }, (_, i) => `<th>머리글 ${i + 1}</th>`).join("") + "</tr>";
    const body = Array.from({ length: r }, () => "<tr>" + Array.from({ length: c }, () => "<td>내용</td>").join("") + "</tr>").join("");
    const html = `<div class="post-table-wrap"><table class="post-table"><thead>${head}</thead><tbody>${body}</tbody></table></div><p><br></p>`;
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    setGridOpen(false);
    emit();
  }

  // ── 표 편집 연산 ──────────────────────────────────────────
  function withCell(fn: (cell: HTMLTableCellElement, table: HTMLTableElement) => void) {
    const cell = cellRef.current;
    const table = tableEl;
    if (!cell || !table) return;
    fn(cell, table);
    emit();
    requestAnimationFrame(reposition);
  }
  function addRow(below: boolean) {
    withCell((cell, table) => {
      const tbody = table.tBodies[0];
      if (!tbody) return;
      if (tbody.rows.length >= MAX_ROWS) return;
      const cols = table.rows[0]?.cells.length || 1;
      const tr = document.createElement("tr");
      for (let i = 0; i < cols; i++) { const td = document.createElement("td"); td.textContent = "내용"; tr.appendChild(td); }
      const curRow = cell.closest("tr");
      const inHead = curRow?.parentElement?.tagName === "THEAD";
      if (inHead) tbody.insertBefore(tr, tbody.firstChild);
      else tbody.insertBefore(tr, below ? curRow!.nextSibling : curRow);
    });
  }
  function addCol(after: boolean) {
    withCell((cell, table) => {
      const cols = table.rows[0]?.cells.length || 0;
      if (cols >= MAX_COLS) return;
      const idx = cell.cellIndex;
      Array.from(table.rows).forEach((row) => {
        const inHead = row.parentElement?.tagName === "THEAD";
        const el = document.createElement(inHead ? "th" : "td");
        el.textContent = inHead ? "머리글" : "내용";
        const refCell = row.cells[after ? idx + 1 : idx] || null;
        row.insertBefore(el, refCell);
      });
    });
  }
  function delRow() {
    withCell((cell, table) => {
      const tbody = table.tBodies[0];
      const curRow = cell.closest("tr");
      if (!curRow) return;
      if (curRow.parentElement?.tagName === "THEAD") return; // 머리글 행은 삭제 불가
      if (tbody && tbody.rows.length <= 1) return; // 최소 1행 유지
      curRow.remove();
      cellRef.current = null;
    });
  }
  function delCol() {
    withCell((cell, table) => {
      const cols = table.rows[0]?.cells.length || 0;
      if (cols <= 1) return; // 최소 1열 유지
      const idx = cell.cellIndex;
      Array.from(table.rows).forEach((row) => { row.cells[idx]?.remove(); });
      cellRef.current = null;
    });
  }
  function delTable() {
    if (!tableEl) return;
    (tableEl.closest(".post-table-wrap") || tableEl).remove();
    setTableEl(null);
    cellRef.current = null;
    emit();
  }
  // 표 폭 — 래퍼(.post-table-wrap)에 인라인 width(%)를 지정. 100%는 스타일 제거(기본값 복원).
  // 사이트 post.css의 .post-table{width:100%}는 래퍼를 채우는 값이라 래퍼 폭만 줄이면 그대로 반영된다.
  function setTableWidth(pct: number) {
    if (!tableEl) return;
    const target = (tableEl.closest(".post-table-wrap") as HTMLElement | null) || tableEl;
    if (pct >= 100) target.removeAttribute("style");
    else target.setAttribute("style", `width:${pct}%`);
    emit();
    requestAnimationFrame(reposition);
  }
  function currentTableWidth(): number {
    if (!tableEl) return 100;
    const target = (tableEl.closest(".post-table-wrap") as HTMLElement | null) || tableEl;
    const m = (target.getAttribute("style") || "").match(/width:\s*(\d+)%/);
    return m ? Number(m[1]) : 100;
  }

  // ── 표 열 너비 드래그 조절 — 열 사이 세로 경계선을 잡고 좌우로 끌면 너비가 바뀐다 ──
  // 너비는 머리글(th)에 %로 기록되어 저장 HTML에 남고, 사이트(post.css)에서도 그대로 적용된다.
  const colDrag = useRef<{ table: HTMLTableElement; idx: number; startX: number; startW: number } | null>(null);
  const [colHover, setColHover] = useState(false);

  function colBoundaryAt(e: React.PointerEvent): { table: HTMLTableElement; idx: number } | null {
    const cell = (e.target as HTMLElement).closest?.("td,th") as HTMLTableCellElement | null;
    const table = cell?.closest("table");
    if (!cell || !table) return null;
    const row = cell.parentElement as HTMLTableRowElement;
    if (cell.cellIndex >= row.cells.length - 1) return null; // 마지막 열의 오른쪽 끝은 제외
    const r = cell.getBoundingClientRect();
    return r.right - e.clientX <= 6 && r.right - e.clientX >= -2 ? { table, idx: cell.cellIndex } : null;
  }
  function onAreaPointerMove(e: React.PointerEvent) {
    if (colDrag.current) return;
    setColHover(!!colBoundaryAt(e));
  }
  function onAreaPointerDown(e: React.PointerEvent) {
    const hit = colBoundaryAt(e);
    if (!hit) return;
    e.preventDefault(); // 경계선 드래그 중 커서 이동/텍스트 선택 방지
    const headCell = hit.table.rows[0]?.cells[hit.idx];
    if (!headCell) return;
    colDrag.current = { table: hit.table, idx: hit.idx, startX: e.clientX, startW: headCell.getBoundingClientRect().width };
    const move = (ev: PointerEvent) => {
      const d = colDrag.current;
      if (!d) return;
      const tw = d.table.getBoundingClientRect().width;
      if (!tw) return;
      const w = d.startW + (ev.clientX - d.startX);
      const pct = Math.max(8, Math.min(85, (w / tw) * 100));
      const th = d.table.rows[0]?.cells[d.idx];
      if (th) th.style.width = `${pct.toFixed(1)}%`;
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      colDrag.current = null;
      emit();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }
  // 열 너비 초기화 — 기록된 width를 지워 균등 분배로 복원
  function resetColWidths() {
    if (!tableEl) return;
    Array.from(tableEl.rows).forEach((r) => Array.from(r.cells).forEach((c) => c.style.removeProperty("width")));
    emit();
  }

  // ── 이미지 크기/정렬 ──────────────────────────────────────
  function applyImgStyle(fig: HTMLElement) {
    const width = fig.dataset.width; // '40' 등(%) — 없으면 100%
    const align = fig.dataset.align || "center";
    let s = "";
    if (width) s += `width:${width}%;`;
    if (align === "left") s += "margin-right:auto;margin-left:0;";
    else if (align === "right") s += "margin-left:auto;margin-right:0;";
    else s += "margin-left:auto;margin-right:auto;"; // center
    fig.setAttribute("style", s);
  }
  function setImgWidth(pct: number) {
    if (!imgFig) return;
    imgFig.dataset.width = String(Math.max(15, Math.min(100, Math.round(pct))));
    applyImgStyle(imgFig);
    emit();
    requestAnimationFrame(reposition);
  }
  function setImgAlign(align: "left" | "center" | "right") {
    if (!imgFig) return;
    imgFig.dataset.align = align;
    applyImgStyle(imgFig);
    emit();
    requestAnimationFrame(reposition);
  }
  function delImg() {
    if (!imgFig) return;
    imgFig.remove();
    setImgFig(null);
    emit();
  }
  // 모서리 드래그로 자유 리사이즈
  function onHandleDown(e: React.PointerEvent) {
    e.preventDefault();
    if (!imgFig || !ref.current) return;
    const fig = imgFig;
    const cs = getComputedStyle(ref.current);
    const areaW = ref.current.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const startX = e.clientX;
    const startW = fig.getBoundingClientRect().width;
    const move = (ev: PointerEvent) => {
      const w = startW + (ev.clientX - startX);
      setImgWidth((w / areaW) * 100);
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      emit();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  // 템플릿 — 선택한 글 구조(HTML)를 본문에 채워 넣는다. 내용이 있으면 덮어쓸지 확인.
  function applyTemplate(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = e.target.selectedIndex - 1;
    e.target.selectedIndex = 0;
    const tpl = templates?.[idx];
    if (!tpl || !ref.current) return;
    const hasContent = stripText(ref.current.innerHTML).length > 0;
    if (hasContent && !window.confirm("현재 본문을 템플릿 내용으로 바꿀까요? 기존 내용은 사라집니다.")) return;
    ref.current.innerHTML = tpl.html;
    ref.current.focus();
    emit();
  }
  // 붙여넣기: 서식(HTML)을 유지하되 지원 태그만 남기고 정리(sanitize). HTML이 없으면 순수 텍스트.
  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const rawHtml = e.clipboardData.getData("text/html");
    const clean = rawHtml ? sanitizePastedHtml(rawHtml) : "";
    if (clean) {
      document.execCommand("insertHTML", false, clean);
    } else {
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }
    emit();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("이미지 파일만 업로드할 수 있습니다."); e.target.value = ""; return; }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `inline/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const up = await supabase.storage.from("blog-covers").upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("blog-covers").getPublicUrl(path);
      ref.current?.focus();
      document.execCommand("insertHTML", false, `<figure class="post-figure"><img src="${data.publicUrl}" alt=""></figure><p><br></p>`);
      emit();
    } catch (err) {
      console.error("inline image upload failed:", err);
      alert("이미지 업로드에 실패했습니다. 관리자 권한/스토리지 설정을 확인해 주세요.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const B = ({ on, title, children }: { on: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" className="rich-btn" title={title} onMouseDown={(e) => e.preventDefault()} onClick={on}>
      {children}
    </button>
  );

  const curWidth = imgFig?.dataset.width ? parseInt(imgFig.dataset.width, 10) : 100;
  const curAlign = imgFig?.dataset.align || "center";

  return (
    <div className="rich" ref={wrapRef}>
      <div className="rich-toolbar" role="toolbar" aria-label="서식">
        {templates && templates.length > 0 && (
          <>
            <select className="rich-block rich-tpl" onChange={applyTemplate} title="글 템플릿" defaultValue="">
              <option value="" disabled>📄 템플릿</option>
              {templates.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
            </select>
            <span className="rich-sep" />
          </>
        )}
        <select className="rich-block" onChange={onBlockChange} title="문단 스타일" defaultValue="">
          <option value="" disabled>스타일</option>
          <option value="p">본문</option>
          <option value="h2">제목</option>
          <option value="h3">소제목</option>
        </select>
        <select className="rich-block" onChange={onFontSize} title="글자 크기" defaultValue="">
          <option value="" disabled>크기</option>
          {FONT_SIZES.map((f) => <option key={f.px} value={f.px}>{f.label}</option>)}
        </select>
        <span className="rich-sep" />
        <B on={() => exec("bold")} title="굵게"><b>B</b></B>
        <B on={() => exec("italic")} title="기울임"><i>I</i></B>
        <B on={() => exec("underline")} title="밑줄"><u>U</u></B>
        <span className="rich-sep" />
        <div className="rich-grid-wrap">
          <button type="button" className={"rich-btn rich-color-btn" + (palette === "fore" ? " is-on" : "")} title="글자색"
            onMouseDown={(e) => e.preventDefault()} onClick={() => setPalette((p) => (p === "fore" ? null : "fore"))}>
            <span className="rich-color-A">가</span><i className="fa-solid fa-caret-down rich-caret" />
          </button>
          {palette === "fore" && (
            <div className="rich-palette">
              {TEXT_COLORS.map((c) => (
                <button key={c} type="button" className="rich-swatch" style={{ background: c }} title={c}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor("fore", c)} />
              ))}
            </div>
          )}
        </div>
        <div className="rich-grid-wrap">
          <button type="button" className={"rich-btn rich-color-btn" + (palette === "back" ? " is-on" : "")} title="형광펜"
            onMouseDown={(e) => e.preventDefault()} onClick={() => setPalette((p) => (p === "back" ? null : "back"))}>
            <span className="rich-color-A rich-hl">가</span><i className="fa-solid fa-caret-down rich-caret" />
          </button>
          {palette === "back" && (
            <div className="rich-palette">
              {HILITE_COLORS.map((c) => (
                <button key={c} type="button" className={"rich-swatch" + (c === "transparent" ? " rich-swatch-none" : "")} style={{ background: c }} title={c === "transparent" ? "없음" : c}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor("back", c)} />
              ))}
            </div>
          )}
        </div>
        <span className="rich-sep" />
        <select className="rich-block" onChange={onAlign} title="정렬" defaultValue="">
          <option value="" disabled>정렬</option>
          <option value="justifyLeft">왼쪽</option>
          <option value="justifyCenter">가운데</option>
          <option value="justifyRight">오른쪽</option>
          <option value="justifyFull">양쪽</option>
        </select>
        <B on={() => exec("insertUnorderedList")} title="글머리 목록"><i className="fa-solid fa-list-ul" /></B>
        <B on={() => exec("insertOrderedList")} title="번호 목록"><i className="fa-solid fa-list-ol" /></B>
        <B on={() => exec("indent")} title="들여쓰기"><i className="fa-solid fa-indent" /></B>
        <B on={() => exec("outdent")} title="내어쓰기"><i className="fa-solid fa-outdent" /></B>
        <span className="rich-sep" />
        <B on={toggleQuote} title="인용 (다시 누르면 해제)"><i className="fa-solid fa-quote-right" /></B>
        <B on={() => exec("insertHorizontalRule")} title="구분선"><i className="fa-solid fa-minus" /></B>
        <div className="rich-grid-wrap">
          <button type="button" className={"rich-btn" + (gridOpen ? " is-on" : "")} title="표 만들기"
            onMouseDown={(e) => e.preventDefault()} onClick={() => setGridOpen((v) => !v)}>
            <i className="fa-solid fa-table" />
          </button>
          {gridOpen && (
            <div className="rich-grid" onMouseLeave={() => setHover({ r: 0, c: 0 })}>
              <div className="rich-grid-cells">
                {Array.from({ length: GRID }, (_, ri) =>
                  Array.from({ length: GRID }, (_, ci) => (
                    <span key={`${ri}-${ci}`}
                      className={"rich-grid-cell" + (ri < hover.r && ci < hover.c ? " on" : "")}
                      onMouseEnter={() => setHover({ r: ri + 1, c: ci + 1 })}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertTable(hover.r, hover.c)} />
                  ))
                )}
              </div>
              <div className="rich-grid-label">{hover.r > 0 ? `${hover.r} × ${hover.c} 표` : "크기를 선택하세요"}</div>
            </div>
          )}
        </div>
        <span className="rich-sep" />
        <B on={addLink} title="링크"><i className="fa-solid fa-link" /></B>
        <button type="button" className="rich-btn" title="이미지 업로드" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-image" />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <B on={insertVideo} title="동영상 (YouTube · Vimeo)"><i className="fa-solid fa-film" /></B>
        <span className="rich-sep" />
        <B on={clearFmt} title="서식 지우기"><i className="fa-solid fa-eraser" /></B>
      </div>

      <div
        ref={ref}
        className={"rich-area post-content" + (colHover ? " rich-colresize" : "")}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        onPointerMove={onAreaPointerMove}
        onPointerDown={onAreaPointerDown}
        data-placeholder={placeholder || "내용을 입력하세요…"}
        style={{ minHeight }}
      />

      {/* 표 편집 플로팅 툴바 — 표 안에 커서가 있을 때 */}
      {tableEl && tablePos && (
        <div className="rich-tablebar" style={{ top: Math.max(2, tablePos.top - 40), left: tablePos.left }}
          onMouseDown={(e) => e.preventDefault()}>
          <button type="button" title="위에 행 추가" onClick={() => addRow(false)}><i className="fa-solid fa-arrow-up" /><i className="fa-solid fa-plus rich-mini" /></button>
          <button type="button" title="아래에 행 추가" onClick={() => addRow(true)}><i className="fa-solid fa-arrow-down" /><i className="fa-solid fa-plus rich-mini" /></button>
          <span className="rich-bar-sep" />
          <button type="button" title="왼쪽에 열 추가" onClick={() => addCol(false)}><i className="fa-solid fa-arrow-left" /><i className="fa-solid fa-plus rich-mini" /></button>
          <button type="button" title="오른쪽에 열 추가" onClick={() => addCol(true)}><i className="fa-solid fa-arrow-right" /><i className="fa-solid fa-plus rich-mini" /></button>
          <span className="rich-bar-sep" />
          <button type="button" title="행 삭제" onClick={delRow}>행<i className="fa-solid fa-minus rich-mini" /></button>
          <button type="button" title="열 삭제" onClick={delCol}>열<i className="fa-solid fa-minus rich-mini" /></button>
          <span className="rich-bar-sep" />
          {[50, 70, 100].map((pct) => (
            <button key={pct} type="button" title={`표 폭 ${pct}%`}
              className={currentTableWidth() === pct ? "is-on" : undefined}
              onClick={() => setTableWidth(pct)}>{pct}%</button>
          ))}
          <button type="button" title="열 너비 초기화 — 드래그로 조절한 열 너비를 균등 분배로 되돌립니다" onClick={resetColWidths}><i className="fa-solid fa-table-columns" /><i className="fa-solid fa-rotate-left rich-mini" /></button>
          <span className="rich-bar-sep" />
          <button type="button" className="rich-bar-del" title="표 삭제" onClick={delTable}><i className="fa-solid fa-trash" /></button>
        </div>
      )}

      {/* 이미지 크기/정렬 플로팅 툴바 + 리사이즈 핸들 */}
      {imgFig && imgPos && (
        <>
          <div className="rich-imgbar" style={{ top: Math.max(2, imgPos.top - 44), left: imgPos.left }}>
            <button type="button" className={curWidth <= 45 ? "is-on" : ""} title="작게" onClick={() => setImgWidth(40)}>작게</button>
            <button type="button" className={curWidth > 45 && curWidth < 95 ? "is-on" : ""} title="보통" onClick={() => setImgWidth(70)}>보통</button>
            <button type="button" className={curWidth >= 95 ? "is-on" : ""} title="크게" onClick={() => setImgWidth(100)}>크게</button>
            <span className="rich-bar-sep" />
            <input type="range" min={15} max={100} value={curWidth} title="크기 조절"
              onChange={(e) => setImgWidth(parseInt(e.target.value, 10))} />
            <span className="rich-imgbar-pct">{curWidth}%</span>
            <span className="rich-bar-sep" />
            <button type="button" className={curAlign === "left" ? "is-on" : ""} title="왼쪽 정렬" onClick={() => setImgAlign("left")}><i className="fa-solid fa-align-left" /></button>
            <button type="button" className={curAlign === "center" ? "is-on" : ""} title="가운데 정렬" onClick={() => setImgAlign("center")}><i className="fa-solid fa-align-center" /></button>
            <button type="button" className={curAlign === "right" ? "is-on" : ""} title="오른쪽 정렬" onClick={() => setImgAlign("right")}><i className="fa-solid fa-align-right" /></button>
            <span className="rich-bar-sep" />
            <button type="button" className="rich-bar-del" title="이미지 삭제" onClick={delImg}><i className="fa-solid fa-trash" /></button>
          </div>
          <div className="rich-imgsel" style={{ top: imgPos.top, left: imgPos.left, width: imgPos.width, height: imgPos.height }} />
          <div className="rich-handle" title="드래그하여 크기 조절"
            style={{ top: imgPos.top + imgPos.height - 7, left: imgPos.left + imgPos.width - 7 }}
            onPointerDown={onHandleDown} />
        </>
      )}
    </div>
  );
}
