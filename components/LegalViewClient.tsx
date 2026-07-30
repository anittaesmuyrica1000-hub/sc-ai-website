"use client";

import { useState } from "react";
import Link from "next/link";
import type { LegalDoc, LegalVersion } from "@/lib/supabase";
import { renderBody } from "@/lib/postRender";

function fmtEffective(v: LegalVersion): string {
  if (v.effective_date) return v.effective_date;
  try { return new Date(v.created_at!).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }); }
  catch { return `v${v.version}`; }
}

export default function LegalViewClient({ doc, versions }: { doc: LegalDoc; versions: LegalVersion[] }) {
  const [sel, setSel] = useState<LegalVersion | null>(null);
  const [open, setOpen] = useState(false);

  const hasHistory = versions.length > 0;
  const currentLabel = doc.effective_date || (doc.version ? `v${doc.version}` : "현재 버전");

  const title = sel ? sel.title : doc.title;
  const meta = sel ? sel.meta : doc.meta;
  const body = sel ? sel.body : doc.body;
  const effectiveDate = sel ? sel.effective_date : doc.effective_date;
  const versionNum = sel ? sel.version : doc.version;

  function pick(v: LegalVersion | null) {
    setSel(v);
    setOpen(false);
  }

  return (
    <>
      <main className={`legal${hasHistory ? " legal-has-verbar" : ""}`}>
        {sel && (
          <div className="legal-ver-banner">
            <i className="fa-solid fa-clock-rotate-left" />
            {fmtEffective(sel)} 시행 이전 버전
            <button className="lvb-back" onClick={() => pick(null)}>최신 버전 보기 →</button>
          </div>
        )}

        <div className="legal-head">
          <h1 dangerouslySetInnerHTML={{ __html: title }} />
          {meta && <p className="legal-meta">{meta}</p>}
          {(effectiveDate || versionNum) && (
            <p className="legal-version">
              {effectiveDate ? `시행일 ${effectiveDate}` : ""}
              {effectiveDate && versionNum ? " · " : ""}
              {versionNum ? `버전 v${versionNum}` : ""}
            </p>
          )}
        </div>

        <div dangerouslySetInnerHTML={{ __html: renderBody(body) }} />
        <Link className="back-link" href="/">
          <i className="fa-solid fa-arrow-left" /> 홈으로 돌아가기
        </Link>
      </main>

      {hasHistory && (
        <div className={`legal-ver-bar${open ? " open" : ""}`}>
          {open && (
            <div className="legal-ver-bar-list">
              <button className={`legal-ver-btn${!sel ? " active" : ""}`} onClick={() => pick(null)}>
                <span className="legal-ver-dot" />
                현재 시행 버전 ({currentLabel})
              </button>
              {versions.map((v) => (
                <button
                  key={v.id}
                  className={`legal-ver-btn${sel?.id === v.id ? " active" : ""}`}
                  onClick={() => pick(v)}
                >
                  <span className="legal-ver-dot" />
                  {fmtEffective(v)}{v.version ? ` (v${v.version})` : ""}
                </button>
              ))}
            </div>
          )}
          <button className="legal-ver-bar-toggle" onClick={() => setOpen(!open)}>
            <i className="fa-solid fa-clock-rotate-left" />
            <span className="lvb-label">개정 이력</span>
            <span className="lvb-cur">{sel ? `열람 중: ${fmtEffective(sel)}` : `현재: ${currentLabel}`}</span>
            <i className={`fa-solid fa-chevron-${open ? "down" : "up"}`} />
          </button>
        </div>
      )}
    </>
  );
}
