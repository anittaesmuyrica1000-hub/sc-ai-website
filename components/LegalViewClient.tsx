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

  const hasHistory = versions.length > 0;
  const currentLabel = doc.effective_date || (doc.version ? `v${doc.version}` : "현재 버전");

  const title = sel ? sel.title : doc.title;
  const meta = sel ? sel.meta : doc.meta;
  const body = sel ? sel.body : doc.body;
  const effectiveDate = sel ? sel.effective_date : doc.effective_date;
  const versionNum = sel ? sel.version : doc.version;

  return (
    <>
      {/* 데스크톱 우측 고정 버전 패널 */}
      {hasHistory && (
        <div className="legal-ver-panel">
          <div className="legal-ver-head">개정 이력</div>
          <button className={`legal-ver-btn${!sel ? " active" : ""}`} onClick={() => setSel(null)}>
            <span className="legal-ver-dot" />
            {currentLabel}
          </button>
          {versions.map((v) => (
            <button key={v.id} className={`legal-ver-btn${sel?.id === v.id ? " active" : ""}`} onClick={() => setSel(v)}>
              <span className="legal-ver-dot" />
              {fmtEffective(v)}
            </button>
          ))}
        </div>
      )}

      <main className="legal">
        {sel && (
          <div className="legal-ver-banner">
            <i className="fa-solid fa-clock-rotate-left" />
            {fmtEffective(sel)} 시행 이전 버전
            <button className="lvb-back" onClick={() => setSel(null)}>최신 버전 보기 →</button>
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

          {/* 모바일 버전 선택기 */}
          {hasHistory && (
            <div className="legal-ver-mobile">
              <select
                value={sel?.id ?? "current"}
                onChange={(e) => {
                  const id = e.target.value;
                  setSel(id === "current" ? null : (versions.find((v) => v.id === id) ?? null));
                }}
              >
                <option value="current">현재 시행 버전 ({currentLabel})</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {fmtEffective(v)}{v.version ? ` (v${v.version})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div dangerouslySetInnerHTML={{ __html: renderBody(body) }} />
        <Link className="back-link" href="/">
          <i className="fa-solid fa-arrow-left" /> 홈으로 돌아가기
        </Link>
      </main>
    </>
  );
}
