"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LegalDoc, LegalVersion } from "@/lib/supabase";
import { renderBody } from "@/lib/postRender";

function fmtEffective(v: LegalVersion): string {
  if (v.effective_date) return v.effective_date;
  try { return new Date(v.created_at!).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }); }
  catch { return `v${v.version}`; }
}

interface Props {
  doc: LegalDoc;
  versions: LegalVersion[];
  selectedVersion?: LegalVersion; // URL 모드: 현재 표시 중인 과거 버전
  basePath?: string;              // URL 모드 활성화 (예: "/privacy")
}

export default function LegalViewClient({ doc, versions, selectedVersion, basePath }: Props) {
  const [sel, setSel] = useState<LegalVersion | null>(null); // 레거시 모드 상태
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isUrlMode = !!basePath;

  // 외부 클릭 시 피커 닫기
  useEffect(() => {
    if (!pickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pickerOpen]);

  const historyVersions = versions.filter((v) => v.version !== doc.version);
  const hasHistory = historyVersions.length > 0;

  // URL 모드: selectedVersion prop / 레거시 모드: sel 상태
  const activeVersion = isUrlMode ? selectedVersion : sel;

  const title = activeVersion ? activeVersion.title : doc.title;
  const meta = activeVersion ? activeVersion.meta : doc.meta;
  const body = activeVersion ? activeVersion.body : doc.body;
  const effectiveDate = activeVersion ? activeVersion.effective_date : doc.effective_date;
  const versionNum = activeVersion ? activeVersion.version : doc.version;

  const latestLabel = `최신 버전${doc.effective_date ? ` · ${doc.effective_date}` : doc.version ? ` (v${doc.version})` : ""}`;
  const triggerDate = activeVersion
    ? fmtEffective(activeVersion)
    : (doc.effective_date || (doc.version ? `v${doc.version}` : ""));

  return (
    <main className="legal">
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
          {isUrlMode ? (
            <div className="legal-ver-picker" ref={pickerRef}>
              {pickerOpen && (
                <ul className="legal-ver-list">
                  <li>
                    <Link
                      href={doc.effective_date ? `${basePath}/${doc.effective_date}` : basePath}
                      className={!selectedVersion ? "active" : ""}
                      onClick={() => setPickerOpen(false)}
                    >
                      {doc.effective_date || `v${doc.version}`}
                    </Link>
                  </li>
                  {historyVersions.map((v) => (
                    <li key={v.id}>
                      <Link
                        href={v.effective_date ? `${basePath}/${v.effective_date}` : basePath}
                        className={selectedVersion?.id === v.id ? "active" : ""}
                        onClick={() => setPickerOpen(false)}
                      >
                        {fmtEffective(v)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button
                className="legal-ver-trigger"
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}
              >
                <i className={`fa-solid fa-chevron-${pickerOpen ? "up" : "down"}`} />
                <span>{triggerDate}</span>
              </button>
            </div>
          ) : (
            <select
              className="legal-ver-select"
              value={sel?.id ?? "current"}
              onChange={(e) => {
                const id = e.target.value;
                setSel(id === "current" ? null : (historyVersions.find((v) => v.id === id) ?? null));
              }}
            >
              <option value="current">{latestLabel}</option>
              {historyVersions.map((v) => (
                <option key={v.id} value={v.id}>{fmtEffective(v)}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <Link className="back-link" href="/">
        <i className="fa-solid fa-arrow-left" /> 홈으로 돌아가기
      </Link>
    </main>
  );
}
