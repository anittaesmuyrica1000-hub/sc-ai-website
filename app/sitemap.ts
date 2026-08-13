import type { MetadataRoute } from "next";
import { supabase, publishAtVisibleOr } from "@/lib/supabase";

// 동적 사이트맵 — 고정 페이지 + Supabase의 published 블로그 글을 자동 포함.
// /sitemap.xml 로 제공된다(기존 정적 public/sitemap.xml 대체). 글을 추가하면 자동 반영.
const SITE_URL = "https://www.supercoder.co";

export const dynamic = "force-dynamic"; // 글 변경이 바로 반영되도록 요청 시 생성

type PostRow = { id: string; slug?: string | null; updated_at?: string | null; created_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/apply`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/brochure`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms-applicant`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let posts: MetadataRoute.Sitemap = [];
  try {
    const res = await supabase
      .from("posts")
      .select("id,slug,updated_at,created_at")
      .eq("published", true)
      .or(publishAtVisibleOr())
      .order("created_at", { ascending: false });
    if (!res.error && res.data) {
      posts = (res.data as PostRow[]).map((p) => ({
        url: `${SITE_URL}/blog/${p.slug || p.id}`,
        lastModified: p.updated_at || p.created_at || undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch {
    // DB 접근 불가 시 고정 경로만 반환(사이트맵이 비지 않도록)
  }

  return [...staticRoutes, ...posts];
}
