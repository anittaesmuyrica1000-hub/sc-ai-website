"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { STATUS_LABEL, type EventItem, type EventStatus } from "@/lib/events";
import { EVENT_JOBS } from "@/lib/eventApply";

type Row = EventItem & { status: EventStatus; dday: string };

/* 이벤트별 모집 공고 — 상세 페이지의 BODIES 와 같은 방식으로 slug 로 고른다.
   목록에서도 "어떤 직군을 뽑는지"가 바로 보여야 지원까지 한 번에 간다
   (행사 카드만 있으면 상세 → 지원 두 번을 더 거쳐야 한다). */
const JOBS: Record<string, typeof EVENT_JOBS> = {
  "ai-mock-challenge-2026": EVENT_JOBS,
};

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
              <div className="post-grid">
                {filtered.map((e) => (
                  <Link key={e.slug} href={`/event/${e.slug}`} className="post-card">
                    {e.cover ? (
                      <Image
                        src={e.cover}
                        alt=""
                        className="post-cover"
                        width={640}
                        height={360}
                        sizes="(max-width:760px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="post-cover ph">
                        <i className="fa-solid fa-bullhorn"></i>
                      </div>
                    )}
                    <div className="post-body">
                      <span className="post-cat">{STATUS_LABEL[e.status]}</span>
                      <h2>{e.title}</h2>
                      <p className="post-excerpt">{e.excerpt}</p>
                      <p className="ev-card-period">
                        <i className="fa-solid fa-clock-rotate-left"></i> {e.period}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 행사 카드 아래 모집 공고 — 상세 페이지와 같은 카드(.ev-jobcard)를 그대로 쓴다.
                  카드를 누르면 해당 직군 지원서로 바로 간다. */}
              {filtered.map((e) => {
                const jobs = JOBS[e.slug];
                if (!jobs) return null;
                return (
                  <div key={e.slug} className="ev-jobs ev-jobs--list">
                    <div className="ev-jobs__head">
                      <h2>모집 중인 공고</h2>
                      <span className="ev-jobs__count">{jobs.length}</span>
                    </div>
                    <ul className="ev-jobs__list">
                      {jobs.map((j) => (
                        <li key={j.v}>
                          <Link href={`${e.applyUrl}?job=${j.v}`} className="ev-jobcard">
                            <span className="ev-jobcard__org">슈퍼전자</span>
                            <span className="ev-jobcard__title">{j.l} 신입사원 모집</span>
                            <span className="ev-jobcard__meta">
                              <span>신입</span>
                              <span>
                                {e.applyStart.replace(/-/g, ".")} ~ {e.applyEnd.replace(/-/g, ".")}
                              </span>
                            </span>
                            <span className="ev-jobcard__tags">
                              <span className="ev-tag ev-tag--dday">{e.dday}</span>
                              {j.tags.map((t) => (
                                <span key={t} className="ev-tag">
                                  {t}
                                </span>
                              ))}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="ev-jobs__note">
                      한 직군만 선택해 지원합니다. 참가비는 없고 전공·학년 제한도 없습니다.
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>
    </>
  );
}
