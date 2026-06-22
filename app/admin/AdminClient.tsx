"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Post, type Faq, type Signup, type BrochureRequest } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";

type Section = "blog" | "faq" | "brochure" | "signups";

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
            <button type="submit" className="btn btn-blue" disabled={busy}>
              {busy ? "로그인 중…" : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const NAV: { key: Section; label: string; icon: string }[] = [
  { key: "blog", label: "블로그", icon: "fa-feather" },
  { key: "faq", label: "FAQ", icon: "fa-circle-question" },
  { key: "brochure", label: "서비스소개서", icon: "fa-file-pdf" },
  { key: "signups", label: "도입문의", icon: "fa-inbox" },
];

const SECTION_DESC: Record<Section, string> = {
  blog: "블로그 글을 등록·수정·삭제합니다.",
  faq: "랜딩 FAQ를 추가·수정·삭제합니다. 변경은 잠시 후 사이트에 반영됩니다.",
  brochure: "서비스소개서 PDF를 관리하고, 소개서를 신청한 리드를 확인합니다.",
  signups: "도입문의(상담 신청) 접수 내역을 확인합니다.",
};

function Console({ email }: { email: string }) {
  const [section, setSection] = useState<Section>("blog");
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="adm">
      <aside className={`adm-side${navOpen ? " open" : ""}`}>
        <div className="adm-brand">
          <img src="/supercoder-nav.svg" alt="Supercoder" />
          <span className="adm-badge">ADMIN</span>
        </div>
        <nav className="adm-nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={section === n.key ? "active" : ""}
              onClick={() => { setSection(n.key); setNavOpen(false); }}
            >
              <i className={`fa-solid ${n.icon}`}></i> {n.label}
            </button>
          ))}
        </nav>
        <div className="adm-side-foot">
          <div className="adm-email" title={email}>{email}</div>
          <Link href="/" className="btn btn-out" target="_blank"><i className="fa-solid fa-arrow-up-right-from-square"></i> 사이트 보기</Link>
          <button type="button" className="btn btn-out" onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </div>
      </aside>

      <div className="adm-main">
        <div className="adm-bar">
          <button type="button" className="adm-burger" aria-label="메뉴" onClick={() => setNavOpen((v) => !v)}>
            <i className="fa-solid fa-bars"></i>
          </button>
          <div>
            <h1>{NAV.find((n) => n.key === section)?.label}</h1>
            <div className="sub">{SECTION_DESC[section]}</div>
          </div>
        </div>

        <div className="adm-body">
          {section === "blog" && <BlogManager />}
          {section === "faq" && <FaqManager />}
          {section === "brochure" && <BrochureSection />}
          {section === "signups" && <SignupsList />}
        </div>
      </div>
    </div>
  );
}

/* ===================== 블로그 ===================== */

type FormState = {
  id: string;
  title: string;
  category: string;
  author: string;
  cover_url: string;
  excerpt: string;
  content: string;
  published: boolean;
};
const EMPTY: FormState = { id: "", title: "", category: "", author: "", cover_url: "", excerpt: "", content: "", published: true };

function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const isEdit = form.id !== "";

  const load = useCallback(async () => {
    try {
      const res = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setPosts((res.data as Post[]) || []);
      setLoadErr(false);
    } catch (err) {
      console.error("list load failed:", err);
      setLoadErr(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok });
    if (ok) setTimeout(() => setMsg(null), 3000);
  }
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function enterEdit(p: Post) {
    setForm({
      id: p.id, title: p.title || "", category: p.category || "", author: p.author || "",
      cover_url: p.cover_url || "", excerpt: p.excerpt || "", content: p.content || "", published: p.published !== false,
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetForm() { setForm(EMPTY); setMsg(null); }

  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showMsg("이미지 파일만 업로드할 수 있습니다.", false); e.target.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { showMsg("이미지는 5MB 이하만 업로드할 수 있습니다.", false); e.target.value = ""; return; }
    setUploadingCover(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `cover-${new Date().toISOString().replace(/[^0-9]/g, "")}.${ext}`;
      const up = await supabase.storage.from("blog-covers").upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("blog-covers").getPublicUrl(path);
      set("cover_url", data.publicUrl);
      showMsg("커버 이미지가 업로드되었습니다.", true);
    } catch (err) {
      console.error("cover upload failed:", err);
      showMsg("이미지 업로드에 실패했습니다. 관리자 권한 또는 파일을 확인해 주세요.", false);
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { showMsg("제목과 본문은 필수입니다.", false); return; }
    const payload: Record<string, unknown> = {
      title: form.title.trim(), category: form.category.trim() || null, author: form.author.trim() || null,
      cover_url: form.cover_url.trim() || null, excerpt: form.excerpt.trim() || null, content: form.content, published: form.published,
    };
    setSaving(true);
    try {
      let res;
      if (form.id) {
        payload.updated_at = new Date().toISOString();
        res = await supabase.from("posts").update(payload).eq("id", form.id);
      } else {
        res = await supabase.from("posts").insert(payload);
      }
      if (res.error) throw res.error;
      showMsg(form.id ? "수정되었습니다." : "등록되었습니다.", true);
      resetForm();
      await load();
    } catch (err) {
      console.error("save failed:", err);
      showMsg("저장에 실패했습니다. 권한(관리자 인증) 또는 입력값을 확인해 주세요.", false);
    } finally {
      setSaving(false);
    }
  }

  async function del(p: Post) {
    if (!confirm("“" + p.title + "”을(를) 삭제할까요? 되돌릴 수 없습니다.")) return;
    try {
      const res = await supabase.from("posts").delete().eq("id", p.id);
      if (res.error) throw res.error;
      if (form.id === p.id) resetForm();
      await load();
    } catch (err) {
      console.error("delete failed:", err);
      alert("삭제에 실패했습니다.");
    }
  }

  const cats = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <div className="admin-grid">
      <div className="card">
        <h2 id="formTitle">{isEdit ? "글 수정" : "새 글 작성"}</h2>
        {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="f-title">제목 <span className="req">*</span></label>
            <input type="text" id="f-title" placeholder="글 제목" value={form.title} onChange={(e) => set("title", e.target.value)} />
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
              {form.cover_url ? (
                <img className="cover-preview" src={form.cover_url} alt="" />
              ) : (
                <div className="cover-preview empty"><i className="fa-solid fa-image"></i></div>
              )}
              <div className="cover-controls">
                <label className="btn btn-out" style={{ cursor: uploadingCover ? "default" : "pointer", opacity: uploadingCover ? 0.6 : 1 }}>
                  {uploadingCover ? "업로드 중…" : <><i className="fa-solid fa-arrow-up-from-bracket"></i> 이미지 업로드</>}
                  <input type="file" accept="image/*" hidden onChange={onCoverUpload} disabled={uploadingCover} />
                </label>
                {form.cover_url && <button type="button" className="btn btn-out" onClick={() => set("cover_url", "")}>제거</button>}
              </div>
            </div>
            <input type="url" id="f-cover" placeholder="또는 이미지 URL 직접 입력 (https://...)" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            <div className="hint">이미지를 업로드하거나 URL을 직접 입력하세요. 비워두면 기본 그라데이션 썸네일이 표시됩니다. (5MB 이하)</div>
          </div>
          <div className="field">
            <label htmlFor="f-excerpt">요약</label>
            <input type="text" id="f-excerpt" placeholder="리스트에 보일 한 줄 요약" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-content">본문 <span className="req">*</span></label>
            <textarea id="f-content" placeholder="본문을 입력하세요. 빈 줄로 문단을 나눕니다." value={form.content} onChange={(e) => set("content", e.target.value)} />
          </div>
          <label className="check">
            <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> 공개(게시)
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}</button>
            {isEdit && <button type="button" className="btn btn-out" onClick={resetForm}>취소</button>}
          </div>
        </form>
      </div>

      <div className="card list-card">
        <div className="list-head"><h2>등록된 글</h2><span className="count">{posts.length}개</span></div>
        <div>
          {loadErr ? (
            <div className="list-state">목록을 불러오지 못했습니다.</div>
          ) : posts.length === 0 ? (
            <div className="list-state">아직 등록된 글이 없습니다. 왼쪽에서 첫 글을 작성해 보세요.</div>
          ) : (
            posts.map((p) => (
              <div className="post-row" key={p.id}>
                {p.cover_url ? <img className="thumb" src={p.cover_url} alt="" /> : <div className="thumb"><i className="fa-solid fa-feather"></i></div>}
                <div className="meta">
                  <div className="t">{p.title}</div>
                  <div className="s">
                    {(p.category || "기타") + " · " + fmtDate(p.created_at)}
                    {p.published === false && <> · <span className="draft">비공개</span></>}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="보기" onClick={() => window.open(`/blog/${encodeURIComponent(p.id)}`, "_blank")}><i className="fa-solid fa-arrow-up-right-from-square"></i></button>
                  <button className="icon-btn" title="수정" onClick={() => enterEdit(p)}><i className="fa-solid fa-pen"></i></button>
                  <button className="icon-btn del" title="삭제" onClick={() => del(p)}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== FAQ ===================== */

type FaqForm = { id: string; question: string; answer: string; sort_order: string; published: boolean };
const FAQ_EMPTY: FaqForm = { id: "", question: "", answer: "", sort_order: "", published: true };

function FaqManager() {
  const [items, setItems] = useState<Faq[]>([]);
  const [form, setForm] = useState<FaqForm>(FAQ_EMPTY);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const isEdit = form.id !== "";

  const load = useCallback(async () => {
    try {
      const res = await supabase.from("faq").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (res.error) throw res.error;
      setItems((res.data as Faq[]) || []);
      setLoadErr(null);
    } catch (err) {
      console.error("faq load failed:", err);
      setLoadErr("FAQ 목록을 불러오지 못했습니다. faq 테이블 마이그레이션(supabase/admin-setup.sql)이 적용됐는지 확인해 주세요.");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  function showMsg(text: string, ok: boolean) { setMsg({ text, ok }); if (ok) setTimeout(() => setMsg(null), 3000); }
  function set<K extends keyof FaqForm>(k: K, v: FaqForm[K]) { setForm((f) => ({ ...f, [k]: v })); }
  function enterEdit(it: Faq) {
    setForm({ id: it.id, question: it.question, answer: it.answer, sort_order: String(it.sort_order ?? ""), published: it.published !== false });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetForm() { setForm(FAQ_EMPTY); setMsg(null); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) { showMsg("질문과 답변은 필수입니다.", false); return; }
    const order = form.sort_order.trim() === "" ? (items.length + 1) : Number(form.sort_order);
    const payload: Record<string, unknown> = {
      question: form.question.trim(), answer: form.answer.trim(),
      sort_order: Number.isFinite(order) ? order : 0, published: form.published,
    };
    setSaving(true);
    try {
      let res;
      if (form.id) {
        payload.updated_at = new Date().toISOString();
        res = await supabase.from("faq").update(payload).eq("id", form.id);
      } else {
        res = await supabase.from("faq").insert(payload);
      }
      if (res.error) throw res.error;
      showMsg(form.id ? "수정되었습니다." : "등록되었습니다.", true);
      resetForm();
      await load();
    } catch (err) {
      console.error("faq save failed:", err);
      showMsg("저장에 실패했습니다. 관리자 권한 또는 마이그레이션 적용을 확인해 주세요.", false);
    } finally {
      setSaving(false);
    }
  }

  async function del(it: Faq) {
    if (!confirm("이 FAQ를 삭제할까요? 되돌릴 수 없습니다.\n\n" + it.question)) return;
    try {
      const res = await supabase.from("faq").delete().eq("id", it.id);
      if (res.error) throw res.error;
      if (form.id === it.id) resetForm();
      await load();
    } catch (err) {
      console.error("faq delete failed:", err);
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="admin-grid">
      <div className="card">
        <h2>{isEdit ? "FAQ 수정" : "새 FAQ 작성"}</h2>
        {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="fa-q">질문 <span className="req">*</span></label>
            <input type="text" id="fa-q" placeholder="예: AI 면접은 어떻게 진행되나요?" value={form.question} onChange={(e) => set("question", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fa-a">답변 <span className="req">*</span></label>
            <textarea id="fa-a" placeholder="답변 내용을 입력하세요." value={form.answer} onChange={(e) => set("answer", e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="fa-o">정렬 순서</label>
              <input type="number" id="fa-o" placeholder="작을수록 위에 노출 (비우면 맨 뒤)" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
            </div>
            <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
              <label className="check" style={{ margin: 0 }}>
                <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> 공개(노출)
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}</button>
            {isEdit && <button type="button" className="btn btn-out" onClick={resetForm}>취소</button>}
          </div>
        </form>
      </div>

      <div className="card list-card">
        <div className="list-head"><h2>등록된 FAQ</h2><span className="count">{items.length}개</span></div>
        <div>
          {loadErr ? (
            <div className="list-state">{loadErr}</div>
          ) : items.length === 0 ? (
            <div className="list-state">아직 등록된 FAQ가 없습니다. 왼쪽에서 추가해 보세요.</div>
          ) : (
            items.map((it) => (
              <div className="post-row" key={it.id}>
                <div className="ord">{it.sort_order}</div>
                <div className="meta">
                  <div className="t">{it.question}</div>
                  <div className="s">{it.published === false ? <span className="draft">비공개</span> : "공개"} · {it.answer.slice(0, 48)}{it.answer.length > 48 ? "…" : ""}</div>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="수정" onClick={() => enterEdit(it)}><i className="fa-solid fa-pen"></i></button>
                  <button className="icon-btn del" title="삭제" onClick={() => del(it)}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== 서비스소개서 (PDF 업로드 + 신청 리드) ===================== */

function BrochureSection() {
  return (
    <>
      <BrochureManager />
      <LeadTable
        table="brochure_requests"
        title="소개서 신청 리드"
        empty="아직 소개서를 신청한 리드가 없습니다."
        filename="brochure-requests"
      />
    </>
  );
}

function BrochureManager() {
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("brochure_files").select("path").eq("is_current", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setCurrent(data?.path ?? null);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setMsg({ text: "PDF 파일만 업로드할 수 있습니다.", ok: false }); e.target.value = ""; return; }
    setBusy(true); setMsg(null);
    try {
      const path = `aiview-brochure-${new Date().toISOString().replace(/[^0-9]/g, "")}.pdf`;
      const up = await supabase.storage.from("brochures").upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (up.error) throw up.error;
      await supabase.from("brochure_files").update({ is_current: false }).eq("is_current", true);
      const ins = await supabase.from("brochure_files").insert({ label: file.name, path, is_current: true });
      if (ins.error) throw ins.error;
      setMsg({ text: "소개서가 업로드되었습니다. 이제 잠재고객 회사 이메일로 자동 전송됩니다.", ok: true });
      await load();
    } catch (err) {
      console.error("brochure upload failed:", err);
      setMsg({ text: "업로드에 실패했습니다. 관리자 권한 또는 파일을 확인해 주세요.", ok: false });
    } finally {
      setBusy(false); e.target.value = "";
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2>서비스소개서 (PDF)</h2>
      {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <div className="sub" style={{ fontSize: 13, margin: "4px 0 14px" }}>현재 등록: {current ? <b>{current}</b> : "없음"}</div>
      <label className="btn btn-blue" style={{ cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "업로드 중…" : "소개서 PDF 업로드"}
        <input type="file" accept="application/pdf" hidden onChange={onUpload} disabled={busy} />
      </label>
      <div className="hint" style={{ marginTop: 10 }}>잠재고객이 회사 이메일을 입력하면 이 파일의 보안 링크(7일 만료)가 이메일로 자동 전송됩니다. 화면에는 노출되지 않습니다.</div>
    </div>
  );
}

/* ===================== 도입문의 ===================== */

function SignupsList() {
  return (
    <LeadTable
      table="signups"
      title="도입문의 접수 내역"
      empty="아직 접수된 도입문의가 없습니다."
      filename="signups"
      withMemo
    />
  );
}

/* ===================== 리드 테이블 (signups / brochure_requests 공용) ===================== */

const SIZE_LABEL: Record<string, string> = {
  "1-10": "1~10명", "11-50": "11~50명", "51-200": "51~200명", "200+": "200명 이상",
};

function LeadTable({ table, title, empty, filename, withMemo }: { table: string; title: string; empty: string; filename: string; withMemo?: boolean }) {
  const [rows, setRows] = useState<(Signup | BrochureRequest)[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setRows((res.data as (Signup | BrochureRequest)[]) || []);
      setLoadErr(null);
    } catch (err) {
      console.error(`${table} load failed:`, err);
      setLoadErr("목록을 불러오지 못했습니다. 관리자 읽기 권한(RLS) 마이그레이션(supabase/admin-setup.sql)이 적용됐는지 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [table]);
  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    const head = ["접수일", "이름", "회사", "이메일", "직무/직책", "연락처", "채용규모", ...(withMemo ? ["문의내용"] : [])];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) => {
      const s = r as Signup;
      const base = [r.created_at, s.name, s.company, s.email, s.role ?? "", s.phone ?? "", s.size ?? "", ...(withMemo ? [s.memo ?? ""] : [])];
      return base.map(esc).join(",");
    });
    const csv = "﻿" + [head.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card list-card">
      <div className="list-head">
        <h2>{title}</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="count">{rows.length}건</span>
          {rows.length > 0 && <button type="button" className="btn btn-out" onClick={exportCsv}><i className="fa-solid fa-file-csv"></i> CSV 내보내기</button>}
        </div>
      </div>
      {loading ? (
        <div className="list-state"><i className="fa-solid fa-spinner fa-spin"></i> 불러오는 중…</div>
      ) : loadErr ? (
        <div className="list-state">{loadErr}</div>
      ) : rows.length === 0 ? (
        <div className="list-state">{empty}</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>접수일</th><th>이름</th><th>회사</th><th>이메일</th><th>직무/직책</th><th>연락처</th><th>채용규모</th>{withMemo && <th>문의내용</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = r as Signup;
                return (
                  <tr key={r.id}>
                    <td className="nowrap">{fmtDate(r.created_at)}</td>
                    <td className="nowrap">{s.name}</td>
                    <td>{s.company}</td>
                    <td><a href={`mailto:${s.email}`}>{s.email}</a></td>
                    <td>{s.role || "—"}</td>
                    <td className="nowrap">{s.phone || "—"}</td>
                    <td className="nowrap">{s.size ? (SIZE_LABEL[s.size] || s.size) : "—"}</td>
                    {withMemo && <td className="memo">{s.memo || "—"}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
