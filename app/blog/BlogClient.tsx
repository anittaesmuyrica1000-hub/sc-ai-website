"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Post } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";

export default function BlogClient({ posts, error }: { posts: Post[]; error: boolean }) {
  const [activeCat, setActiveCat] = useState("전체");

  const cats = useMemo(() => {
    const list = ["전체"];
    posts.forEach((p) => {
      const c = p.category || "기타";
      if (list.indexOf(c) === -1) list.push(c);
    });
    return list;
  }, [posts]);

  const filtered = useMemo(
    () => (activeCat === "전체" ? posts : posts.filter((p) => (p.category || "기타") === activeCat)),
    [posts, activeCat]
  );

  return (
    <>
      <section className="blog-head">
        <div className="wrap">
          <div className="eyebrow"><i className="fa-solid fa-pen-nib"></i> AI면접 블로그</div>
          <h1>채용을 바꾸는<br />AI 면접 인사이트</h1>
          <p className="lead">AI 면접, 채용 검증, HR 트렌드까지 — 더 나은 채용을 위한 이야기를 전합니다.</p>
          <div className="blog-filter">
            {cats.map((c) => (
              <button key={c} className={c === activeCat ? "active" : undefined} onClick={() => setActiveCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="blog-list">
        <div className="wrap">
          {error ? (
            <div className="blog-state err">
              <i className="fa-solid fa-triangle-exclamation"></i>
              글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : filtered.length === 0 ? (
            <div className="blog-state">
              <i className="fa-regular fa-folder-open"></i>
              아직 등록된 글이 없습니다.
            </div>
          ) : (
            <div className="post-grid">
              {filtered.map((p) => (
                <Link key={p.id} href={`/blog/${encodeURIComponent(p.slug || p.id)}`} className="post-card">
                  {p.cover_url ? (
                    <img className="post-cover" src={p.cover_url} alt="" loading="lazy" />
                  ) : (
                    <div className="post-cover ph"><i className="fa-solid fa-feather"></i></div>
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
        </div>
      </section>
    </>
  );
}
