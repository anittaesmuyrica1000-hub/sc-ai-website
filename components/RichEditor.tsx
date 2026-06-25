"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// 네이버 블로그식 WYSIWYG 편집기(보이는 대로). contentEditable + 서식 버튼 + 이미지 업로드.
// 결과는 HTML(innerHTML)로 onChange 전달 → 블로그/FAQ 본문에 저장. 약관은 마크다운(MarkdownEditor) 유지.
// 부모에서 항목별로 key를 주면 글 전환 시 remount되어 초기 HTML이 주입된다(편집 중 커서 튐 방지).
type Props = {
  value: string; // 초기 HTML
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export default function RichEditor({ value, onChange, placeholder, minHeight = 380 }: Props) {
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
        <B on={() => exec("formatBlock", "blockquote")} title="인용"><i className="fa-solid fa-quote-right" /></B>
        <B on={() => exec("insertHorizontalRule")} title="구분선"><i className="fa-solid fa-minus" /></B>
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
