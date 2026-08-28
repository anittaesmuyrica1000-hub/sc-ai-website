"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Update } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { badgeClass } from "./badge";

const stripHtml = (s?: string | null) => String(s || "").replace(/<[^>]+>/g, " ");

// 대문(index) — 블로그처럼 카드 리스트 + 찾기(검색). 모든 기기 열람 가능.
export default function UpdateIndex({ items, error }: { items: Update[]; error: boolean }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((u) =>
      [u.title, u.excerpt, u.category, stripHtml(u.content)]
        .filter(Boolean).join(" ").toLowerCase().includes(query)
    );
  }, [items, query]);

  return (
    <main className="upd-index">
      <div className="upd-index-head">
        <h1>업데이트 노트</h1>
        <p>슈퍼코더AI면접의 새로운 기능과 개선 사항을 가장 먼저 전해드립니다.</p>
        <div className={`upd-search${q ? " on" : ""}`}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setQ(""); }}
            placeholder="업데이트 제목·내용으로 찾기"
            aria-label="업데이트 검색"
          />
          {q && (
            <button type="button" className="upd-search-clear" aria-label="검색어 지우기" title="지우기 (ESC)" onClick={() => setQ("")}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="upd-state">업데이트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>
      ) : items.length === 0 ? (
        <div className="upd-state">아직 등록된 업데이트가 없습니다.</div>
      ) : filtered.length === 0 ? (
        <div className="upd-state">‘{q.trim()}’ 검색 결과가 없습니다.</div>
      ) : (
        <>
          {query && <div className="upd-index-count">‘{q.trim()}’ 검색 결과 {filtered.length}건</div>}
          <ol className="upd-index-list">
            {filtered.map((u) => (
              <li key={u.id} className="upd-index-item">
                <Link href={`/update/${u.slug || u.id}`} className="upd-index-card">
                  <time className="upd-index-date">{fmtDate(u.publish_date || u.created_at)}</time>
                  <div className="upd-index-body">
                    {u.category && <span className={`upd-badge ${badgeClass(u.category)}`}>{u.category}</span>}
                    <h2>{u.title}</h2>
                    {u.excerpt && <p className="upd-index-excerpt">{u.excerpt}</p>}
                    <span className="upd-index-more">자세히 보기 <i className="fa-solid fa-arrow-right"></i></span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
