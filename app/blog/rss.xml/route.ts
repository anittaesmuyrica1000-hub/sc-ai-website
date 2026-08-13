import { supabase, publishAtVisibleOr } from "@/lib/supabase";
import { renderBody } from "@/lib/postRender";

// 블로그 RSS 2.0 피드 — published 글 최신 50개. 네이버 서치어드바이저 RSS 제출·구독기 발견용.
// 네이버 권장: 대표 이미지 + 본문 전체(content:encoded) 포함. /blog/rss.xml 로 제공.
const SITE_URL = "https://www.supercoder.co";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug?: string | null;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  content?: string | null;
  cover_url?: string | null;
  created_at: string;
  updated_at?: string | null;
};

// XML 텍스트 노드/속성용 이스케이프
function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
// CDATA로 감싸 본문 HTML을 그대로 전달(]]> 만 안전 분할)
function cdata(s: string) {
  return `<![CDATA[${String(s || "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}
// 내부 상대경로(href="/…", src="/…")를 절대 URL로 — RSS 리더에서 깨지지 않게
function absolutize(html: string) {
  return html.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE_URL}/`);
}

export async function GET() {
  let posts: Row[] = [];
  try {
    const res = await supabase
      .from("posts")
      .select("id,slug,title,excerpt,category,content,cover_url,created_at,updated_at")
      .eq("published", true)
      .or(publishAtVisibleOr())
      .order("created_at", { ascending: false })
      .limit(50);
    if (!res.error && res.data) posts = res.data as Row[];
  } catch {
    // DB 접근 불가 시 빈 채널 반환
  }

  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.slug || p.id}`;
      const date = new Date(p.created_at);
      const pubDate = isNaN(date.getTime()) ? "" : date.toUTCString();
      const cover = p.cover_url
        ? `<figure><img src="${p.cover_url}" alt="${esc(p.title)}" /></figure>`
        : "";
      const full = absolutize(cover + renderBody(p.content || ""));
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>${p.category ? `\n      <category>${esc(p.category)}</category>` : ""}${p.excerpt ? `\n      <description>${esc(p.excerpt)}</description>` : ""}${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ""}
      <content:encoded>${cdata(full)}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
