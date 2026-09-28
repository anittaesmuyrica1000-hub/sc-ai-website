"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUS_LABEL, type EventItem, type EventStatus } from "@/lib/events";

type Row = EventItem & { status: EventStatus };

// 필터 탭 — 블로그는 카테고리, 이벤트는 모집 상태로 나눈다
const TABS: { key: "전체" | EventStatus; label: string }[] = [
  { key: "전체", label: "전체" },
  { key: "open", label: "모집 중" },
  { key: "upcoming", label: "모집 예정" },
  { key: "closed", label: "모집 마감" },
];

// 검색창은 카드가 충분히 쌓였을 때만 띄운다. 한두 건일 때는 검색이 오히려 방해가 된다
const SEARCH_MIN = 4;

export default function EventClient({ events }: { events: Row[] }) {
  const [activeTab, setActiveTab] = useState<"전체" | EventStatus>("전체");
  const [query, setQuery] = useState("");

  const showSearch = events.length >= SEARCH_MIN;
  const q = query.trim().toLowerCase();

  const tabs = useMemo(
    () => TABS.filter((t) => t.key === "전체" || events.some((e) => e.status === t.key)),
    [events],
  );

  const filtered = useMemo(() => {
    let list = activeTab === "전체" ? events : events.filter((e) => e.status === activeTab);
    if (q) {
      list = list.filter((e) =>
        [e.title, e.excerpt, e.period, STATUS_LABEL[e.status]].join(" ").toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, activeTab, q]);

  return (
    <>
      <section className="blog-head">
        <div className="wrap">
          <h1>
            직접 해보는
            <br />
            AI 면접 이벤트
          </h1>
          <p className="lead">취업 전에 AI 면접을 실전처럼 겪어 볼 수 있는 자리를 엽니다.</p>

          {showSearch && (
            <div className="blog-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="키워드로 이벤트 검색"
                aria-label="이벤트 검색"
              />
              {query && (
                <button
                  type="button"
                  className="blog-search-clear"
                  aria-label="검색어 지우기"
                  onClick={() => setQuery("")}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          )}

          {tabs.length > 1 && (
            <div className="blog-filter">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={t.key === activeTab ? "active" : undefined}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="blog-list">
        <div className="wrap">
          {filtered.length === 0 ? (
            <div className="blog-state">
              <i className="fa-regular fa-folder-open"></i>
              <p>해당하는 이벤트가 없습니다.</p>
            </div>
          ) : (
            <>
              {q && (
                <div className="blog-result-count">
                  &lsquo;{query.trim()}&rsquo; 검색 결과 {filtered.length}건
                </div>
              )}
              {/* 행사 한 건 = 요약 한 블록 + 그 행사의 채용 카드.
                  큰 커버 이미지를 쓰던 카드를 걷어냈다 — 이미지가 없는 동안 자리만 차지하고,
                  정작 지원자가 알아야 할 "어떤 직군을, 언제까지"가 안 보였다.
                  공고가 없는 행사는 요약 블록만 나오고, 상세 링크로 넘어간다. */}
              {/* 목록에는 행사 배너만 둔다. 어떤 직군을 뽑는지는 상세에서 보여준다 —
                  목록과 상세에 같은 카드를 두 번 두면 들어온 사람이 같은 화면을 두 번 본다.
                  배너 전체가 상세로 가는 링크다(안에 링크를 또 넣지 않는다). */}
              {filtered.map((e) => (
                <article key={e.slug} className="ev-entry">
                  <Link href={`/event/${e.slug}`} className="ev-banner">
                    <span className="ev-banner__status">{STATUS_LABEL[e.status]}</span>
                    <span className="ev-banner__title">{e.title}</span>
                    <span className="ev-banner__excerpt">{e.excerpt}</span>
                    <span className="ev-banner__meta">
                      <span>
                        <i className="fa-solid fa-clock-rotate-left"></i> {e.period}
                      </span>
                      <span className="ev-banner__more">
                        자세히 보기 <i className="fa-solid fa-arrow-right"></i>
                      </span>
                    </span>
                  </Link>
                </article>
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
}
