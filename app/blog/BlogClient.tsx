"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Post } from "@/lib/supabase";

const stripHtml = (s?: string | null) => String(s || "").replace(/<[^>]+>/g, " ");

export default function BlogClient({ posts, error }: { posts: Post[]; error: boolean }) {
  const [activeCat, setActiveCat] = useState("전체");
  const [query, setQuery] = useState("");

  const cats = useMemo(() => {
    const list = ["전체"];
    posts.forEach((p) => {
      const c = p.category || "기타";
      if (list.indexOf(c) === -1) list.push(c);
    });
    return list;
  }, [posts]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = activeCat === "전체" ? posts : posts.filter((p) => (p.category || "기타") === activeCat);
    if (q) {
      list = list.filter((p) => {
        const hay = [p.title, p.excerpt, p.category, (p.tags || []).join(" "), stripHtml(p.content)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [posts, activeCat, q]);

  return (
    <>
      <section className="blog-head">
        <div className="wrap">
          <h1>채용을 바꾸는<br />AI 면접 인사이트</h1>
          <p className="lead">AI 면접, 채용 검증, HR 트렌드까지 — 더 나은 채용을 위한 이야기를 전합니다.</p>

          <div className="blog-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="키워드로 글 검색 (제목·내용·태그)"
              aria-label="블로그 검색"
            />
            {query && (
              <button type="button" className="blog-search-clear" aria-label="검색어 지우기" onClick={() => setQuery("")}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

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
              {q ? <>‘{query.trim()}’에 대한 검색 결과가 없습니다.</> : "아직 등록된 글이 없습니다."}
            </div>
          ) : (
            <>
              {q && <div className="blog-result-count">‘{query.trim()}’ 검색 결과 {filtered.length}건</div>}
              <div className="post-grid">
                {filtered.map((p) => (
                  <Link key={p.id} href={`/blog/${encodeURIComponent(p.slug || p.id)}`} className="post-card">
                    {p.cover_url ? (
                      <Image
                        className="post-cover"
                        src={p.cover_url}
                        alt={p.cover_alt || p.title}
                        width={1600}
                        height={900}
                        sizes="(max-width: 760px) 100vw, 560px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="post-cover ph"><i className="fa-solid fa-feather"></i></div>
                    )}
                    <div className="post-body">
                      <span className="post-cat">{p.category || "기타"}</span>
                      <h2>{p.title}</h2>
                      {p.excerpt && <p className="post-excerpt">{p.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
