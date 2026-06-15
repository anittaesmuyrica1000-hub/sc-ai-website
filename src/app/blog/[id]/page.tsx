import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Post, fmtDate } from "@/lib/types";
import "../blog.css";

export const revalidate = 60;

async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").eq("id", id).single();
  if (!data || (data as Post).published === false) return null;
  return data as Post;
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
    </main>
  );
}
