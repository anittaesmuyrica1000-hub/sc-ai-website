"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Post, type Faq, type Signup, type BrochureRequest, type LegalDoc, type LegalVersion, legalPath, RESERVED_LEGAL_SLUGS, SIGNUP_STATUSES } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import MarkdownEditor from "@/components/MarkdownEditor";
import RichEditor, { type EditorTemplate } from "@/components/RichEditor";
import { renderBody } from "@/lib/postRender";
import { recommendTags } from "@/lib/keywords";

// HTML 태그 제거(목록 미리보기·검증용)
const stripTags = (s: string) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

type Section = "dash" | "blog" | "faq" | "brochure" | "legal" | "signups" | "settings";

function fmtDateTime(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <main className="admin">
        <div className="list-state"><i className="fa-solid fa-spinner fa-spin"></i> 확인 중…</div>
      </main>
    );
  }
  if (!session) return <LoginForm />;
  return <Console email={session.user.email ?? ""} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      setErr("로그인에 실패했습니다. 이메일·비밀번호를 확인해 주세요. (" + msg + ")");
      setBusy(false);
    }
  }

  return (
    <main className="admin" style={{ maxWidth: 420 }}>
      <div className="admin-head">
        <div>
          <h1>관리자 로그인</h1>
          <div className="sub">AIVIEW 관리 콘솔은 관리자 인증이 필요합니다.</div>
        </div>
      </div>
      <div className="card">
        <form onSubmit={onSubmit}>
          {err && <div className="form-msg err">{err}</div>}
          <div className="field">
            <label htmlFor="login-email">이메일</label>
            <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@supercoder.co" required />
          </div>
          <div className="field">
            <label htmlFor="login-pw">비밀번호</label>
            <input type="password" id="login-pw" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-blue" disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "dash", label: "대시보드", icon: "fa-gauge-high" },
  { key: "blog", label: "블로그", icon: "fa-feather" },
  { key: "faq", label: "FAQ", icon: "fa-circle-question" },
  { key: "brochure", label: "소개서", icon: "fa-file-pdf" },
  { key: "legal", label: "약관", icon: "fa-scale-balanced" },
  { key: "signups", label: "도입문의", icon: "fa-inbox" },
  { key: "settings", label: "설정", icon: "fa-gear" },
];
const TITLE: Record<Section, { h: string; d: string }> = {
  dash: { h: "대시보드", d: "전체 현황을 한눈에 확인합니다." },
  blog: { h: "블로그 관리", d: "블로그 글을 등록, 수정, 삭제합니다." },
  faq: { h: "FAQ 관리", d: "자주 묻는 질문을 추가하고 수정합니다." },
  brochure: { h: "AI 면접 서비스 소개서", d: "도입문의 페이지와 웹사이트에서 제공되는 서비스 소개서를 관리합니다." },
  legal: { h: "약관 관리", d: "웹사이트 푸터의 약관(개인정보처리방침·이용약관)을 수정하거나 새 약관을 추가합니다." },
  signups: { h: "도입문의 관리", d: "고객이 남긴 도입문의 기록을 확인하고 상담 상태를 관리합니다." },
  settings: { h: "설정", d: "관리자 계정과 기본 설정을 관리합니다." },
};

function Console({ email }: { email: string }) {
  const [section, setSection] = useState<Section>("dash");
  const [navOpen, setNavOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("adm-collapsed") === "1") setCollapsed(true);
  }, []);
  function toggleCollapse() {
    setCollapsed((v) => { try { localStorage.setItem("adm-collapsed", v ? "0" : "1"); } catch {} return !v; });
  }
  // 상단 ☰: 모바일은 드로어 열기/닫기, 데스크톱은 사이드바 접기/펼치기
  function onBurger() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width:980px)").matches) setNavOpen((v) => !v);
    else toggleCollapse();
  }

  return (
    <div className={`adm${collapsed ? " collapsed" : ""}`}>
      <aside className={`adm-side${navOpen ? " open" : ""}`}>
        <div className="adm-head">
          <button type="button" className="adm-brand" onClick={() => { setSection("dash"); setNavOpen(false); }} title="대시보드" aria-label="대시보드로">
            <img className="adm-logo-full" src="/supercoder-nav.svg" alt="Supercoder" />
            <img className="adm-logo-mark" src="/favicon.svg" alt="Supercoder" />
          </button>
          <button
            type="button"
            className="adm-toggle"
            onClick={toggleCollapse}
            title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            aria-label="사이드바 접기/펼치기"
            aria-expanded={!collapsed}
          >
            <i className={`fa-solid ${collapsed ? "fa-angles-right" : "fa-angles-left"}`}></i>
          </button>
        </div>
        <nav className="adm-nav">
          {NAV.map((n) => (
            <button key={n.key} className={section === n.key ? "active" : ""} onClick={() => { setSection(n.key); setNavOpen(false); }}>
              <span className="adm-label">{n.label}</span>
            </button>
          ))}
          <a className="adm-nav-link" href="/" target="_blank" rel="noopener noreferrer">
            <span className="adm-label">웹사이트로 가기</span>
          </a>
        </nav>
        <div className="adm-foot">
          <div className="adm-acct">
            <button className="adm-acct-btn" onClick={() => setAcctOpen((v) => !v)}>
              <span className="adm-avatar">관</span>
              <span className="adm-acct-name">관리자</span>
              <i className="fa-solid fa-chevron-up adm-acct-caret"></i>
            </button>
            {acctOpen && (
              <>
                <div className="adm-acct-bg" onClick={() => setAcctOpen(false)} />
                <div className="adm-acct-menu">
                  <div className="adm-acct-email">{email}</div>
                  <button onClick={() => { setAcctOpen(false); setSection("settings"); setNavOpen(false); }}><i className="fa-solid fa-gear"></i> 설정</button>
                  <button onClick={() => supabase.auth.signOut()}><i className="fa-solid fa-right-from-bracket"></i> 로그아웃</button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
      {navOpen && <div className="adm-backdrop" onClick={() => setNavOpen(false)} />}

      <div className="adm-main">
        <div className="adm-bar">
          <button type="button" className="adm-burger" aria-label="메뉴" onClick={onBurger}><i className="fa-solid fa-bars"></i></button>
          <div className="adm-bar-title">
            <h1>{TITLE[section].h}</h1>
            <div className="sub">{TITLE[section].d}</div>
          </div>
        </div>
        <div className="adm-body">
          {section === "dash" && <Dashboard onGo={setSection} />}
          {section === "blog" && <BlogManager />}
          {section === "faq" && <FaqManager />}
          {section === "brochure" && <BrochureSection />}
          {section === "legal" && <LegalManager />}
          {section === "signups" && <SignupsManager />}
          {section === "settings" && <Settings email={email} />}
        </div>
      </div>
    </div>
  );
}

/* ===================== 대시보드 ===================== */

const QUICK: { key: Section; label: string; desc: string; icon: string }[] = [
  { key: "blog", label: "블로그 관리", desc: "블로그 글을 작성하고 수정·삭제합니다.", icon: "fa-feather" },
  { key: "faq", label: "FAQ 관리", desc: "FAQ를 추가하고 노출 여부·순서를 관리합니다.", icon: "fa-circle-question" },
  { key: "brochure", label: "소개서 관리", desc: "AI 면접 서비스 소개서 PDF를 업로드·교체합니다.", icon: "fa-file-pdf" },
  { key: "signups", label: "도입문의 관리", desc: "도입문의를 확인하고 상담 상태를 관리합니다.", icon: "fa-inbox" },
  { key: "settings", label: "설정", desc: "관리자 계정과 기본 설정을 관리합니다.", icon: "fa-gear" },
];

type UpdateItem = { type: string; title: string; time: string; icon: string; color: string };
type DashData = {
  today: number | null; todayDelta: number | null; week: number | null; weekDelta: number | null;
  pubBlog: number | null; totBlog: number | null; pubFaq: number | null; totFaq: number | null;
  brochure: string | null; brochureAt: string | null; recent: Signup[]; updates: UpdateItem[];
};

function Dashboard({ onGo }: { onGo: (s: Section) => void }) {
  const [d, setD] = useState<DashData>({ today: null, todayDelta: null, week: null, weekDelta: null, pubBlog: null, totBlog: null, pubFaq: null, totFaq: null, brochure: null, brochureAt: null, recent: [], updates: [] });

  useEffect(() => {
    (async () => {
      const now = Date.now();
      const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
      const out: DashData = { today: null, todayDelta: null, week: null, weekDelta: null, pubBlog: null, totBlog: null, pubFaq: null, totFaq: null, brochure: null, brochureAt: null, recent: [], updates: [] };

      try {
        const r = await supabase.from("signups").select("*").order("created_at", { ascending: false });
        if (!r.error && r.data) {
          const rows = r.data as Signup[];
          const at = (s: Signup) => new Date(s.created_at).getTime();
          out.today = rows.filter((s) => at(s) >= dayStart).length;
          out.todayDelta = out.today - rows.filter((s) => at(s) >= dayStart - 86400000 && at(s) < dayStart).length;
          out.week = rows.filter((s) => at(s) >= now - 7 * 86400000).length;
          out.weekDelta = out.week - rows.filter((s) => at(s) >= now - 14 * 86400000 && at(s) < now - 7 * 86400000).length;
          out.recent = rows.slice(0, 5);
        }
      } catch {}

      try {
        const r = await supabase.from("posts").select("id,title,published,created_at,updated_at").order("created_at", { ascending: false });
        if (!r.error && r.data) {
          const rows = r.data as Post[];
          out.totBlog = rows.length;
          out.pubBlog = rows.filter((p) => p.published !== false).length;
          [...rows].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).slice(0, 3)
            .forEach((p) => out.updates.push({ type: "블로그", title: p.title, time: p.updated_at || p.created_at, icon: "fa-feather", color: "u-blue" }));
        }
      } catch {}

      try {
        const r = await supabase.from("faq").select("id,question,published,created_at,updated_at");
        if (!r.error && r.data) {
          const rows = r.data as Faq[];
          out.totFaq = rows.length;
          out.pubFaq = rows.filter((f) => f.published !== false).length;
          [...rows].sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()).slice(0, 2)
            .forEach((f) => out.updates.push({ type: "FAQ", title: f.question, time: f.updated_at || f.created_at || "", icon: "fa-circle-question", color: "u-amber" }));
        }
      } catch {}

      try {
        const r = await supabase.from("brochure_files").select("label,created_at").eq("is_current", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (r.data) { out.brochure = r.data.label; out.brochureAt = r.data.created_at; out.updates.push({ type: "소개서", title: r.data.label, time: r.data.created_at, icon: "fa-file-pdf", color: "u-red" }); }
      } catch {}

      out.recent.slice(0, 2).forEach((s) => out.updates.push({ type: "도입문의", title: `${s.company} 도입문의 접수`, time: s.created_at, icon: "fa-inbox", color: "u-green" }));
      out.updates.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      out.updates = out.updates.slice(0, 5);
      setD(out);
    })();
  }, []);

  const delta = (n: number | null) => (n == null ? "" : n > 0 ? `+${n}` : `${n}`);

  const stats = [
    { label: "오늘 신규 도입문의", v: d.today == null ? "—" : `${d.today}건`, sub: d.todayDelta == null ? "어제 대비 —" : `어제 대비 ${delta(d.todayDelta)}`, icon: "fa-envelope", chip: "s-blue", go: "signups" as Section },
    { label: "이번 주 도입문의", v: d.week == null ? "—" : `${d.week}건`, sub: d.weekDelta == null ? "지난주 대비 —" : `지난주 대비 ${delta(d.weekDelta)}`, icon: "fa-users", chip: "s-violet", go: "signups" as Section },
    { label: "공개 중인 블로그", v: d.pubBlog == null ? "—" : `${d.pubBlog}개`, sub: d.totBlog == null ? "" : `전체 ${d.totBlog}개`, icon: "fa-feather", chip: "s-green", go: "blog" as Section },
    { label: "공개 중인 FAQ", v: d.pubFaq == null ? "—" : `${d.pubFaq}개`, sub: d.totFaq == null ? "전체 FAQ" : `전체 ${d.totFaq}개`, icon: "fa-circle-question", chip: "s-amber", go: "faq" as Section },
    { label: "소개서 (현재 버전)", v: d.brochure || "없음", sub: d.brochureAt ? `${fmtDate(d.brochureAt)} 업로드` : "업로드 필요", icon: "fa-file-pdf", chip: "s-red", go: "brochure" as Section, small: true },
  ];

  return (
    <>
      <div className="dash-stats">
        {stats.map((s, i) => (
          <button key={i} className="stat-card" onClick={() => onGo(s.go)}>
            <div className={`stat-ic ${s.chip}`}><i className={`fa-solid ${s.icon}`}></i></div>
            <div className={`stat-v${s.small ? " sm" : ""}`}>{s.v}</div>
            <div className="stat-l">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </button>
        ))}
      </div>

      <div className="dash-panels">
        <div className="card list-card">
          <div className="list-head"><h2>최근 도입문의</h2><button className="link-btn" onClick={() => onGo("signups")}>전체 보기 →</button></div>
          {d.recent.length === 0 ? (
            <div className="list-state">표시할 도입문의가 없습니다.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table compact">
                <thead><tr><th>접수일</th><th>회사명</th><th>담당자</th><th>상태</th></tr></thead>
                <tbody>
                  {d.recent.map((s) => (
                    <tr key={s.id}>
                      <td className="nowrap">{fmtDate(s.created_at)}</td>
                      <td>{s.company}</td>
                      <td className="nowrap">{s.name}</td>
                      <td className="nowrap"><StatusBadge value={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card list-card">
          <div className="list-head"><h2>최근 업데이트된 콘텐츠</h2></div>
          {d.updates.length === 0 ? (
            <div className="list-state">최근 변경 내역이 없습니다.</div>
          ) : (
            <ul className="upd-list">
              {d.updates.map((u, i) => (
                <li key={i}>
                  <span className={`upd-ic ${u.color}`}><i className={`fa-solid ${u.icon}`}></i></span>
                  <div className="upd-meta"><div className="upd-t">{u.title}</div><div className="upd-s">{u.type}</div></div>
                  <div className="upd-time">{fmtDate(u.time)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="quick-cards">
        {QUICK.map((q) => (
          <button key={q.key} className="quick-card" onClick={() => onGo(q.key)}>
            <div className="qc-ic"><i className={`fa-solid ${q.icon}`}></i></div>
            <div className="qc-l">{q.label}</div>
            <div className="qc-d">{q.desc}</div>
            <div className="qc-go">바로가기 →</div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ===================== 설정 ===================== */

function Settings({ email }: { email: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setMsg({ text: "비밀번호는 8자 이상이어야 합니다.", ok: false }); return; }
    if (pw !== pw2) { setMsg({ text: "두 비밀번호가 일치하지 않습니다.", ok: false }); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg({ text: "비밀번호가 변경되었습니다.", ok: true }); setPw(""); setPw2("");
    } catch (err) { console.error(err); setMsg({ text: "변경에 실패했습니다. 다시 시도해 주세요.", ok: false }); }
    finally { setBusy(false); }
  }

  return (
    <div className="settings-grid">
      <div className="card">
        <h2>계정 정보</h2>
        <div className="set-row"><span>로그인 이메일</span><b>{email}</b></div>
        <div className="set-row"><span>권한</span><b>관리자</b></div>
        <div className="hint" style={{ marginTop: 12 }}>새 관리자 추가는 Supabase Auth에 사용자를 만들고 admins 테이블에 이메일을 등록하면 됩니다.</div>
      </div>
      <div className="card">
        <h2>비밀번호 변경</h2>
        {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
        <form onSubmit={changePw}>
          <div className="field"><label>새 비밀번호</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8자 이상" /></div>
          <div className="field"><label>새 비밀번호 확인</label><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <div className="form-actions"><button className="btn btn-blue" disabled={busy}>{busy ? "변경 중…" : "비밀번호 변경"}</button></div>
        </form>
      </div>
    </div>
  );
}

/* ===================== 블로그 관리 ===================== */

type FormState = { id: string; title: string; category: string; author: string; cover_url: string; excerpt: string; content: string; published: boolean; tags: string[]; slug: string; meta_title: string; meta_description: string };
const EMPTY: FormState = { id: "", title: "", category: "", author: "", cover_url: "", excerpt: "", content: "", published: true, tags: [], slug: "", meta_title: "", meta_description: "" };
const MAX_TAGS = 8;

// 제목 → URL slug. 한글·영문 소문자·숫자·하이픈 허용, 공백은 하이픈, 그 외 제거.
function slugify(s: string) {
  return String(s || "")
    .trim().toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// 블로그 글 템플릿 — 자주 쓰는 글 구조를 한 번에 채워 넣는다. 본문은 WYSIWYG(HTML)로 저장된다.
const BLOG_TEMPLATES: EditorTemplate[] = [
  {
    label: "고객 사례 (도입 후기)",
    html:
      '<div class="post-table-wrap"><table class="post-table"><thead><tr><th>항목</th><th>도입 전</th><th>도입 후</th></tr></thead><tbody>' +
      "<tr><td>채용 소요 기간</td><td>내용</td><td>내용</td></tr><tr><td>면접 검증 인원</td><td>내용</td><td>내용</td></tr></tbody></table></div>" +
      "<h2>도입 배경</h2><p>고객사가 어떤 채용 문제를 겪고 있었는지 적어주세요.</p>" +
      "<h2>도입 과정</h2><p>AIVIEW를 어떻게 적용했는지 단계별로 설명합니다.</p>" +
      "<h2>도입 효과</h2><ul><li>핵심 성과 1</li><li>핵심 성과 2</li></ul>" +
      "<blockquote>고객 인터뷰 한마디를 인용으로 넣어주세요.</blockquote>" +
      "<h2>마무리</h2><p>요약과 CTA를 적어주세요.</p>",
  },
  {
    label: "기능 소개",
    html:
      "<h2>한 줄 요약</h2><p>이 기능이 무엇을 해결하는지 한 문장으로 적어주세요.</p>" +
      "<h2>이런 분께 필요해요</h2><ul><li>대상 1</li><li>대상 2</li></ul>" +
      "<h2>주요 기능</h2><h3>1. 기능 이름</h3><p>설명</p><h3>2. 기능 이름</h3><p>설명</p>" +
      "<h2>활용 예시</h2><p>실제 활용 시나리오를 적어주세요.</p>",
  },
  {
    label: "채용 인사이트 / 트렌드",
    html:
      "<h2>들어가며</h2><p>다루려는 주제와 배경을 적어주세요.</p>" +
      "<h2>데이터로 보는 현황</h2>" +
      '<div class="post-table-wrap"><table class="post-table"><thead><tr><th>지표</th><th>수치</th></tr></thead><tbody>' +
      "<tr><td>지표 1</td><td>내용</td></tr><tr><td>지표 2</td><td>내용</td></tr></tbody></table></div>" +
      "<p>출처: 자료 출처를 적어주세요.</p>" +
      "<h2>시사점</h2><ul><li>인사이트 1</li><li>인사이트 2</li></ul>" +
      "<h2>맺음말</h2><p>정리와 제언을 적어주세요.</p>",
  },
];

// 관리자가 직접 만든 글 템플릿 — 백엔드 저장 없이 브라우저(localStorage)에 보관.
type CustomTemplate = { id: string; label: string; html: string };
const TPL_KEY = "aiview_blog_templates";
function readLocalTpls(): CustomTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(TPL_KEY) || "[]");
    return Array.isArray(arr) ? arr.filter((t) => t && t.label && t.html) : [];
  } catch { return []; }
}
function writeLocalTpls(list: CustomTemplate[]) {
  try { localStorage.setItem(TPL_KEY, JSON.stringify(list)); } catch { /* 용량 초과 등은 무시 */ }
}

function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [preview, setPreview] = useState(false);
  const [customTpls, setCustomTpls] = useState<CustomTemplate[]>([]);
  const isEdit = !!form?.id;

  const load = useCallback(async () => {
    try {
      const res = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setPosts((res.data as Post[]) || []);
      setLoadErr(false);
    } catch (err) { console.error("posts load failed:", err); setLoadErr(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // 내 템플릿 불러오기 — 브라우저(localStorage)에서
  useEffect(() => { setCustomTpls(readLocalTpls()); }, []);

  // 기본 템플릿 + 내 템플릿을 합쳐 편집기에 전달
  const allTemplates = useMemo<EditorTemplate[]>(
    () => [...BLOG_TEMPLATES, ...customTpls.map((t) => ({ label: t.label, html: t.html }))],
    [customTpls]
  );

  // 현재 본문을 새 템플릿으로 저장(브라우저 보관)
  function saveAsTemplate() {
    if (!form || !stripTags(form.content)) { showMsg("본문을 먼저 작성한 뒤 템플릿으로 저장할 수 있습니다.", false); return; }
    const label = window.prompt("템플릿 이름을 입력하세요", form.title.trim() || "내 템플릿");
    if (!label || !label.trim()) return;
    const name = label.trim();
    const idx = customTpls.findIndex((t) => t.label === name);
    if (idx >= 0 && !confirm(`이미 있는 “${name}” 템플릿을 현재 본문으로 덮어쓸까요?`)) return;
    const item: CustomTemplate = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, label: name, html: form.content };
    const next = idx >= 0 ? customTpls.map((t, i) => (i === idx ? { ...item, id: t.id } : t)) : [...customTpls, item];
    writeLocalTpls(next);
    setCustomTpls(next);
    showMsg(`“${name}” 템플릿을 저장했습니다.`, true);
  }
  function deleteTpl(t: CustomTemplate) {
    if (!confirm(`템플릿 “${t.label}”을(를) 삭제할까요?`)) return;
    const next = customTpls.filter((x) => x.id !== t.id);
    writeLocalTpls(next);
    setCustomTpls(next);
  }

  // ── 주제 키워드 · 해시태그(SEO) ─────────────────────────────
  const [tagInput, setTagInput] = useState("");
  // 제목·본문·카테고리에서 자동 추천(이미 고른 건 제외)
  const recoTags = useMemo(() => {
    if (!form) return [] as string[];
    return recommendTags({ title: form.title, content: form.content, category: form.category })
      .filter((t) => !form.tags.includes(t));
  }, [form]);
  function normTag(s: string) { return s.replace(/^#+/, "").replace(/\s+/g, " ").trim(); }
  function addTag(raw: string) {
    const t = normTag(raw);
    if (!t || !form) return;
    if (form.tags.includes(t)) return;
    if (form.tags.length >= MAX_TAGS) { showMsg(`해시태그는 최대 ${MAX_TAGS}개까지 넣을 수 있습니다.`, false); return; }
    set("tags", [...form.tags, t]);
  }
  function removeTag(t: string) { if (form) set("tags", form.tags.filter((x) => x !== t)); }
  function onTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); setTagInput(""); }
    else if (e.key === "Backspace" && !tagInput && form?.tags.length) { removeTag(form.tags[form.tags.length - 1]); }
  }

  function showMsg(text: string, ok: boolean) { setMsg({ text, ok }); if (ok) setTimeout(() => setMsg(null), 3000); }
  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((f) => (f ? { ...f, [k]: v } : f)); }
  function enterNew() { setForm({ ...EMPTY }); setMsg(null); }
  function enterEdit(p: Post) {
    setForm({ id: p.id, title: p.title || "", category: p.category || "", author: p.author || "", cover_url: p.cover_url || "", excerpt: p.excerpt || "", content: p.content || "", published: p.published !== false, tags: Array.isArray(p.tags) ? p.tags : [], slug: p.slug || "", meta_title: p.meta_title || "", meta_description: p.meta_description || "" });
    setMsg(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeForm() { setForm(null); setMsg(null); }

  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { showMsg("이미지 파일만 업로드할 수 있습니다.", false); e.target.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { showMsg("이미지는 5MB 이하만 업로드할 수 있습니다.", false); e.target.value = ""; return; }
    setUploadingCover(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `cover-${new Date().toISOString().replace(/[^0-9]/g, "")}.${ext}`;
      const up = await supabase.storage.from("blog-covers").upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("blog-covers").getPublicUrl(path);
      set("cover_url", data.publicUrl); showMsg("커버 이미지가 업로드되었습니다.", true);
    } catch (err) { console.error("cover upload failed:", err); showMsg("이미지 업로드에 실패했습니다.", false); }
    finally { setUploadingCover(false); e.target.value = ""; }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!form) return;
    if (!form.title.trim() || !form.content.trim()) { showMsg("제목과 본문은 필수입니다.", false); return; }
    const slug = form.slug.trim() || null;
    if (slug && !/^[\w가-힣-]+$/.test(slug)) { showMsg("URL slug는 한글·영문·숫자·하이픈만 사용하세요.", false); return; }
    const payload: Record<string, unknown> = {
      title: form.title.trim(), category: form.category.trim() || null, author: form.author.trim() || null,
      cover_url: form.cover_url.trim() || null, excerpt: form.excerpt.trim() || null, content: form.content, published: form.published,
      tags: form.tags.length ? form.tags : null,
      slug, meta_title: form.meta_title.trim() || null, meta_description: form.meta_description.trim() || null,
    };
    setSaving(true);
    try {
      const run = (body: Record<string, unknown>) =>
        form.id
          ? supabase.from("posts").update({ ...body, updated_at: new Date().toISOString() }).eq("id", form.id)
          : supabase.from("posts").insert(body);
      let res = await run(payload);
      // slug 중복이면 명확히 안내
      if (res.error && /duplicate|unique/i.test(`${res.error.message} ${res.error.details || ""}`) && /slug/i.test(`${res.error.message} ${res.error.details || ""}`)) {
        showMsg("이미 사용 중인 URL slug입니다. 다른 값으로 바꿔 주세요.", false); setSaving(false); return;
      }
      // 새 컬럼(tags/slug/meta_*)이 아직 없으면(마이그레이션 전) 해당 값만 빼고 다시 저장 — 본문 저장은 막지 않는다.
      if (res.error && /tags|slug|meta_title|meta_description/i.test(`${res.error.message} ${res.error.details || ""}`)) {
        const { tags, slug: _s, meta_title, meta_description, ...rest } = payload; void tags; void _s; void meta_title; void meta_description;
        res = await run(rest);
        if (!res.error) alert("글은 저장됐지만 태그·URL·메타 항목은 보류됐어요.\nSupabase에 마이그레이션(SQL) 적용 후 다시 저장하면 반영됩니다.");
      }
      if (res.error) throw res.error;
      showMsg(form.id ? "수정되었습니다." : "등록되었습니다.", true);
      setForm(null); await load();
    } catch (err) { console.error("save failed:", err); showMsg("저장에 실패했습니다. 권한 또는 입력값을 확인해 주세요.", false); }
    finally { setSaving(false); }
  }

  async function del(p: Post) {
    if (!confirm("“" + p.title + "”을(를) 삭제할까요? 되돌릴 수 없습니다.")) return;
    try {
      const res = await supabase.from("posts").delete().eq("id", p.id);
      if (res.error) throw res.error;
      if (form?.id === p.id) setForm(null);
      await load();
    } catch (err) { console.error("delete failed:", err); alert("삭제에 실패했습니다."); }
  }

  const cats = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <>
      <div className="adm-actions">
        <button className="btn btn-blue" onClick={enterNew}><i className="fa-solid fa-plus"></i> 새 글 작성</button>
        <a className="btn btn-out" href="/blog" target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-arrow-up-right-from-square"></i> 블로그 보기</a>
      </div>

      {form && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2>{isEdit ? "글 수정" : "새 글 작성"}</h2>
          {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="f-title">제목 <span className="req">*</span></label>
              <input type="text" id="f-title" placeholder="글 제목" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f-slug">URL 주소(slug) <span className="hint-inline">검색·공유용 주소 · 비우면 자동 ID 사용</span></label>
              <div className="slug-row">
                <span className="slug-prefix">/blog/</span>
                <input type="text" id="f-slug" placeholder="ai-면접-도입-가이드" value={form.slug}
                  onChange={(e) => set("slug", e.target.value)} onBlur={(e) => set("slug", slugify(e.target.value))} />
                <button type="button" className="btn btn-out btn-sm" onClick={() => set("slug", slugify(form.title))} disabled={!form.title.trim()}>제목에서 생성</button>
              </div>
              <p className="hint">최종 주소: <strong>/blog/{form.slug.trim() || "(자동 ID)"}</strong></p>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="f-category">카테고리</label>
                <input type="text" id="f-category" placeholder="예: AI 면접" list="catList" value={form.category} onChange={(e) => set("category", e.target.value)} />
                <datalist id="catList">{cats.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="field">
                <label htmlFor="f-author">작성자</label>
                <input type="text" id="f-author" placeholder="예: AI면접 팀" value={form.author} onChange={(e) => set("author", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-cover">커버 이미지</label>
              <div className="cover-edit">
                {form.cover_url ? <img className="cover-preview" src={form.cover_url} alt="" /> : <div className="cover-preview empty"><i className="fa-solid fa-image"></i></div>}
                <div className="cover-controls">
                  <label className="btn btn-out" style={{ cursor: uploadingCover ? "default" : "pointer", opacity: uploadingCover ? 0.6 : 1 }}>
                    {uploadingCover ? "업로드 중…" : <><i className="fa-solid fa-arrow-up-from-bracket"></i> 이미지 업로드</>}
                    <input type="file" accept="image/*" hidden onChange={onCoverUpload} disabled={uploadingCover} />
                  </label>
                  {form.cover_url && <button type="button" className="btn btn-out" onClick={() => set("cover_url", "")}>제거</button>}
                </div>
              </div>
              <input type="url" id="f-cover" placeholder="또는 이미지 URL 직접 입력 (https://...)" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f-excerpt">요약</label>
              <input type="text" id="f-excerpt" placeholder="리스트에 보일 한 줄 요약" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </div>
            <details className="seo-box">
              <summary>SEO 검색 노출 설정 <span className="hint-inline">비우면 제목·요약을 그대로 사용</span></summary>
              <div className="field">
                <label htmlFor="f-mtitle">검색 제목(meta title)</label>
                <input type="text" id="f-mtitle" placeholder="비우면 글 제목 사용 · 검색결과에 뜨는 제목" value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
                <p className="hint">{(form.meta_title || form.title).length}자 · 25~35자 권장</p>
              </div>
              <div className="field">
                <label htmlFor="f-mdesc">검색 설명(meta description)</label>
                <textarea id="f-mdesc" rows={2} placeholder="비우면 요약 사용 · 검색결과에 뜨는 설명문" value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} />
                <p className="hint">{(form.meta_description || form.excerpt).length}자 · 50~80자 권장</p>
              </div>
            </details>
            <div className="field">
              <label>주제 키워드 · 해시태그 <span className="hint-inline">검색 노출(SEO)용 · 3~5개 권장, 최대 {MAX_TAGS}개</span></label>
              <div className="tag-box">
                {form.tags.map((t) => (
                  <span className="tag-chip on" key={t}>
                    #{t}
                    <button type="button" title="제거" aria-label={`${t} 제거`} onClick={() => removeTag(t)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-input"
                  placeholder={form.tags.length ? "추가…" : "키워드 입력 후 Enter (예: AI면접)"}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKey}
                  onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(""); } }}
                />
              </div>
              <div className="tag-reco">
                <span className="tag-reco-head"><i className="fa-solid fa-wand-magic-sparkles"></i> 추천 키워드</span>
                {recoTags.length === 0
                  ? <span className="tag-reco-empty">제목·본문을 입력하면 키워드를 추천해 드려요.</span>
                  : recoTags.map((t) => (
                      <button type="button" className="tag-chip" key={t} onClick={() => addTag(t)}>#{t}</button>
                    ))}
              </div>
            </div>
            <div className="field">
              <label>본문 <span className="req">*</span></label>
              <RichEditor
                key={form.id || "new"}
                value={renderBody(form.content)}
                onChange={(html) => set("content", html)}
                placeholder="본문을 입력하세요. 위 도구로 제목·목록·표·이미지 등을 넣을 수 있습니다."
                templates={allTemplates}
              />
              <div className="tpl-manage">
                <button type="button" className="btn btn-out btn-sm" onClick={saveAsTemplate}>
                  <i className="fa-solid fa-bookmark"></i> 현재 글을 템플릿으로 저장
                </button>
                {customTpls.length > 0 && (
                  <div className="tpl-chips">
                    <span className="tpl-chips-label">내 템플릿</span>
                    {customTpls.map((t) => (
                      <span className="tpl-chip" key={t.id}>
                        {t.label}
                        <button type="button" title="삭제" onClick={() => deleteTpl(t)} aria-label={`${t.label} 삭제`}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="hint">상단 도구의 <strong>📄 템플릿</strong>에서 기본 템플릿과 내 템플릿을 불러올 수 있습니다.</p>
            </div>
            <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> 공개(게시) — 해제 시 비공개(임시저장)</label>
            <div className="form-actions">
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}</button>
              <button type="button" className="btn btn-out" onClick={() => setPreview(true)}><i className="fa-solid fa-eye"></i> 미리보기</button>
              <button type="button" className="btn btn-out" onClick={closeForm}>취소</button>
            </div>
          </form>
        </div>
      )}

      {preview && form && (
        <div className="adm-modal-bg" onClick={() => setPreview(false)}>
          <div className="adm-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3><i className="fa-solid fa-eye"></i> 미리보기 — 블로그에 표시될 모습</h3>
              <button className="icon-btn" title="닫기" onClick={() => setPreview(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="adm-modal-body">
              <div className="blog-preview">
                <div className="post-head">
                  <span className="cat">{form.category || "기타"}</span>
                  <h1>{form.title || "(제목 없음)"}</h1>
                  <div className="post-meta">
                    {form.author && <span><i className="fa-regular fa-user"></i> {form.author}</span>}
                    <span>{fmtDate(new Date().toISOString())}</span>
                  </div>
                </div>
                {form.cover_url && <img className="post-hero" src={form.cover_url} alt="" />}
                <div className="post-content" dangerouslySetInnerHTML={{ __html: renderBody(form.content) || '<p style="color:var(--slate-2)">본문이 비어 있습니다.</p>' }} />
              </div>
            </div>
            <div className="adm-modal-foot">
              <button className="btn btn-out" onClick={() => setPreview(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      <div className="card list-card">
        <div className="list-head"><h2>등록된 글</h2><span className="count">{posts.length}개</span></div>
        {loadErr ? <div className="list-state">목록을 불러오지 못했습니다.</div> : posts.length === 0 ? (
          <div className="list-state">아직 등록된 글이 없습니다. “새 글 작성”으로 시작해 보세요.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>제목</th><th>상태</th><th>작성일</th><th>수정일</th><th>관리</th></tr></thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td><div className="cell-title">{p.title}</div>{p.category && <div className="cell-sub">{p.category}</div>}</td>
                    <td className="nowrap">{p.published === false ? <span className="pill pill-gray">비공개</span> : <span className="pill pill-green">공개</span>}</td>
                    <td className="nowrap">{fmtDate(p.created_at)}</td>
                    <td className="nowrap">{p.updated_at ? fmtDate(p.updated_at) : "—"}</td>
                    <td className="nowrap">
                      <div className="row-actions">
                        <button className="icon-btn" title="보기" onClick={() => window.open(`/blog/${encodeURIComponent(p.slug || p.id)}`, "_blank")}><i className="fa-solid fa-arrow-up-right-from-square"></i></button>
                        <button className="icon-btn" title="수정" onClick={() => enterEdit(p)}><i className="fa-solid fa-pen"></i></button>
                        <button className="icon-btn del" title="삭제" onClick={() => del(p)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ===================== FAQ 관리 ===================== */

const FAQ_CATS = ["도입", "기능", "보안", "비용", "기타"];
type FaqForm = { id: string; category: string; question: string; answer: string; sort_order: string; published: boolean };
const FAQ_EMPTY: FaqForm = { id: "", category: "도입", question: "", answer: "", sort_order: "", published: true };

function FaqManager() {
  const [items, setItems] = useState<Faq[]>([]);
  const [form, setForm] = useState<FaqForm | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const isEdit = !!form?.id;

  const load = useCallback(async () => {
    try {
      const res = await supabase.from("faq").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (res.error) throw res.error;
      setItems((res.data as Faq[]) || []);
      setLoadErr(null);
    } catch (err) { console.error("faq load failed:", err); setLoadErr("FAQ 목록을 불러오지 못했습니다. faq 테이블 마이그레이션(supabase/admin-setup.sql)이 적용됐는지 확인해 주세요."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function showMsg(text: string, ok: boolean) { setMsg({ text, ok }); if (ok) setTimeout(() => setMsg(null), 3000); }
  function set<K extends keyof FaqForm>(k: K, v: FaqForm[K]) { setForm((f) => (f ? { ...f, [k]: v } : f)); }
  function enterNew() { setForm({ ...FAQ_EMPTY }); setMsg(null); }
  function enterEdit(it: Faq) { setForm({ id: it.id, category: it.category || "기타", question: it.question, answer: it.answer, sort_order: String(it.sort_order ?? ""), published: it.published !== false }); setMsg(null); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function closeForm() { setForm(null); setMsg(null); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!form) return;
    if (!form.question.trim() || !form.answer.trim()) { showMsg("질문과 답변은 필수입니다.", false); return; }
    const order = form.sort_order.trim() === "" ? items.length + 1 : Number(form.sort_order);
    const payload: Record<string, unknown> = { category: form.category || null, question: form.question.trim(), answer: form.answer.trim(), sort_order: Number.isFinite(order) ? order : 0, published: form.published };
    setSaving(true);
    try {
      let res;
      if (form.id) { payload.updated_at = new Date().toISOString(); res = await supabase.from("faq").update(payload).eq("id", form.id); }
      else { res = await supabase.from("faq").insert(payload); }
      if (res.error) throw res.error;
      showMsg(form.id ? "수정되었습니다." : "등록되었습니다.", true); setForm(null); await load();
    } catch (err) { console.error("faq save failed:", err); showMsg("저장에 실패했습니다. 관리자 권한 또는 마이그레이션 적용을 확인해 주세요.", false); }
    finally { setSaving(false); }
  }

  async function del(it: Faq) {
    if (!confirm("이 FAQ를 삭제할까요? 되돌릴 수 없습니다.\n\n" + it.question)) return;
    try { const res = await supabase.from("faq").delete().eq("id", it.id); if (res.error) throw res.error; if (form?.id === it.id) setForm(null); await load(); }
    catch (err) { console.error("faq delete failed:", err); alert("삭제에 실패했습니다."); }
  }

  // 정렬 순서 변경: 인접 항목과 sort_order 교환
  async function move(idx: number, dir: -1 | 1) {
    const a = items[idx], b = items[idx + dir];
    if (!a || !b) return;
    try {
      await supabase.from("faq").update({ sort_order: b.sort_order, updated_at: new Date().toISOString() }).eq("id", a.id);
      await supabase.from("faq").update({ sort_order: a.sort_order, updated_at: new Date().toISOString() }).eq("id", b.id);
      await load();
    } catch (err) { console.error("reorder failed:", err); alert("순서 변경에 실패했습니다."); }
  }

  return (
    <>
      <div className="adm-actions">
        <button className="btn btn-blue" onClick={enterNew}><i className="fa-solid fa-plus"></i> FAQ 추가</button>
      </div>

      {form && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2>{isEdit ? "FAQ 수정" : "새 FAQ 작성"}</h2>
          {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="fa-cat">카테고리</label>
              <select id="fa-cat" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {FAQ_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="hint">{isEdit ? "노출 순서는 아래 목록의 ▲▼ 화살표로 바꿀 수 있어요." : "새 FAQ는 목록 맨 아래에 추가됩니다. 순서는 등록 후 목록의 ▲▼ 화살표로 조정하세요."}</p>
            </div>
            <div className="field">
              <label htmlFor="fa-q">질문 <span className="req">*</span></label>
              <input type="text" id="fa-q" placeholder="예: AI 면접은 어떻게 진행되나요?" value={form.question} onChange={(e) => set("question", e.target.value)} />
            </div>
            <div className="field">
              <label>답변 <span className="req">*</span></label>
              <RichEditor
                key={form.id || "new"}
                value={renderBody(form.answer)}
                onChange={(html) => set("answer", html)}
                placeholder="답변 내용을 입력하세요."
                minHeight={200}
              />
            </div>
            <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> 공개(노출) — 해제 시 비공개</label>
            <div className="form-actions">
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}</button>
              <button type="button" className="btn btn-out" onClick={closeForm}>취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="card list-card">
        <div className="list-head"><h2>등록된 FAQ</h2><span className="count">{items.length}개</span></div>
        {loadErr ? <div className="list-state">{loadErr}</div> : items.length === 0 ? (
          <div className="list-state">아직 등록된 FAQ가 없습니다. “FAQ 추가”로 시작해 보세요.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>정렬</th><th>카테고리</th><th>질문</th><th>노출</th><th>수정일</th><th>관리</th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id}>
                    <td className="nowrap">
                      <div className="ord-ctl">
                        <span className="ord-num">{i + 1}</span>
                        <button className="icon-btn xs" title="위로" disabled={i === 0} onClick={() => move(i, -1)}><i className="fa-solid fa-chevron-up"></i></button>
                        <button className="icon-btn xs" title="아래로" disabled={i === items.length - 1} onClick={() => move(i, 1)}><i className="fa-solid fa-chevron-down"></i></button>
                      </div>
                    </td>
                    <td className="nowrap">{it.category ? <span className="pill pill-blue">{it.category}</span> : "—"}</td>
                    <td><div className="cell-title">{it.question}</div><div className="cell-sub">{stripTags(it.answer).slice(0, 50)}{stripTags(it.answer).length > 50 ? "…" : ""}</div></td>
                    <td className="nowrap">{it.published === false ? <span className="pill pill-gray">비공개</span> : <span className="pill pill-green">공개</span>}</td>
                    <td className="nowrap">{it.updated_at ? fmtDate(it.updated_at) : "—"}</td>
                    <td className="nowrap"><div className="row-actions">
                      <button className="icon-btn" title="수정" onClick={() => enterEdit(it)}><i className="fa-solid fa-pen"></i></button>
                      <button className="icon-btn del" title="삭제" onClick={() => del(it)}><i className="fa-solid fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ===================== 약관(법적 문서) ===================== */

type LegalForm = { id: string; slug: string; title: string; meta: string; body: string; sort_order: string; published: boolean; effective_date: string };
const LEGAL_EMPTY: LegalForm = { id: "", slug: "", title: "", meta: "", body: "", sort_order: "", published: true, effective_date: "" };
const SLUG_RE = /^[a-z0-9-]+$/;

function LegalManager() {
  const [items, setItems] = useState<LegalDoc[]>([]);
  const [form, setForm] = useState<LegalForm | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [versions, setVersions] = useState<LegalVersion[]>([]);
  const [previewVer, setPreviewVer] = useState<LegalVersion | null>(null);
  const isEdit = !!form?.id;
  const isReserved = !!form && !!RESERVED_LEGAL_SLUGS[form.slug];

  // 편집 중인 약관의 버전 이력 불러오기(테이블 미적용 시 조용히 빈 목록)
  const loadVersions = useCallback(async (slug: string) => {
    try {
      const res = await supabase.from("legal_doc_versions").select("*").eq("slug", slug).order("version", { ascending: false });
      if (res.error) throw res.error;
      setVersions((res.data as LegalVersion[]) || []);
    } catch { setVersions([]); }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await supabase.from("legal_docs").select("*").order("sort_order", { ascending: true });
      if (res.error) throw res.error;
      setItems((res.data as LegalDoc[]) || []);
      setLoadErr(null);
    } catch (err) { console.error("legal load failed:", err); setLoadErr("약관 목록을 불러오지 못했습니다. legal_docs 테이블 마이그레이션(supabase/legal-setup.sql)이 적용됐는지 확인해 주세요."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function showMsg(text: string, ok: boolean) { setMsg({ text, ok }); if (ok) setTimeout(() => setMsg(null), 3000); }
  function set<K extends keyof LegalForm>(k: K, v: LegalForm[K]) { setForm((f) => (f ? { ...f, [k]: v } : f)); }
  function enterNew() { setForm({ ...LEGAL_EMPTY }); setVersions([]); setMsg(null); }
  function enterEdit(it: LegalDoc) {
    setForm({ id: it.id, slug: it.slug, title: it.title, meta: it.meta || "", body: it.body, sort_order: String(it.sort_order ?? ""), published: it.published !== false, effective_date: it.effective_date || "" });
    setVersions([]); loadVersions(it.slug);
    setMsg(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeForm() { setForm(null); setVersions([]); setMsg(null); }
  // 과거 버전 내용을 폼에 불러오기(되돌리기) — 저장하면 새 버전으로 기록됨
  function restoreVersion(v: LegalVersion) {
    if (!confirm(`v${v.version} 내용을 편집기로 불러올까요?\n저장하면 새 버전으로 기록됩니다(기존 이력은 보존).`)) return;
    set("title", v.title); set("meta", v.meta || ""); set("body", v.body); set("effective_date", v.effective_date || "");
    setPreviewVer(null); showMsg(`v${v.version} 내용을 불러왔습니다. 확인 후 저장하세요.`, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!form) return;
    const slug = form.slug.trim().toLowerCase();
    if (!slug || !SLUG_RE.test(slug)) { showMsg("slug는 영문 소문자·숫자·하이픈만 사용하세요. (예: marketing-terms)", false); return; }
    if (!form.title.trim() || !form.body.trim()) { showMsg("제목과 본문은 필수입니다.", false); return; }
    const order = form.sort_order.trim() === "" ? items.length + 1 : Number(form.sort_order);
    // 버전 번호 = 이미 쌓인 스냅샷의 최대 + 1 → 첫 저장은 v1, 이후 v2·v3…
    const maxVer = versions.length ? Math.max(...versions.map((v) => v.version)) : 0;
    const newVersion = maxVer + 1;
    const effDate = form.effective_date.trim() || null;
    const base: Record<string, unknown> = { slug, title: form.title.trim(), meta: form.meta.trim() || null, body: form.body, sort_order: Number.isFinite(order) ? order : 0, published: form.published };
    const payload: Record<string, unknown> = { ...base, effective_date: effDate, version: newVersion };
    setSaving(true);
    try {
      const run = (body: Record<string, unknown>) =>
        form.id
          ? supabase.from("legal_docs").update({ ...body, updated_at: new Date().toISOString() }).eq("id", form.id)
          : supabase.from("legal_docs").insert(body);
      let res = await run(payload);
      // effective_date/version 컬럼 미적용 시 해당 값 빼고 재시도(저장은 막지 않음)
      let versioned = true;
      if (res.error && /effective_date|version|column/i.test(`${res.error.message} ${res.error.details || ""}`)) {
        res = await run(base); versioned = false;
      }
      if (res.error) throw res.error;
      // 버전 스냅샷 적재(테이블 미적용이면 조용히 건너뜀)
      if (versioned) {
        try {
          await supabase.from("legal_doc_versions").insert({ slug, version: newVersion, title: form.title.trim(), meta: form.meta.trim() || null, body: form.body, effective_date: effDate });
        } catch { /* 버전 테이블 미적용 — 무시 */ }
      }
      showMsg(form.id ? `수정되었습니다 (v${newVersion}).` : "등록되었습니다 (v1).", true);
      if (!versioned) alert("저장됐지만 버전·시행일은 보류됐어요.\nSupabase에 legal-versioning-setup.sql 적용 후 다시 저장하면 버전 기록이 시작됩니다.");
      setForm(null); setVersions([]); await load();
    } catch (err) {
      console.error("legal save failed:", err);
      const dup = String((err as { message?: string })?.message || "").toLowerCase().includes("duplicate");
      showMsg(dup ? "이미 존재하는 slug입니다." : "저장에 실패했습니다. 관리자 권한 또는 마이그레이션 적용을 확인해 주세요.", false);
    } finally { setSaving(false); }
  }

  async function del(it: LegalDoc) {
    if (!confirm("이 약관을 삭제할까요? 되돌릴 수 없습니다.\n\n" + it.slug)) return;
    try { const res = await supabase.from("legal_docs").delete().eq("id", it.id); if (res.error) throw res.error; if (form?.id === it.id) setForm(null); await load(); }
    catch (err) { console.error("legal delete failed:", err); alert("삭제에 실패했습니다."); }
  }

  return (
    <>
      <div className="adm-actions">
        <button className="btn btn-blue" onClick={enterNew}><i className="fa-solid fa-plus"></i> 약관 추가</button>
      </div>

      {form && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2>{isEdit ? "약관 수정" : "새 약관 작성"}</h2>
          {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
          <form onSubmit={onSubmit} noValidate>
            <div className="field-row">
              <div className="field">
                <label htmlFor="lg-slug">slug(주소) <span className="req">*</span></label>
                <input type="text" id="lg-slug" placeholder="예: marketing-terms" value={form.slug} onChange={(e) => set("slug", e.target.value)} disabled={isReserved} />
                <span className="cf-note">{isReserved ? `예약 약관 — 공개 경로 ${RESERVED_LEGAL_SLUGS[form.slug]} (변경 불가)` : `공개 경로: ${form.slug.trim() ? legalPath(form.slug.trim().toLowerCase()) : "/legal/…"}`}</span>
              </div>
              <div className="field">
                <label htmlFor="lg-o">정렬 순서</label>
                <input type="number" id="lg-o" placeholder="작을수록 위 (비우면 맨 뒤)" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="lg-title">제목 <span className="req">*</span></label>
              <input type="text" id="lg-title" placeholder="예: 개인정보처리방침" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="lg-meta">상단 메타(선택)</label>
                <input type="text" id="lg-meta" placeholder="예: 운영: 주식회사 세컨드팀" value={form.meta} onChange={(e) => set("meta", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="lg-eff">시행일 <span className="hint-inline">버전 기록·공개 표기에 사용</span></label>
                <input type="date" id="lg-eff" value={form.effective_date} onChange={(e) => set("effective_date", e.target.value)} />
              </div>
            </div>
            <MarkdownEditor
              id="lg-body"
              label="본문(마크다운)"
              required
              value={form.body}
              onChange={(v) => set("body", v)}
              placeholder={"## 제1조. 목적\n\n본 약관은 …\n\n## 제2조. 정의\n\n- 첫째 항목\n- 둘째 항목"}
            />
            <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> 공개(노출) — 해제 시 비공개</label>
            <div className="form-actions">
              <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}</button>
              <button type="button" className="btn btn-out" onClick={closeForm}>취소</button>
            </div>
          </form>

          {isEdit && (
            <div className="ver-panel">
              <h3 className="ver-title"><i className="fa-solid fa-clock-rotate-left"></i> 버전 내역 {versions.length > 0 && <span className="count">{versions.length}개</span>}</h3>
              {versions.length === 0 ? (
                <p className="hint">아직 기록된 버전이 없습니다. 저장하면 버전이 쌓이기 시작합니다. (버전 기능은 <code>legal-versioning-setup.sql</code> 적용 필요)</p>
              ) : (
                <ul className="ver-list">
                  {versions.map((v) => (
                    <li key={v.id} className="ver-item">
                      <span className="ver-no">v{v.version}</span>
                      <span className="ver-date">{v.effective_date ? `시행 ${v.effective_date}` : "시행일 미지정"}</span>
                      <span className="ver-at">{v.created_at ? fmtDate(v.created_at) : ""} 저장</span>
                      <span className="ver-acts">
                        <button type="button" className="btn btn-out btn-sm" onClick={() => setPreviewVer(v)}>보기</button>
                        <button type="button" className="btn btn-out btn-sm" onClick={() => restoreVersion(v)}>되돌리기</button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {previewVer && (
        <div className="ver-modal" onClick={() => setPreviewVer(null)}>
          <div className="ver-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ver-modal-head">
              <strong>v{previewVer.version} 미리보기 {previewVer.effective_date ? `· 시행 ${previewVer.effective_date}` : ""}</strong>
              <button type="button" className="icon-btn" aria-label="닫기" onClick={() => setPreviewVer(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="ver-modal-body">
              <h2 dangerouslySetInnerHTML={{ __html: previewVer.title }} />
              {previewVer.meta && <p className="ver-modal-meta">{previewVer.meta}</p>}
              <div className="md-preview-body post-content" dangerouslySetInnerHTML={{ __html: renderBody(previewVer.body) }} />
            </div>
            <div className="ver-modal-foot">
              <button type="button" className="btn btn-blue btn-sm" onClick={() => restoreVersion(previewVer)}>이 버전으로 되돌리기</button>
              <button type="button" className="btn btn-out btn-sm" onClick={() => setPreviewVer(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      <div className="card list-card">
        <div className="list-head"><h2>등록된 약관</h2><span className="count">{items.length}개</span></div>
        {loadErr ? <div className="list-state">{loadErr}</div> : items.length === 0 ? (
          <div className="list-state">아직 등록된 약관이 없습니다. “약관 추가”로 시작하거나, 마이그레이션(supabase/legal-setup.sql)으로 기존 약관을 시드하세요.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>정렬</th><th>제목</th><th>공개 경로</th><th>노출</th><th>수정일</th><th>관리</th></tr></thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="nowrap">{it.sort_order}</td>
                    <td><div className="cell-title" dangerouslySetInnerHTML={{ __html: it.title }} /><div className="cell-sub">{it.slug}{RESERVED_LEGAL_SLUGS[it.slug] ? " · 예약" : ""}{it.version ? ` · v${it.version}` : ""}{it.effective_date ? ` · 시행 ${it.effective_date}` : ""}</div></td>
                    <td className="nowrap"><a href={legalPath(it.slug)} target="_blank" rel="noopener noreferrer">{legalPath(it.slug)}</a></td>
                    <td className="nowrap">{it.published === false ? <span className="pill pill-gray">비공개</span> : <span className="pill pill-green">공개</span>}</td>
                    <td className="nowrap">{it.updated_at ? fmtDate(it.updated_at) : "—"}</td>
                    <td className="nowrap"><div className="row-actions">
                      <button className="icon-btn" title="수정" onClick={() => enterEdit(it)}><i className="fa-solid fa-pen"></i></button>
                      <button className="icon-btn del" title="삭제" onClick={() => del(it)}><i className="fa-solid fa-trash"></i></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ===================== AI 면접 서비스 소개서 ===================== */

function BrochureSection() {
  return (
    <>
      <BrochureManager />
      <LeadTable table="brochure_requests" title="소개서 신청 리드" empty="아직 소개서를 신청한 리드가 없습니다." filename="brochure-requests" />
    </>
  );
}

function fmtBytes(n?: number) { if (!n) return "—"; if (n < 1024) return n + " B"; if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB"; return (n / 1024 / 1024).toFixed(1) + " MB"; }

function BrochureManager() {
  const [cur, setCur] = useState<{ label: string; path: string; created_at?: string } | null>(null);
  const [size, setSize] = useState<number | undefined>();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("brochure_files").select("label, path, created_at").eq("is_current", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setCur(data ?? null);
    if (data?.path) {
      try {
        const list = await supabase.storage.from("brochures").list("", { search: data.path });
        const f = list.data?.find((x) => x.name === data.path);
        setSize((f?.metadata as { size?: number } | undefined)?.size);
      } catch { setSize(undefined); }
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openSigned(download: boolean) {
    if (!cur?.path) return;
    const { data, error } = await supabase.storage.from("brochures").createSignedUrl(cur.path, 120, download ? { download: cur.label || true } : undefined);
    if (error || !data) { setMsg({ text: "링크 생성에 실패했습니다. 관리자 권한을 확인해 주세요.", ok: false }); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== "application/pdf") { setMsg({ text: "PDF 파일만 업로드할 수 있습니다.", ok: false }); e.target.value = ""; return; }
    setBusy(true); setMsg(null);
    try {
      const path = `aiview-brochure-${new Date().toISOString().replace(/[^0-9]/g, "")}.pdf`;
      const up = await supabase.storage.from("brochures").upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (up.error) throw up.error;
      await supabase.from("brochure_files").update({ is_current: false }).eq("is_current", true);
      const ins = await supabase.from("brochure_files").insert({ label: file.name, path, is_current: true });
      if (ins.error) throw ins.error;
      setMsg({ text: "소개서가 등록(교체)되었습니다. 이제 잠재고객 회사 이메일로 자동 전송됩니다.", ok: true });
      await load();
    } catch (err) { console.error("brochure upload failed:", err); setMsg({ text: "업로드에 실패했습니다. 관리자 권한 또는 파일을 확인해 주세요.", ok: false }); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function unpublish() {
    if (!cur) return;
    if (!confirm("현재 소개서를 내릴까요? 내리면 신청자에게 더 이상 전송되지 않습니다.")) return;
    try { await supabase.from("brochure_files").update({ is_current: false }).eq("is_current", true); setMsg({ text: "현재 소개서를 내렸습니다. 새 PDF를 업로드해 주세요.", ok: true }); await load(); }
    catch (err) { console.error(err); setMsg({ text: "처리에 실패했습니다.", ok: false }); }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2>현재 노출 중인 소개서</h2>
      {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      {cur ? (
        <div className="bro-current">
          <div className="bro-file">
            <div className="bro-file-ic"><i className="fa-solid fa-file-pdf"></i></div>
            <div className="bro-file-meta">
              <div className="bro-file-name">{cur.label}</div>
              <div className="bro-file-sub">업로드 {cur.created_at ? fmtDate(cur.created_at) : "—"} · {fmtBytes(size)} · <span className="pill pill-green">노출 중</span></div>
            </div>
          </div>
          <div className="bro-file-actions">
            <button className="btn btn-out" onClick={() => openSigned(false)}><i className="fa-solid fa-eye"></i> 현재 소개서 보기</button>
            <button className="btn btn-out" onClick={() => openSigned(true)}><i className="fa-solid fa-download"></i> 다운로드</button>
            <button className="btn btn-out del-out" onClick={unpublish}><i className="fa-solid fa-ban"></i> 내리기</button>
          </div>
        </div>
      ) : (
        <div className="list-state" style={{ padding: "30px 0" }}>현재 노출 중인 소개서가 없습니다. 아래에서 PDF를 업로드하세요.</div>
      )}
      <div className="bro-upload">
        <label className="btn btn-blue" style={{ cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "업로드 중…" : <><i className="fa-solid fa-arrow-up-from-bracket"></i> {cur ? "PDF 교체 업로드" : "PDF 업로드"}</>}
          <input type="file" accept="application/pdf" hidden onChange={onUpload} disabled={busy} />
        </label>
        <div className="hint">잠재고객이 회사 이메일을 입력하면 현재 노출 중인 PDF의 보안 링크(7일 만료)가 이메일로 자동 전송됩니다.</div>
      </div>
    </div>
  );
}

/* ===================== 도입문의 관리 ===================== */

function StatusBadge({ value }: { value?: string | null }) {
  const v = value || "신규";
  const cls = v === "완료" ? "pill-green" : v === "상담 진행" ? "pill-blue" : v === "확인 완료" ? "pill-sky" : v === "보류" ? "pill-gray" : "pill-amber";
  return <span className={`pill ${cls}`}>{v}</span>;
}

const PERIODS = [{ k: "all", l: "전체" }, { k: "today", l: "오늘" }, { k: "7", l: "7일" }, { k: "30", l: "30일" }] as const;
const SIZE_LABEL: Record<string, string> = { "1-10": "1~10명", "11-50": "11~50명", "51-200": "51~200명", "200+": "200명 이상" };

function SignupsManager() {
  const [rows, setRows] = useState<Signup[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFStatus] = useState("all");
  const [fPeriod, setFPeriod] = useState<string>("all");
  const [fSize, setFSize] = useState("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Signup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.from("signups").select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setRows((res.data as Signup[]) || []); setLoadErr(null);
    } catch (err) { console.error("signups load failed:", err); setLoadErr("목록을 불러오지 못했습니다. 관리자 읽기 권한(RLS) 마이그레이션(supabase/admin-setup.sql)이 적용됐는지 확인해 주세요."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function updateRow(id: string, patch: Partial<Signup>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d));
    const res = await supabase.from("signups").update(patch).eq("id", id);
    if (res.error) { console.error("update failed:", res.error); alert("저장에 실패했습니다. 관리자 권한을 확인해 주세요."); await load(); }
  }

  const filtered = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => {
      if (fStatus !== "all" && (r.status || "신규") !== fStatus) return false;
      if (fSize !== "all" && (r.size || "") !== fSize) return false;
      if (fPeriod !== "all") {
        const days = fPeriod === "today" ? 1 : Number(fPeriod);
        const cutoff = fPeriod === "today" ? new Date(new Date().setHours(0, 0, 0, 0)).getTime() : now - days * 86400000;
        if (new Date(r.created_at).getTime() < cutoff) return false;
      }
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        if (![r.name, r.company, r.email].some((v) => (v || "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [rows, fStatus, fSize, fPeriod, q]);

  function exportCsv() {
    const head = ["접수일시", "이름", "회사", "이메일", "직무/직책", "연락처", "채용규모", "상태", "문의내용", "내부메모"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = filtered.map((r) => [fmtDateTime(r.created_at), r.name, r.company, r.email, r.role ?? "", r.phone ?? "", r.size ?? "", r.status ?? "신규", r.memo ?? "", r.admin_note ?? ""].map(esc).join(","));
    const csv = "﻿" + [head.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="adm-filters">
        <div className="filt">
          <label>상태</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">전체</option>
            {SIGNUP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filt">
          <label>기간</label>
          <select value={fPeriod} onChange={(e) => setFPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}</select>
        </div>
        <div className="filt">
          <label>채용 규모</label>
          <select value={fSize} onChange={(e) => setFSize(e.target.value)}>
            <option value="all">전체</option>
            {Object.entries(SIZE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="filt grow">
          <label>검색</label>
          <input type="search" placeholder="이름·회사명·이메일" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {filtered.length > 0 && <button className="btn btn-out" style={{ alignSelf: "flex-end" }} onClick={exportCsv}><i className="fa-solid fa-file-csv"></i> CSV</button>}
      </div>

      <div className="card list-card">
        <div className="list-head"><h2>도입문의 접수 내역</h2><span className="count">{filtered.length} / {rows.length}건</span></div>
        {loading ? <div className="list-state"><i className="fa-solid fa-spinner fa-spin"></i> 불러오는 중…</div>
          : loadErr ? <div className="list-state">{loadErr}</div>
          : rows.length === 0 ? <div className="list-state">아직 접수된 도입문의가 없습니다.</div>
          : filtered.length === 0 ? <div className="list-state">조건에 맞는 문의가 없습니다.</div>
          : (
            <>
              {/* 데스크톱: 표 */}
              <div className="adm-table-wrap sig-table">
                <table className="adm-table">
                  <thead><tr><th>접수일</th><th>이름</th><th>회사명</th><th>업무 이메일</th><th>직무/직책</th><th>채용 규모</th><th>상태</th><th>관리</th></tr></thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id}>
                        <td className="nowrap">{fmtDate(r.created_at)}</td>
                        <td className="nowrap">{r.name}</td>
                        <td>{r.company}</td>
                        <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                        <td>{r.role || "—"}</td>
                        <td className="nowrap">{r.size ? (SIZE_LABEL[r.size] || r.size) : "—"}</td>
                        <td className="nowrap">
                          <select className="status-sel" value={r.status || "신규"} onChange={(e) => updateRow(r.id, { status: e.target.value })}>
                            {SIGNUP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="nowrap"><button className="icon-btn" title="상세" onClick={() => setDetail(r)}><i className="fa-solid fa-eye"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 모바일: 카드 리스트 (탭하면 상세) */}
              <div className="sig-cards">
                {filtered.map((r) => (
                  <div key={r.id} className="sig-card" onClick={() => setDetail(r)}>
                    <div className="sig-card-head">
                      <span className="sig-card-co">{r.company}</span>
                      <StatusBadge value={r.status} />
                    </div>
                    <div className="sig-card-sub">{r.name}{r.role ? ` · ${r.role}` : ""}{r.size ? ` · ${SIZE_LABEL[r.size] || r.size}` : ""}</div>
                    <div className="sig-card-date">{fmtDate(r.created_at)} 접수</div>
                    <div className="sig-card-acts" onClick={(e) => e.stopPropagation()}>
                      {r.phone && <a className="sig-act" href={`tel:${r.phone}`}><i className="fa-solid fa-phone"></i> 전화</a>}
                      <a className="sig-act" href={`mailto:${r.email}`}><i className="fa-solid fa-envelope"></i> 메일</a>
                      <select className="status-sel" value={r.status || "신규"} onChange={(e) => updateRow(r.id, { status: e.target.value })}>
                        {SIGNUP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
      </div>

      {detail && <SignupDetail row={detail} onClose={() => setDetail(null)} onSave={updateRow} />}
    </>
  );
}

function SignupDetail({ row, onClose, onSave }: { row: Signup; onClose: () => void; onSave: (id: string, patch: Partial<Signup>) => void | Promise<void> }) {
  const [status, setStatus] = useState(row.status || "신규");
  const [note, setNote] = useState(row.admin_note || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(row.id, { status, admin_note: note.trim() || null });
    setSaving(false);
    onClose();
  }

  const fields: [string, string][] = [
    ["이름", row.name], ["회사명", row.company], ["업무 이메일", row.email],
    ["연락처", row.phone || "—"], ["직무/직책", row.role || "—"],
    ["연간 채용 규모", row.size ? (SIZE_LABEL[row.size] || row.size) : "—"],
    ["개인정보 동의", "동의 (필수 동의 후 접수)"], ["접수일시", fmtDateTime(row.created_at)],
  ];

  return (
    <div className="adm-modal-bg" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>도입문의 상세</h3>
          <button className="icon-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="adm-modal-body">
          <div className="sig-detail-acts">
            {row.phone && <a className="sig-act" href={`tel:${row.phone}`}><i className="fa-solid fa-phone"></i> 전화하기</a>}
            <a className="sig-act" href={`mailto:${row.email}`}><i className="fa-solid fa-envelope"></i> 메일 보내기</a>
          </div>
          <dl className="detail-grid">
            {fields.map(([k, v]) => (<div key={k} className="detail-row"><dt>{k}</dt><dd>{k === "업무 이메일" ? <a href={`mailto:${v}`}>{v}</a> : v}</dd></div>))}
          </dl>
          <div className="detail-row block"><dt>문의 메모</dt><dd className="memo-box">{row.memo || "—"}</dd></div>
          <div className="field" style={{ marginTop: 16 }}>
            <label>상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>{SIGNUP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="field">
            <label>내부 메모 <span className="hint" style={{ fontWeight: 400 }}>(관리자만 보임)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 6/22 전화 연결 완료. 7월 대규모 채용 예정. 소개서 전달 필요." style={{ minHeight: 90 }} />
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="btn btn-out" onClick={onClose}>닫기</button>
          <button className="btn btn-blue" onClick={save} disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
        </div>
      </div>
    </div>
  );
}

/* ===================== 리드 테이블 (brochure_requests 읽기 전용) ===================== */

function LeadTable({ table, title, empty, filename }: { table: string; title: string; empty: string; filename: string }) {
  const [rows, setRows] = useState<BrochureRequest[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setRows((res.data as BrochureRequest[]) || []); setLoadErr(null);
    } catch (err) { console.error(`${table} load failed:`, err); setLoadErr("목록을 불러오지 못했습니다. 관리자 읽기 권한(RLS) 마이그레이션이 적용됐는지 확인해 주세요."); }
    finally { setLoading(false); }
  }, [table]);
  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    const head = ["접수일시", "이름", "회사", "이메일", "직무/직책", "연락처", "채용규모"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) => [fmtDateTime(r.created_at), r.name, r.company, r.email, r.role ?? "", r.phone ?? "", r.size ?? ""].map(esc).join(","));
    const csv = "﻿" + [head.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="card list-card">
      <div className="list-head">
        <h2>{title}</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="count">{rows.length}건</span>
          {rows.length > 0 && <button className="btn btn-out" onClick={exportCsv}><i className="fa-solid fa-file-csv"></i> CSV</button>}
        </div>
      </div>
      {loading ? <div className="list-state"><i className="fa-solid fa-spinner fa-spin"></i> 불러오는 중…</div>
        : loadErr ? <div className="list-state">{loadErr}</div>
        : rows.length === 0 ? <div className="list-state">{empty}</div>
        : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>접수일</th><th>이름</th><th>회사</th><th>이메일</th><th>직무/직책</th><th>연락처</th><th>채용규모</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">{fmtDate(r.created_at)}</td>
                    <td className="nowrap">{r.name}</td>
                    <td>{r.company}</td>
                    <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td>{r.role || "—"}</td>
                    <td className="nowrap">{r.phone || "—"}</td>
                    <td className="nowrap">{r.size ? (SIZE_LABEL[r.size] || r.size) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
