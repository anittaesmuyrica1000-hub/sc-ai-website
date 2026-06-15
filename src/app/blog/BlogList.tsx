"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type Post, fmtDate } from "@/lib/types";

/* 블로그 카드 그리드 + 카테고리 필터 (클라이언트 상호작용) */
export default function BlogList({ posts }: { posts: Post[] }) {
  const [activeCat, setActiveCat] = useState("전체");

  const cats = useMemo(() => {
    const set = ["전체"];
    posts.forEach((p) => {
      const c = p.category || "기타";
      if (!set.includes(c)) set.push(c);
    });
    return set;
  }, [posts]);

  const filtered =
    activeCat === "전체"
      ? posts
      : posts.filter((p) => (p.category || "기타") === activeCat);

  return (
    <>
      <div className="blog-filter">
        {cats.map((c) => (
          <button
            key={c}
            className={c === activeCat ? "active" : undefined}
            onClick={() => setActiveCat(c)}
          >
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
        <div className="post-grid">
          {filtered.map((p) => (
            <Link key={p.id} href={`/blog/${p.id}`} className="post-card">
              {p.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="post-cover" src={p.cover_url} alt="" loading="lazy" />
              ) : (
                <div className="post-cover ph">
                  <i className="fa-solid fa-feather" />
                </div>
              )}
              <div className="post-body">
                <span className="post-cat">{p.category || "기타"}</span>
                <h2>{p.title}</h2>
                {p.excerpt && <p className="post-excerpt">{p.excerpt}</p>}
                <div className="post-date">{fmtDate(p.created_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
