"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Post } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";

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
const EMPTY: FormState = {
  id: "",
  title: "",
  category: "",
  author: "",
  cover_url: "",
  excerpt: "",
  content: "",
  published: true,
};

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
  return <Editor email={session.user.email ?? ""} />;
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
          <div className="sub">블로그 관리는 관리자 인증이 필요합니다.</div>
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

function Editor({ email }: { email: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok });
    if (ok) setTimeout(() => setMsg(null), 3000);
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function enterEdit(p: Post) {
    setForm({
      id: p.id,
      title: p.title || "",
      category: p.category || "",
      author: p.author || "",
      cover_url: p.cover_url || "",
      excerpt: p.excerpt || "",
      content: p.content || "",
      published: p.published !== false,
    });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(EMPTY);
    setMsg(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showMsg("제목과 본문은 필수입니다.", false);
      return;
    }
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      category: form.category.trim() || null,
      author: form.author.trim() || null,
      cover_url: form.cover_url.trim() || null,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      published: form.published,
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

  // 카테고리 자동완성
  const cats = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <main className="admin">
      <div className="admin-head">
        <div>
          <h1>블로그 관리</h1>
          <div className="sub">글을 등록·수정·삭제합니다.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="sub" style={{ fontSize: 13 }}>{email}</span>
          <Link href="/blog" className="btn btn-out"><i className="fa-solid fa-arrow-up-right-from-square"></i> 블로그 보기</Link>
          <button type="button" className="btn btn-out" onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </div>
      </div>
      <div className="admin-note"><i className="fa-solid fa-circle-info"></i> 관리자 인증으로 보호되는 페이지입니다. (검색 비노출)</div>

      <BrochureManager />

      <div className="admin-grid">
        {/* 등록/수정 폼 */}
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
                <datalist id="catList">
                  {cats.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="field">
                <label htmlFor="f-author">작성자</label>
                <input type="text" id="f-author" placeholder="예: AI면접 팀" value={form.author} onChange={(e) => set("author", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-cover">커버 이미지 URL</label>
              <input type="url" id="f-cover" placeholder="https://..." value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
              <div className="hint">비워두면 기본 그라데이션 썸네일이 표시됩니다.</div>
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
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}
              </button>
              {isEdit && <button type="button" className="btn btn-out" onClick={resetForm}>취소</button>}
            </div>
          </form>
        </div>

        {/* 글 목록 */}
        <div className="card list-card">
          <div className="list-head">
            <h2>등록된 글</h2>
            <span className="count">{posts.length}개</span>
          </div>
          <div>
            {loadErr ? (
              <div className="list-state">목록을 불러오지 못했습니다.</div>
            ) : posts.length === 0 ? (
              <div className="list-state">아직 등록된 글이 없습니다. 왼쪽에서 첫 글을 작성해 보세요.</div>
            ) : (
              posts.map((p) => (
                <div className="post-row" key={p.id}>
                  {p.cover_url ? (
                    <img className="thumb" src={p.cover_url} alt="" />
                  ) : (
                    <div className="thumb"><i className="fa-solid fa-feather"></i></div>
                  )}
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
    </main>
  );
}

// 서비스소개서(PDF) 업로드·현재본 관리 — 비공개 Storage 버킷 + brochure_files
function BrochureManager() {
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("brochure_files")
      .select("path")
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCurrent(data?.path ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMsg({ text: "PDF 파일만 업로드할 수 있습니다.", ok: false });
      e.target.value = "";
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const path = `aiview-brochure-${new Date().toISOString().replace(/[^0-9]/g, "")}.pdf`;
      const up = await supabase.storage.from("brochures").upload(path, file, {
        upsert: true,
        contentType: "application/pdf",
      });
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
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2>서비스소개서 (PDF)</h2>
      {msg && <div className={`form-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}
      <div className="sub" style={{ fontSize: 13, margin: "4px 0 14px" }}>
        현재 등록: {current ? <b>{current}</b> : "없음"}
      </div>
      <label className="btn btn-blue" style={{ cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "업로드 중…" : "소개서 PDF 업로드"}
        <input type="file" accept="application/pdf" hidden onChange={onUpload} disabled={busy} />
      </label>
      <div className="hint" style={{ marginTop: 10 }}>
        잠재고객이 회사 이메일을 입력하면 이 파일의 보안 링크(7일 만료)가 이메일로 자동 전송됩니다. 화면에는 노출되지 않습니다.
      </div>
    </div>
  );
}
