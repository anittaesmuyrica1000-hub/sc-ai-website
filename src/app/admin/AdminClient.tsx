"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Post, fmtDate } from "@/lib/types";

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

export default function AdminClient({
  initialPosts,
  userEmail,
}: {
  initialPosts: Post[];
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const isEdit = form.id !== "";
  const cats = useMemo(() => {
    const set: string[] = [];
    posts.forEach((p) => {
      if (p.category && !set.includes(p.category)) set.push(p.category);
    });
    return set;
  }, [posts]);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function reload() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as Post[]);
  }

  function resetForm() {
    setForm(EMPTY);
    setMsg(null);
  }

  function editPost(p: Post) {
    setForm({
      id: p.id,
      title: p.title,
      category: p.category || "",
      author: p.author || "",
      cover_url: p.cover_url || "",
      excerpt: p.excerpt || "",
      content: p.content || "",
      published: p.published !== false,
    });
    setMsg(null);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setMsg({ text: "제목과 본문은 필수입니다.", ok: false });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category: form.category.trim() || null,
      author: form.author.trim() || null,
      cover_url: form.cover_url.trim() || null,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      published: form.published,
    };
    try {
      let error;
      if (isEdit) {
        ({ error } = await supabase
          .from("posts")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", form.id));
      } else {
        ({ error } = await supabase.from("posts").insert(payload));
      }
      if (error) throw error;
      setMsg({ text: isEdit ? "수정되었습니다." : "등록되었습니다.", ok: true });
      resetForm();
      await reload();
    } catch (err) {
      console.error("save failed:", err);
      setMsg({ text: "저장에 실패했습니다. 다시 시도해 주세요.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p: Post) {
    if (!confirm(`“${p.title}”을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", p.id);
    if (error) {
      alert("삭제에 실패했습니다.");
      return;
    }
    if (form.id === p.id) resetForm();
    await reload();
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin">
      <div className="admin-head" ref={topRef}>
        <div>
          <h1>블로그 관리</h1>
          <div className="sub">글을 등록·수정·삭제합니다.</div>
        </div>
        <div className="head-actions">
          {userEmail && <span className="sub">{userEmail}</span>}
          <a href="/blog" target="_blank" className="btn btn-out">
            <i className="fa-solid fa-arrow-up-right-from-square" /> 블로그 보기
          </a>
          <button onClick={onSignOut} className="btn btn-out">
            <i className="fa-solid fa-right-from-bracket" /> 로그아웃
          </button>
        </div>
      </div>
      <div className="admin-note">
        <i className="fa-solid fa-shield-halved" /> 인증된 관리자만 접근·수정할 수 있습니다.
      </div>

      <div className="admin-grid">
        {/* 폼 */}
        <div className="card">
          <h2>{isEdit ? "글 수정" : "새 글 작성"}</h2>
          {msg && <div className={"form-msg " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>제목 <span className="req">*</span></label>
              <input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="글 제목" />
            </div>
            <div className="field-row">
              <div className="field">
                <label>카테고리</label>
                <input
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  placeholder="예: AI 면접"
                  list="catList"
                />
                <datalist id="catList">
                  {cats.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>작성자</label>
                <input value={form.author} onChange={(e) => setField("author", e.target.value)} placeholder="예: AIVIEW 팀" />
              </div>
            </div>
            <div className="field">
              <label>커버 이미지 URL</label>
              <input value={form.cover_url} onChange={(e) => setField("cover_url", e.target.value)} placeholder="https://..." />
              <div className="hint">비워두면 기본 그라데이션 썸네일이 표시됩니다.</div>
            </div>
            <div className="field">
              <label>요약</label>
              <input value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} placeholder="리스트에 보일 한 줄 요약" />
            </div>
            <div className="field">
              <label>본문 <span className="req">*</span></label>
              <textarea
                value={form.content}
                onChange={(e) => setField("content", e.target.value)}
                placeholder={"본문을 입력하세요. 빈 줄로 문단을 나눕니다.\n\n## 소제목\n### 작은 소제목\n![이미지 설명](https://이미지주소)\n- 목록 항목\n> 인용문"}
              />
              <div className="hint">빈 줄로 문단 구분 · `## 소제목` · `![설명](이미지URL)` · `- 목록` · `&gt; 인용` 지원</div>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setField("published", e.target.checked)}
              />{" "}
              공개(게시)
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? "저장 중…" : isEdit ? "수정 저장" : "등록하기"}
              </button>
              {isEdit && (
                <button type="button" className="btn btn-out" onClick={resetForm}>
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 목록 */}
        <div className="card list-card">
          <div className="list-head">
            <h2>등록된 글</h2>
            <span className="count">{posts.length}개</span>
          </div>
          {posts.length === 0 ? (
            <div className="list-state">아직 등록된 글이 없습니다. 왼쪽에서 첫 글을 작성해 보세요.</div>
          ) : (
            <div>
              {posts.map((p) => (
                <div className="post-row" key={p.id}>
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={p.cover_url} alt="" />
                  ) : (
                    <div className="thumb">
                      <i className="fa-solid fa-feather" />
                    </div>
                  )}
                  <div className="meta">
                    <div className="t">{p.title}</div>
                    <div className="s">
                      {p.category || "기타"} · {fmtDate(p.created_at)}
                      {p.published === false && <> · <span className="draft">비공개</span></>}
                    </div>
                  </div>
                  <div className="row-actions">
                    <a className="icon-btn" href={`/blog/${p.id}`} target="_blank" title="보기">
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                    <button className="icon-btn" onClick={() => editPost(p)} title="수정">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button className="icon-btn del" onClick={() => onDelete(p)} title="삭제">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
