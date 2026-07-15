import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./post.css";
import { supabase, type Post } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderBody } from "@/lib/postRender";
import ViewCounter from "@/components/ViewCounter";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PostNav = { slug: string | null; id: string; title: string } | null;

async function getAdjacentPosts(currentCreatedAt: string): Promise<{ prev: PostNav; next: PostNav }> {
  try {
    const [prevRes, nextRes] = await Promise.all([
      supabase.from("posts").select("id, slug, title").eq("published", true)
        .lt("created_at", currentCreatedAt).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("posts").select("id, slug, title").eq("published", true)
        .gt("created_at", currentCreatedAt).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);
    return { prev: prevRes.data ?? null, next: nextRes.data ?? null };
  } catch {
    return { prev: null, next: null };
  }
}

// slug 우선 조회 → 없으면 UUID(id)로 (기존 색인된 주소 호환). slug 컬럼 미존재(마이그레이션 전)면 id로 폴백.
async function getPost(key: string): Promise<Post | null> {
  try {
    let p: Post | null = null;
    const bySlug = await supabase.from("posts").select("*").eq("slug", key).maybeSingle();
    if (!bySlug.error && bySlug.data) p = bySlug.data as Post;
    if (!p && UUID_RE.test(key)) {
      const byId = await supabase.from("posts").select("*").eq("id", key).maybeSingle();
      if (!byId.error && byId.data) p = byId.data as Post;
    }
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
  const metaTitle = p.meta_title?.trim() || `${p.title} · 블로그`;
  const metaDesc = p.meta_description?.trim() || p.excerpt || undefined;
  const path = `/blog/${p.slug || p.id}`;
  return {
    title: metaTitle,
    description: metaDesc,
    keywords: tags.length ? tags : undefined,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: p.meta_title?.trim() || p.title,
      description: metaDesc,
      url: path,
      images: p.cover_url ? [{ url: p.cover_url }] : [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
      tags: tags.length ? tags : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) notFound();

  const { prev, next } = await getAdjacentPosts(p.created_at);

  return (
    <main>
      <ViewCounter id={p.id} />
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
        {p.cover_url && <img className="post-hero" src={p.cover_url} alt={p.cover_alt || p.title} />}
        <div className="post-content" data-slug={p.slug || undefined} dangerouslySetInnerHTML={{ __html: renderBody(p.content) }} />
        {Array.isArray(p.tags) && p.tags.length > 0 && (
          <ul className="post-tags" aria-label="주제 키워드">
            {p.tags.filter(Boolean).map((t) => (
              <li key={t} className="post-tag">#{t}</li>
            ))}
          </ul>
        )}
        {(prev || next) && (
          <div className="post-foot">
            {prev ? (
              <Link href={`/blog/${prev.slug || prev.id}`} className="btn btn-out post-nav-btn">
                <i className="fa-solid fa-arrow-left"></i> 이전 글
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/blog/${next.slug || next.id}`} className="btn btn-blue post-nav-btn">
                다음 글 <i className="fa-solid fa-arrow-right"></i>
              </Link>
            )}
          </div>
        )}
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
