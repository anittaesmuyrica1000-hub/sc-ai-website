import { supabase } from "@/lib/supabase";

// 블로그 RSS 2.0 피드 — published 글 최신 50개. 네이버 서치어드바이저 RSS 제출·구독기 발견용.
// /blog/rss.xml 로 제공.
const SITE_URL = "https://sc-ai-website.vercel.app";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function GET() {
  let posts: Row[] = [];
  try {
    const res = await supabase
      .from("posts")
      .select("id,title,excerpt,category,created_at,updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!res.error && res.data) posts = res.data as Row[];
  } catch {
    // DB 접근 불가 시 빈 채널 반환
  }

  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.id}`;
      const date = new Date(p.created_at);
      const pubDate = isNaN(date.getTime()) ? "" : date.toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>${p.category ? `\n      <category>${esc(p.category)}</category>` : ""}${p.excerpt ? `\n      <description>${esc(p.excerpt)}</description>` : ""}${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI면접 블로그</title>
    <link>${SITE_URL}/blog</link>
    <description>AI 면접·채용 검증·HR 트렌드에 대한 인사이트</description>
    <language>ko-KR</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
