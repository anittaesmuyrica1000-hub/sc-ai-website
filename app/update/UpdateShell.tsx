import Link from "next/link";
import { type Update } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { renderBody } from "@/lib/postRender";
import { badgeClass } from "./badge";

// 본문(HTML)에서 h2를 찾아 id를 부여하고 목차(TOC)를 만든다.
function withToc(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  let i = 0;
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_m, attrs, inner) => {
    const id = `sec-${i++}`;
    const text = String(inner).replace(/<[^>]+>/g, "").trim();
    toc.push({ id, text });
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });
  return { html: out, toc };
}

// 그리팅풍 와이드 3단 — 좌: 전체 목록, 중: 본문, 우: 현재 글 바로가기(목차).
export default function UpdateShell({ items, active, error }: { items: Update[]; active: Update | null; error?: boolean }) {
  const rendered = active ? withToc(renderBody(active.content)) : { html: "", toc: [] };
  const hasToc = rendered.toc.length > 0;

  return (
    <main className={`upd-shell${hasToc ? " has-toc" : ""}`}>
      {/* 좌측: 전체 업데이트 목록 */}
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

      {/* 중앙: 선택된 글 */}
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
            <div className="upd-content" dangerouslySetInnerHTML={{ __html: rendered.html }} />
          </article>
        )}
      </div>

      {/* 우측: 이 글 바로가기(목차) */}
      {hasToc && (
        <aside className="upd-toc" aria-label="바로 가기">
          <div className="upd-toc-head">바로 가기</div>
          <nav className="upd-toc-list">
            {rendered.toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="upd-toc-item">{t.text}</a>
            ))}
          </nav>
        </aside>
      )}
    </main>
  );
}
