import type { Metadata } from "next";
import Link from "next/link";
import "./update.css";
import { supabase, type Update } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { badgeClass } from "./badge";

export const dynamic = "force-dynamic";

// 비공개(링크 전용) — 검색 색인 금지.
export const metadata: Metadata = {
  title: "제품 업데이트 · AIVIEW",
  description: "AIVIEW 제품의 새로운 기능과 개선 사항 안내.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/update" },
};

// 대문(index) — 블로그처럼 전체 업데이트를 카드 리스트로. 모든 기기에서 열람·이동 가능.
export default async function UpdatePage() {
  let items: Update[] = [];
  let error = false;
  try {
    const res = await supabase
      .from("updates")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (res.error) throw res.error;
    items = (res.data as Update[]) || [];
  } catch (err) {
    console.error("updates load failed:", err);
    error = true;
  }

  return (
    <main className="upd-index">
      <header className="upd-index-head">
        <div className="upd-eyebrow"><i className="fa-solid fa-bullhorn"></i> 제품 업데이트</div>
        <h1>업데이트 노트</h1>
        <p>AIVIEW의 새로운 기능과 개선 사항을 가장 먼저 전해드립니다.</p>
      </header>

      {error ? (
        <div className="upd-state">업데이트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>
      ) : items.length === 0 ? (
        <div className="upd-state">아직 등록된 업데이트가 없습니다.</div>
      ) : (
        <ol className="upd-index-list">
          {items.map((u) => (
            <li key={u.id} className="upd-index-item">
              <Link href={`/update/${u.id}`} className="upd-index-card">
                <time className="upd-index-date">{fmtDate(u.created_at)}</time>
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
      )}
    </main>
  );
}
