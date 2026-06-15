"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type Post, fmtDate, readingTime } from "@/lib/types";

const PAGE = 6;

/* 블로그: 추천(featured) 글 + 카테고리 필터 + 카드 그리드 + 더보기 페이지네이션 */
export default function BlogList({ posts }: { posts: Post[] }) {
  const [activeCat, setActiveCat] = useState("전체");
  const [visible, setVisible] = useState(PAGE);

  const cats = useMemo(() => {
    const set = ["전체"];
    posts.forEach((p) => {
      const c = p.category || "기타";
      if (!set.includes(c)) set.push(c);
    });
    return set;
  }, [posts]);

  const isAll = activeCat === "전체";
  const filtered = isAll ? posts : posts.filter((p) => (p.category || "기타") === activeCat);

  // 전체 보기일 때만 최신 글을 추천(featured)으로, 나머지를 그리드에
  const featured = isAll ? filtered[0] : undefined;
  const rest = featured ? filtered.slice(1) : filtered;
  const shown = rest.slice(0, visible);
  const hasMore = rest.length > visible;

  function selectCat(c: string) {
    setActiveCat(c);
    setVisible(PAGE);
  }

  function Card({ p }: { p: Post }) {
    return (
      <Link href={`/blog/${p.id}`} className="post-card">
        {p.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="post-cover" src={p.cover_url} alt="" loading="lazy" />
        ) : (
          <div className="post-cover ph"><i className="fa-solid fa-feather" /></div>
        )}
        <div className="post-body">
          <span className="post-cat">{p.category || "기타"}</span>
          <h2>{p.title}</h2>
          {p.excerpt && <p className="post-excerpt">{p.excerpt}</p>}
          <div className="post-date">{fmtDate(p.created_at)} · 읽는 시간 {readingTime(p.content)}분</div>
        </div>
      </Link>
    );
  }

  return (
    <>
      {/* 카테고리 탭 */}
      <div className="blog-filter">
        {cats.map((c) => (
          <button key={c} className={c === activeCat ? "active" : undefined} onClick={() => selectCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="blog-state">
          <i className="fa-regular fa-folder-open" />
          아직 등록된 글이 없습니다.
        </div>
      ) : (
        <>
          {/* 추천 글 (전체 보기 + 글 2개 이상일 때) */}
          {featured && rest.length > 0 && (
            <Link href={`/blog/${featured.id}`} className="featured">
              {featured.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="featured-cover" src={featured.cover_url} alt="" />
              ) : (
                <div className="featured-cover ph"><i className="fa-solid fa-feather" /></div>
              )}
              <div className="featured-body">
                <span className="featured-badge">추천 글</span>
                <span className="post-cat">{featured.category || "기타"}</span>
                <h2>{featured.title}</h2>
                {featured.excerpt && <p>{featured.excerpt}</p>}
                <div className="post-date">
                  {fmtDate(featured.created_at)} · 읽는 시간 {readingTime(featured.content)}분
                </div>
                <span className="featured-more">읽어보기 <i className="fa-solid fa-arrow-right" /></span>
              </div>
            </Link>
          )}

          {/* 카드 그리드 */}
          {shown.length > 0 && (
            <div className="post-grid">
              {shown.map((p) => <Card key={p.id} p={p} />)}
            </div>
          )}

          {/* 더보기 */}
          {hasMore && (
            <div className="blog-more">
              <button className="btn btn-out" onClick={() => setVisible((v) => v + PAGE)}>
                더보기 <i className="fa-solid fa-chevron-down" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
