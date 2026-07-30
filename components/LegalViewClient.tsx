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
      </div>

      <div dangerouslySetInnerHTML={{ __html: renderBody(body) }} />

      {hasHistory && (
        <div className="legal-ver-foot">
          <select
            className="legal-ver-select"
            value={sel?.id ?? "current"}
            onChange={(e) => {
              const id = e.target.value;
              setSel(id === "current" ? null : (versions.find((v) => v.id === id) ?? null));
            }}
          >
            <option value="current">{currentLabel}</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{fmtEffective(v)}</option>
            ))}
          </select>
        </div>
      )}

      <Link className="back-link" href="/">
        <i className="fa-solid fa-arrow-left" /> 홈으로 돌아가기
      </Link>
    </main>
  );
}
