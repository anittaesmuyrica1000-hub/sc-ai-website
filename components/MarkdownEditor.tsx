"use client";

import { useRef, useState } from "react";
import { renderContent } from "@/lib/postRender";
import MarkdownToolbar from "./MarkdownToolbar";

// 마크다운 본문 편집기 — 라벨 + 서식 툴바 + textarea + 실시간 미리보기(좌우 분할).
// 블로그·약관 등에서 공용으로 재사용. value/onChange로 폼 상태와 연결.
type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  minHeight?: number;
  hint?: React.ReactNode;
};

export default function MarkdownEditor({ id, label, value, onChange, required, placeholder, minHeight = 360, hint }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  return (
    <div className="field">
      <div className="md-ed-labelrow">
        <label htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
        <button type="button" className="md-preview-toggle" onClick={() => setPreview((p) => !p)}>
          <i className={`fa-solid ${preview ? "fa-pen" : "fa-eye"}`} /> {preview ? "미리보기 끄기" : "미리보기 켜기"}
        </button>
      </div>
      <div className={preview ? "md-edit-split" : undefined}>
        <div className="md-edit-pane">
          <MarkdownToolbar textareaRef={ref} value={value} onChange={onChange} />
          <textarea
            ref={ref}
            id={id}
            style={{ minHeight, fontSize: 14, lineHeight: 1.7 }}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        {preview && (
          <div className="md-preview" aria-label="미리보기">
            <div className="md-preview-label">미리보기 (실제 페이지 렌더)</div>
            <div className="md-preview-body" dangerouslySetInnerHTML={{ __html: renderContent(value) }} />
          </div>
        )}
      </div>
      {hint && <span className="cf-note">{hint}</span>}
    </div>
  );
}
