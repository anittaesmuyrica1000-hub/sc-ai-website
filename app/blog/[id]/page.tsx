import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./post.css";
import { supabase, type Post } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderContent } from "@/lib/postRender";

export const dynamic = "force-dynamic";

async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await supabase.from("posts").select("*").eq("id", id).single();
    if (res.error) throw res.error;
    const p = res.data as Post;
    if (!p || p.published === false) return null;
    return p;
  } catch (err) {
    console.error("post load failed:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) return { title: "글을 찾을 수 없습니다" };
  return {
    title: `${p.title} · 블로그`,
    description: p.excerpt || undefined,
    openGraph: {
      type: "article",
      title: p.title,
      description: p.excerpt || undefined,
      images: p.cover_url ? [{ url: p.cover_url }] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) notFound();

  return (
    <main>
      <article className="post-wrap">
        <Link href="/blog" className="post-back"><i className="fa-solid fa-arrow-left"></i> 블로그 목록</Link>
        <div className="post-head">
          <span className="cat">{p.category || "기타"}</span>
          <h1>{p.title}</h1>
          <div className="post-meta">
            {p.author && <span><i className="fa-regular fa-user"></i> {p.author}</span>}
            <span>{fmtDate(p.created_at)}</span>
          </div>
        </div>
        {p.cover_url && <img className="post-hero" src={p.cover_url} alt="" />}
        <div className="post-content" dangerouslySetInnerHTML={{ __html: renderContent(p.content) }} />
        <div className="post-foot">
          <Link href="/blog" className="btn btn-out"><i className="fa-solid fa-arrow-left"></i> 목록으로</Link>
        </div>
      </article>
    </main>
  );
}
