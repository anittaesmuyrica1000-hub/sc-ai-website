"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// 네이버 블로그식 WYSIWYG 편집기(보이는 대로). contentEditable + 서식 버튼 + 이미지 업로드.
// 결과는 HTML(innerHTML)로 onChange 전달 → 블로그/FAQ 본문에 저장. 약관은 마크다운(MarkdownEditor) 유지.
// 부모에서 항목별로 key를 주면 글 전환 시 remount되어 초기 HTML이 주입된다(편집 중 커서 튐 방지).
export type EditorTemplate = { label: string; html: string };

// 빈 본문 판별용 — 태그 제거 후 공백/줄바꿈만 남으면 빈 것으로 본다.
const stripText = (html: string) => String(html || "").replace(/<[^>]+>/g, "").replace(/[\s ]+/g, "").trim();

type Props = {
  value: string; // 초기 HTML
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  templates?: EditorTemplate[]; // 있으면 '템플릿' 드롭다운 노출(블로그 전용)
};

export default function RichEditor({ value, onChange, placeholder, minHeight = 380, templates }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    document.execCommand(command, false, val);
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
  // 표 만들기 — 행·열 수를 입력받아 블로그 표 마크업(post-table)으로 삽입.
  // 블로그 상세는 본문 HTML을 그대로 출력하므로 같은 클래스를 쓰면 라이브에서도 동일하게 스타일링된다.
  function insertTable() {
    const raw = window.prompt("표 크기를 '행,열' 로 입력하세요 (머리글 행 제외)", "2,3");
    if (!raw) return;
    const [r, c] = raw.split(/[,x×*\s]+/).map((n) => parseInt(n.trim(), 10));
    const rows = Math.min(Math.max(r || 0, 1), 30);
    const cols = Math.min(Math.max(c || 0, 1), 10);
    if (!rows || !cols) { alert("숫자로 '행,열'을 입력해 주세요. 예: 2,3"); return; }
    const head = "<tr>" + Array.from({ length: cols }, (_, i) => `<th>머리글 ${i + 1}</th>`).join("") + "</tr>";
    const body = Array.from({ length: rows }, () => "<tr>" + Array.from({ length: cols }, () => "<td>내용</td>").join("") + "</tr>").join("");
    const html = `<div class="post-table-wrap"><table class="post-table"><thead>${head}</thead><tbody>${body}</tbody></table></div><p><br></p>`;
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    emit();
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
  // 붙여넣기는 서식 없는 텍스트로(엉킨 HTML 방지)
  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
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

  return (
    <div className="rich">
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
        <span className="rich-sep" />
        <B on={() => exec("bold")} title="굵게"><b>B</b></B>
        <B on={() => exec("italic")} title="기울임"><i>I</i></B>
        <B on={() => exec("underline")} title="밑줄"><u>U</u></B>
        <span className="rich-sep" />
        <B on={() => exec("insertUnorderedList")} title="글머리 목록"><i className="fa-solid fa-list-ul" /></B>
        <B on={() => exec("insertOrderedList")} title="번호 목록"><i className="fa-solid fa-list-ol" /></B>
        <B on={toggleQuote} title="인용 (다시 누르면 해제)"><i className="fa-solid fa-quote-right" /></B>
        <B on={() => exec("insertHorizontalRule")} title="구분선"><i className="fa-solid fa-minus" /></B>
        <B on={insertTable} title="표 만들기"><i className="fa-solid fa-table" /></B>
        <span className="rich-sep" />
        <B on={addLink} title="링크"><i className="fa-solid fa-link" /></B>
        <button type="button" className="rich-btn" title="이미지 업로드" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-image" />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <span className="rich-sep" />
        <B on={clearFmt} title="서식 지우기"><i className="fa-solid fa-eraser" /></B>
      </div>
      <div
        ref={ref}
        className="rich-area post-content"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={onPaste}
        data-placeholder={placeholder || "내용을 입력하세요…"}
        style={{ minHeight }}
      />
    </div>
  );
}
