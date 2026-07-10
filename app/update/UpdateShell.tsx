import Link from "next/link";
import { type Update } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderBody } from "@/lib/postRender";
import { badgeClass } from "./badge";

// 그리팅풍 와이드 레이아웃 — 좌측: 전체 업데이트 목록(내비), 우측: 선택된 글 본문.
export default function UpdateShell({ items, active, error }: { items: Update[]; active: Update | null; error?: boolean }) {
  return (
    <main className="upd-shell">
      <aside className="upd-nav">
        <div className="upd-nav-head">
          <div className="upd-eyebrow"><i className="fa-solid fa-bullhorn"></i> 제품 업데이트</div>
          <h2>업데이트 노트</h2>
        </div>
        {items.length > 0 && (
          <nav className="upd-nav-list" aria-label="업데이트 목록">
            {items.map((u) => (
              <Link key={u.id} href={`/update/${u.id}`} className={`upd-nav-item${active?.id === u.id ? " on" : ""}`}>
                <span className="upd-nav-date">{fmtDate(u.created_at)}</span>
                <span className="upd-nav-title">{u.title}</span>
              </Link>
            ))}
          </nav>
        )}
      </aside>

      <div className="upd-main-col">
        {error ? (
          <div className="upd-state">업데이트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>
        ) : !active ? (
          <div className="upd-state">아직 등록된 업데이트가 없습니다.</div>
        ) : (
          <article className="upd-main">
            <div className="upd-article-head">
              {active.category && <span className={`upd-badge ${badgeClass(active.category)}`}>{active.category}</span>}
              <h1>{active.title}</h1>
              <time className="upd-date">{fmtDate(active.created_at)}</time>
            </div>
            <div className="upd-content" dangerouslySetInnerHTML={{ __html: renderBody(active.content) }} />
          </article>
        )}
      </div>
    </main>
  );
}
