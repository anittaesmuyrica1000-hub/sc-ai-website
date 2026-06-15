import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { type Post } from "@/lib/types";
import BlogList from "./BlogList";
import NewsletterCTA from "./NewsletterCTA";
import "./blog.css";

export const metadata: Metadata = {
  title: "블로그",
  description: "AI 면접·채용 검증·HR 트렌드에 대한 인사이트를 전합니다.",
  alternates: { canonical: "/blog" },
};

// 60초 ISR — 새 글이 곧 반영되면서 서버 렌더(SEO)도 유지
export const revalidate = 60;

export default async function BlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const posts = (data ?? []) as Post[];

  return (
    <main>
      <section className="blog-head">
        <div className="wrap">
          <div className="eyebrow">
            <i className="fa-solid fa-pen-nib" /> AIVIEW BLOG
          </div>
          <h1>
            채용을 바꾸는
            <br />
            AI 면접 인사이트
          </h1>
          <p className="lead">
            AI 면접, 채용 검증, HR 트렌드까지 — 더 나은 채용을 위한 이야기를 전합니다.
          </p>
        </div>
      </section>

      <section className="blog-list">
        <div className="wrap">
          <BlogList posts={posts} />
        </div>
      </section>

      <NewsletterCTA />
    </main>
  );
}
