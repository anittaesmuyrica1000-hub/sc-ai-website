import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "./post.css";
import { supabase, publishAtVisibleOr, isScheduledFuture, type Post } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderBody } from "@/lib/postRender";
import ViewCounter from "@/components/ViewCounter";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PostNav = { slug: string | null; id: string; title: string; cover_url?: string | null; created_at: string };

const NAV_COLS = "id, slug, title, cover_url, created_at";

// 글 하단 추천 글 — 같은 카테고리에서 우선 채워 주제 클러스터(내부링크)를 만든다.
// 시간순 이전/다음 글은 주제와 무관해 내부링크가 검색엔진에 주제 신호를 주지 못했다(2026-08-18 GSC 점검).
// 같은 카테고리 글이 부족하면 최신 글로 채워 항상 카드 3개를 유지한다.
async function getRelatedPosts(currentId: string, category: string | null): Promise<PostNav[]> {
  const visible = () =>
    supabase.from("posts").select(NAV_COLS).eq("published", true).or(publishAtVisibleOr()).neq("id", currentId);
  try {
    const picked: PostNav[] = [];
    const seen = new Set<string>([currentId]);
    const add = (rows: PostNav[] | null) => {
      for (const r of rows ?? []) {
        if (picked.length >= 3 || seen.has(r.id)) continue;
        picked.push(r);
        seen.add(r.id);
      }
    };

    // 1) 같은 카테고리 · 조회수 높은 순 — 실제로 읽히는 글로 연결
    if (category) {
      const same = await visible().eq("category", category).order("views", { ascending: false }).limit(3);
      add(same.data as PostNav[] | null);
    }
    // 2) 부족분은 최신 글로 채운다
    if (picked.length < 3) {
      const recent = await visible().order("created_at", { ascending: false }).limit(8);
      add(recent.data as PostNav[] | null);
    }
    return picked;
  } catch {
    return [];
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
    if (isScheduledFuture(p.publish_at)) return null; // 예약 시각 전에는 비노출
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
  const metaTitle = p.meta_title?.trim();
  const metaDesc = p.meta_description?.trim() || p.excerpt || undefined;
  const path = `/blog/${p.slug || p.id}`;
  // 어드민에서 '검색 제목'을 지정했으면 그 값을 그대로 <title>로 쓴다(absolute).
  // 루트 layout의 title.template("%s · AI면접")이 덧붙으면 meta_title에 이미 들어 있는
  // 브랜드와 중복돼 42~49자가 되고, 구글이 30~35자에서 잘라 키워드가 사라진다(2026-08-18 점검).
  // 미지정 시에는 기존처럼 템플릿을 그대로 적용해 브랜드가 붙게 둔다.
  return {
    title: metaTitle ? { absolute: metaTitle } : `${p.title} · 블로그`,
    description: metaDesc,
    keywords: tags.length ? tags : undefined,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: p.meta_title?.trim() || p.title,
      description: metaDesc,
      url: path,
      images: p.cover_url ? [{ url: p.cover_url }] : [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
      tags: tags.length ? tags : undefined,
    },
  };
}

// 본문 안 FAQ(물음표로 끝나는 H3 문답)를 골라 FAQPage 구조화 데이터로 내보낸다.
// 홈에는 FAQPage 스키마가 있는데 블로그 상세만 BlogPosting 하나뿐이라 FAQ가 검색에 노출되지 않았다(2026-08-19 점검).
// H2 제목 문구('자주 묻는 질문' 등)에 의존하면 글마다 제목이 달라 놓친다. 그래서 모양으로 찾는다.
// 2026-08-19 기준 발행글 전수 점검에서 질문형 H3가 2개 이상인 글은 3개였고 모두 실제 FAQ였다.
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const stripTags = (s: string) =>
  s.replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] || m)
    .replace(/\s+/g, " ")
    .trim();

// 끝의 따옴표·괄호를 걷어낸 뒤 물음표로 끝나면 질문으로 본다.
const looksLikeQuestion = (s: string) => /[?？]$/.test(s.replace(/["'”’」』）)\]\s]+$/, ""));

// 'Q. ' 'Q1.' 같은 번호 접두어와 감싼 따옴표를 떼어 스키마 name을 깔끔하게 만든다.
// 'Q'만으로는 떼지 않는다("QA는 무엇인가요?"가 잘리면 안 된다).
const cleanQuestion = (s: string) =>
  s.replace(/^Q\d*[.．)]\s*/i, "")
    .replace(/^["'“”『「]+/, "")
    .replace(/["'“”』」]+$/, "")
    .trim();

function extractFaq(html: string): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];
  const re = /<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[23]>|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && items.length < 20) {
    const raw = stripTags(m[1]);
    if (!looksLikeQuestion(raw)) continue;
    const a = stripTags(m[2]);
    const q = cleanQuestion(raw);
    if (q && a) items.push({ q, a });
  }
  return items.length >= 2 ? items : [];
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPost(id);
  if (!p) notFound();

  const related = await getRelatedPosts(p.id, p.category || null);
  const bodyHtml = renderBody(p.content);
  const faq = extractFaq(bodyHtml);

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
        <div className="post-content" data-slug={p.slug || undefined} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        {Array.isArray(p.tags) && p.tags.length > 0 && (
          <ul className="post-tags" aria-label="주제 키워드">
            {p.tags.filter(Boolean).map((t) => (
              <li key={t} className="post-tag">#{t}</li>
            ))}
          </ul>
        )}
        {/* 글 하단 전환 CTA — 검색 유입(블로그 조회의 대부분)이 전환 경로 없이 끝나지 않도록. 버튼은 공유 토큰(.btn) 재사용. */}
        <aside className="post-cta">
          <p className="post-cta__label"><i className="fa-solid fa-circle-check"></i> 슈퍼코더 AI면접</p>
          <h2 className="post-cta__title">지원자 검증은 AI가 하고, 채용팀은 리포트만 봅니다.</h2>
          <p className="post-cta__desc">
            1차 검증을 AI 면접으로 자동화하면, 서류로는 확인되지 않던 부분까지 걸러진 뒤 채용팀에 넘어옵니다.
            우리 회사 채용 기준에 어떻게 적용되는지 담당자가 안내해드립니다.
          </p>
          <div className="post-cta__actions">
            <Link href="/apply" className="btn btn-blue">무료 상담 신청 <i className="fa-solid fa-arrow-right"></i></Link>
            <Link href="/brochure" className="btn btn-out">서비스 소개서 받기</Link>
          </div>
        </aside>

        {related.length > 0 && (
          <div className="post-foot">
            <p className="post-more-label">
              {p.category ? `${p.category} 관련 글 더 보기` : "함께 읽으면 좋은 글"}
            </p>
            <div className="post-more-list">
              {related.map((item) => (
                <Link key={item.id} href={`/blog/${item.slug || item.id}`} className="post-more-card">
                  {item.cover_url
                    ? <img src={item.cover_url} alt="" className="post-more-thumb" />
                    : <span className="post-more-thumb post-more-thumb--empty" />}
                  <span className="post-more-info">
                    <span className="post-more-title">{item.title}</span>
                    <span className="post-more-date">{fmtDate(item.created_at)}</span>
                  </span>
                </Link>
              ))}
            </div>
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
      {faq.length >= 2 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}
    </main>
  );
}
