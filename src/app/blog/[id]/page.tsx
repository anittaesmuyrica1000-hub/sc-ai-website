import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Post, fmtDate, readingTime } from "@/lib/types";
import NewsletterCTA from "../NewsletterCTA";
import "../blog.css";

export const revalidate = 60;

async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").eq("id", id).single();
  if (!data || (data as Post).published === false) return null;
  return data as Post;
}

async function getRelated(post: Post): Promise<Post[]> {
  const supabase = await createClient();
  let q = supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(3);
  if (post.category) q = q.eq("category", post.category);
  const { data } = await q;
  return (data ?? []) as Post[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "글을 찾을 수 없습니다" };
  const desc = post.excerpt || post.content.slice(0, 120);
  return {
    title: post.title,
    description: desc,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: desc,
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const related = await getRelated(post);
  const paragraphs = post.content.split(/\n{2,}/);

  return (
    <main>
      <article className="post-wrap">
        <Link href="/blog" className="post-back">
          <i className="fa-solid fa-arrow-left" /> 블로그 목록
        </Link>
        <div className="post-head">
          <span className="cat">{post.category || "기타"}</span>
          <h1>{post.title}</h1>
          <div className="post-meta">
            {post.author && (
              <span>
                <i className="fa-regular fa-user" /> {post.author}
              </span>
            )}
            <span>{fmtDate(post.created_at)}</span>
            <span><i className="fa-regular fa-clock" /> 읽는 시간 {readingTime(post.content)}분</span>
          </div>
        </div>

        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="post-hero" src={post.cover_url} alt="" />
        )}

        <div className="post-content">
          {paragraphs.map((para, i) => (
            <p key={i} style={{ whiteSpace: "pre-wrap" }}>
              {para}
            </p>
          ))}
        </div>

        <div className="post-foot">
          <Link href="/blog" className="btn btn-out">
            <i className="fa-solid fa-arrow-left" /> 목록으로
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="related">
          <h3>관련 글</h3>
          <div className="related-grid">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.id}`} className="related-card">
                {r.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="related-cover" src={r.cover_url} alt="" loading="lazy" />
                ) : (
                  <div className="related-cover ph"><i className="fa-solid fa-feather" /></div>
                )}
                <div className="related-body">
                  <span className="rc-cat">{r.category || "기타"}</span>
                  <h4>{r.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <NewsletterCTA />
    </main>
  );
}
