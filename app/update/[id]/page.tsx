import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../update.css";
import { supabase, type Update } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderBody } from "@/lib/postRender";
import { badgeClass } from "../badge";

export const dynamic = "force-dynamic";

async function getUpdate(id: string): Promise<Update | null> {
  try {
    const res = await supabase.from("updates").select("*").eq("id", id).maybeSingle();
    if (res.error || !res.data) return null;
    const u = res.data as Update;
    if (u.published === false) return null;
    return u;
  } catch (err) {
    console.error("update load failed:", err);
    return null;
  }
}

// 비공개(링크 전용) — 검색 색인 금지.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const u = await getUpdate(id);
  if (!u) return { title: "업데이트를 찾을 수 없습니다", robots: { index: false, follow: false } };
  return {
    title: `${u.title} · 제품 업데이트`,
    description: u.excerpt || undefined,
    robots: { index: false, follow: false },
    alternates: { canonical: `/update/${u.id}` },
  };
}

export default async function UpdateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await getUpdate(id);
  if (!u) notFound();

  return (
    <main className="upd">
      <article className="upd-article">
        <Link href="/update" className="upd-back"><i className="fa-solid fa-arrow-left"></i> 업데이트 목록</Link>
        <div className="upd-article-head">
          {u.category && <span className={`upd-badge ${badgeClass(u.category)}`}>{u.category}</span>}
          <h1>{u.title}</h1>
          <time className="upd-date">{fmtDate(u.created_at)}</time>
        </div>
        <div className="upd-content" dangerouslySetInnerHTML={{ __html: renderBody(u.content) }} />
        <div className="upd-foot">
          <Link href="/update" className="btn btn-out"><i className="fa-solid fa-arrow-left"></i> 목록으로</Link>
        </div>
      </article>
    </main>
  );
}
