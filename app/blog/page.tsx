import type { Metadata } from "next";
import "./blog.css";
import { supabase, type Post } from "@/lib/supabase";
import BlogClient from "./BlogClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "블로그 · AI 면접 채용 인사이트",
  description: "AIVIEW 블로그 — AI 면접·채용 검증·HR 트렌드에 대한 인사이트를 전합니다.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "블로그 · AIVIEW | AI 면접 채용 인사이트",
    description: "AI 면접·채용 검증·HR 트렌드에 대한 인사이트를 전합니다.",
    url: "/blog",
  },
};

export default async function BlogPage() {
  let posts: Post[] = [];
  let error = false;
  try {
    const res = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (res.error) throw res.error;
    posts = (res.data as Post[]) || [];
  } catch (err) {
    console.error("posts load failed:", err);
    error = true;
  }

  return <BlogClient posts={posts} error={error} />;
}
