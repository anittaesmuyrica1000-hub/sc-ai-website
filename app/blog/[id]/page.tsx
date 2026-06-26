import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./post.css";
import { supabase, type Post } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderBody } from "@/lib/postRender";

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
  const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];
  return {
    title: `${p.title} · 블로그`,
    description: p.excerpt || undefined,
    keywords: tags.length ? tags : undefined,
    alternates: { canonical: `/blog/${id}` },
    openGraph: {
      type: "article",
      title: p.title,
      description: p.excerpt || undefined,
      images: p.cover_url ? [{ url: p.cover_url }] : undefined,
      tags: tags.length ? tags : undefined,
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
        <div className="post-content" dangerouslySetInnerHTML={{ __html: renderBody(p.content) }} />
        {Array.isArray(p.tags) && p.tags.length > 0 && (
          <ul className="post-tags" aria-label="주제 키워드">
            {p.tags.filter(Boolean).map((t) => (
              <li key={t} className="post-tag">#{t}</li>
            ))}
          </ul>
        )}
        <div className="post-foot">
          <Link href="/blog" className="btn btn-out"><i className="fa-solid fa-arrow-left"></i> 목록으로</Link>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: p.title,
            description: p.excerpt || undefined,
            image: p.cover_url || undefined,
            author: p.author ? { "@type": "Organization", name: p.author } : undefined,
            datePublished: p.created_at,
            dateModified: p.updated_at || p.created_at,
            keywords: Array.isArray(p.tags) && p.tags.length ? p.tags.join(", ") : undefined,
            articleSection: p.category || undefined,
          }),
        }}
      />
    </main>
  );
}
