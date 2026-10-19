import type { MetadataRoute } from "next";
import { supabase, publishAtVisibleOr } from "@/lib/supabase";
import { EVENTS } from "@/lib/events";
import { EVENT_JOBS, JOB_DETAIL_EVENT } from "@/lib/eventApply";

// 동적 사이트맵 — 고정 페이지 + Supabase의 published 블로그 글을 자동 포함.
// /sitemap.xml 로 제공된다(기존 정적 public/sitemap.xml 대체). 글을 추가하면 자동 반영.
const SITE_URL = "https://www.supercoder.co";

export const revalidate = 600; // ISR 10분 캐시 — 어드민 저장 시 /api/revalidate 가 즉시 갱신. force-dynamic 은 봇 요청마다 서버 렌더가 돌아 Vercel 무료 CPU 한도를 넘겼다(2026-10-19)

type PostRow = { id: string; slug?: string | null; updated_at?: string | null; created_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/apply`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/brochure`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/event`, changeFrequency: "weekly", priority: 0.8 },
    ...EVENTS.map((e) => ({
      url: `${SITE_URL}/event/${e.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...EVENTS.filter((e) => e.slug === JOB_DETAIL_EVENT).flatMap((e) =>
      EVENT_JOBS.map((j) => ({
        url: `${SITE_URL}/event/${e.slug}/jobs/${j.v}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    ),
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
