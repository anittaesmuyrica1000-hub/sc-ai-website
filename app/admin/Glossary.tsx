"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { supabase, type GlossaryTerm, type GlossaryProgress } from "@/lib/supabase";

/* 약관 용어 메모장.
   처리방침·이용약관 업데이트를 맡은 담당자가 용어를 익히는 내부 학습 도구다(공개 페이지 노출 없음).
   · 용어 본문(glossary_terms)은 관리자 공용 — 고치면 모든 관리자에게 같은 설명이 보인다.
   · 숙지 체크·메모(glossary_progress)는 본인 행만 RLS로 읽고 쓴다(supabase/glossary-setup.sql).
   모바일에서 훑어보는 용도가 커서, 목록은 한 줄 뜻까지만 보이고 누르면 펼쳐진다. */

const CATS = ["역할", "개인정보 기본", "동의·국외이전", "AI·면접 기능", "데이터 항목", "개정 절차", "기술·클라우드", "업체", "업데이트 실무", "내가 추가"];

type Status = "all" | "todo" | "learned" | "watch" | "memo" | "asked";
const STATUS: { key: Status; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "asked", label: "물어본 개념" },
  { key: "todo", label: "아직" },
  { key: "learned", label: "숙지함" },
  { key: "watch", label: "개정 관련" },
  { key: "memo", label: "메모 있음" },
];

type Draft = { term: string; aka: string; cat: string; short: string; body: string; refs: string; ours: string; watch: string };

function toDraft(t?: Partial<GlossaryTerm>): Draft {
  return {
    term: t?.term ?? "", aka: t?.aka ?? "", cat: t?.cat ?? "내가 추가", short: t?.short ?? "",
    body: t?.body ?? "", refs: (t?.refs ?? []).join(", "), ours: t?.ours ?? "", watch: t?.watch ?? "",
  };
}
function fromDraft(d: Draft) {
  return {
    term: d.term.trim(), aka: d.aka.trim(), cat: d.cat || "내가 추가", short: d.short.trim(), body: d.body.trim(),
    refs: d.refs.split(/[,\n]/).map((s) => s.trim()).filter(Boolean), ours: d.ours.trim(), watch: d.watch.trim(),
  };
}

function errorText(err: unknown) {
  const e = (err ?? {}) as { message?: string; code?: string };
  const msg = e.message ?? "알 수 없는 오류";
  if (e.code === "42P01" || /relation .* does not exist/i.test(msg)) return "용어 테이블이 없습니다. supabase/glossary-setup.sql 을 실행해 주세요.";
  if (e.code === "42501" || /row-level|permission/i.test(msg)) return "관리자 권한으로만 저장할 수 있습니다.";
  return `저장하지 못했습니다. (${msg})`;
}

const PREFS_KEY = "adm-glossary";

export default function Glossary({ email }: { email: string }) {
  const [terms, setTerms] = useState<GlossaryTerm[] | null>(null);
  const [progress, setProgress] = useState<Record<string, GlossaryProgress>>({});
  const [loadErr, setLoadErr] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [cat, setCat] = useState("all");
  const [quiz, setQuiz] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 같은 용어의 진행 기록은 한 번에 하나씩 쓴다(빠른 연속 입력이 순서가 뒤바뀌어 덮어쓰지 않도록).
  const chains = useRef(new Map<string, Promise<unknown>>());

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }, []);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([
      supabase.from("glossary_terms").select("*").order("sort_order", { ascending: true }),
      supabase.from("glossary_progress").select("*").eq("email", email),
    ]);
    if (t.error) { setLoadErr(errorText(t.error)); setTerms([]); return; }
    setLoadErr("");
    setTerms((t.data ?? []) as GlossaryTerm[]);
    if (!p.error) setProgress(Object.fromEntries(((p.data ?? []) as GlossaryProgress[]).map((r) => [r.term_id, r])));
  }, [email]);
  useEffect(() => { load(); }, [load]);

  // 필터·가리기 상태는 이 기기에서만 기억(개인 편의)
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      if (p.status) setStatus(p.status);
      if (p.cat) setCat(p.cat);
      if (p.quiz) setQuiz(true);
    } catch { /* storage 사용 불가 */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ status, cat, quiz })); } catch { /* 무시 */ }
  }, [status, cat, quiz]);

  const saveProgress = useCallback((termId: string, patch: Partial<Pick<GlossaryProgress, "learned" | "memo">>) => {
    const prev = chains.current.get(termId) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(async () => {
      const { error } = await supabase.from("glossary_progress")
        .upsert({ term_id: termId, email, ...patch, updated_at: new Date().toISOString() }, { onConflict: "term_id,email" });
      if (error) throw error;
    });
    chains.current.set(termId, next);
    return next;
  }, [email]);

  function toggleLearned(id: string) {
    const cur = progress[id];
    const learned = !(cur?.learned ?? false);
    setProgress((p) => ({ ...p, [id]: { term_id: id, email, memo: p[id]?.memo ?? "", learned } }));
    saveProgress(id, { learned }).catch((e) => {
      setProgress((p) => ({ ...p, [id]: { term_id: id, email, memo: p[id]?.memo ?? "", learned: !learned } }));
      showToast(errorText(e));
    });
  }

  const saveMemo = useCallback(async (id: string, memo: string) => {
    await saveProgress(id, { memo });
    setProgress((p) => ({ ...p, [id]: { term_id: id, email, learned: p[id]?.learned ?? false, memo } }));
  }, [saveProgress, email]);

  async function addTerm(d: Draft) {
    const f = fromDraft(d);
    const list = terms ?? [];
    const sameCat = list.filter((t) => t.cat === f.cat);
    const sort_order = (sameCat.length ? Math.max(...sameCat.map((t) => t.sort_order)) : list.length * 10) + 10;
    const row = { id: crypto.randomUUID(), ...f, sort_order, source: "me", asked: false };
    const { data, error } = await supabase.from("glossary_terms").insert(row).select().single();
    if (error) throw error;
    setTerms((ts) => [...(ts ?? []), data as GlossaryTerm]);
    setOpen((s) => new Set(s).add(row.id));
    setAdding(false);
    showToast(`‘${f.term}’을 추가했어요.`);
  }

  async function editTerm(id: string, d: Draft) {
    const f = fromDraft(d);
    const { data, error } = await supabase.from("glossary_terms")
      .update({ ...f, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    setTerms((ts) => (ts ?? []).map((t) => (t.id === id ? (data as GlossaryTerm) : t)));
    showToast("고친 내용을 저장했어요.");
  }

  async function deleteTerm(id: string) {
    const { error } = await supabase.from("glossary_terms").delete().eq("id", id);
    if (error) { showToast(errorText(error)); return; }
    setTerms((ts) => (ts ?? []).filter((t) => t.id !== id));
    showToast("용어를 지웠어요.");
  }

  const allCats = useMemo(() => {
    const extra = [...new Set((terms ?? []).map((t) => t.cat).filter((c) => !CATS.includes(c)))].sort();
    return CATS.concat(extra);
  }, [terms]);

  const matches = useCallback((t: GlossaryTerm, ignoreCat: boolean) => {
    const pr = progress[t.id];
    if (status === "todo" && pr?.learned) return false;
    if (status === "learned" && !pr?.learned) return false;
    if (status === "watch" && !t.watch) return false;
    if (status === "memo" && !pr?.memo?.trim()) return false;
    if (status === "asked" && !t.asked) return false;
    if (!ignoreCat && cat !== "all" && t.cat !== cat) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [t.term, t.aka, t.short, t.body, t.ours, t.watch, t.cat, (t.refs ?? []).join(" "), pr?.memo ?? ""].join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }, [progress, status, cat, query]);

  const list = useMemo(() => terms ?? [], [terms]);
  const chipCounts = useMemo(() => {
    const m = new Map<string, number>();
    let total = 0;
    for (const t of list) if (matches(t, true)) { total++; m.set(t.cat, (m.get(t.cat) ?? 0) + 1); }
    return { m, total };
  }, [list, matches]);
  const groups = useMemo(() => allCats
    .map((c) => ({ cat: c, items: list.filter((t) => t.cat === c && matches(t, false)) }))
    .filter((g) => g.items.length > 0), [allCats, list, matches]);
  const visible = groups.reduce((n, g) => n + g.items.length, 0);
  const learnedN = list.filter((t) => progress[t.id]?.learned).length;
  const presentCats = allCats.filter((c) => list.some((t) => t.cat === c));
  const allOpen = list.length > 0 && open.size >= list.length;

  function toggleOpen(id: string) {
    setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  return (
    <div className={`gl${quiz ? " gl-quiz" : ""}`}>
      <div className="gl-top">
        <div className="gl-progress" aria-live="polite">
          <div className="gl-prog-num"><strong>{learnedN}</strong><span>/ {list.length}개 숙지</span></div>
          <div className="gl-bar" aria-hidden="true"><i style={{ width: list.length ? `${(learnedN / list.length) * 100}%` : 0 }} /></div>
          <div className="gl-basis">기준: 개인정보 처리방침(2026-08-21), 지원자용·기업용 이용약관(2026-08-15), 10/15 대표 최종 개정안</div>
        </div>
        <div className="gl-tools">
          <button type="button" className={`btn btn-out gl-sm${quiz ? " on" : ""}`} aria-pressed={quiz} onClick={() => setQuiz((v) => !v)}>
            <i className="fa-solid fa-eye"></i> 뜻 가리기
          </button>
          <button type="button" className="btn btn-out gl-sm" onClick={() => setOpen(allOpen ? new Set() : new Set(list.map((t) => t.id)))}>
            <i className={`fa-solid ${allOpen ? "fa-chevron-up" : "fa-chevron-down"}`}></i> {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
          <button type="button" className="btn btn-blue gl-sm" onClick={() => setAdding(true)}>
            <i className="fa-solid fa-plus"></i> 용어 추가
          </button>
        </div>
      </div>

      <div className={`adm-search${query ? " on" : ""}`}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
          placeholder="용어·뜻·조문 검색 (예: 국외이전)"
          aria-label="용어 검색"
        />
        {query && (
          <>
            <span className="adm-search-count">{visible}개</span>
            <button type="button" className="adm-search-clear" aria-label="검색어 지우기" title="지우기 (ESC)" onClick={() => setQuery("")}><i className="fa-solid fa-xmark"></i></button>
          </>
        )}
      </div>

      <div className="gl-seg" role="group" aria-label="상태로 거르기">
        {STATUS.map((s) => (
          <button key={s.key} type="button" aria-pressed={status === s.key} onClick={() => setStatus(s.key)}>{s.label}</button>
        ))}
      </div>

      <div className="gl-cats" role="group" aria-label="분류">
        <button type="button" className="gl-chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>전체<b>{chipCounts.total}</b></button>
        {presentCats.map((c) => (
          <button key={c} type="button" className="gl-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}<b>{chipCounts.m.get(c) ?? 0}</b></button>
        ))}
      </div>

      <p className="gl-legend">
        약어 <b>방침</b> 개인정보 처리방침 · <b>지원자 약관</b> 지원자용 이용약관 · <b>기업 약관</b> 기업용 이용약관 · <b>법</b> 개인정보 보호법 · <b>E숫자</b> 10/6 초안의 미결 항목. 숙지 체크와 메모는 나만 봅니다.
      </p>

      {adding && (
        <div className="card gl-form">
          <h2>새 용어 적기</h2>
          <TermEditor cats={allCats} initial={toDraft({ cat: cat !== "all" ? cat : "내가 추가" })} submitLabel="추가" onCancel={() => setAdding(false)} onSubmit={addTerm} />
        </div>
      )}

      {loadErr && <div className="form-msg err">{loadErr}</div>}

      {terms === null ? (
        <div className="list-state"><i className="fa-solid fa-spinner fa-spin"></i> 용어를 불러오는 중…</div>
      ) : list.length === 0 ? (
        <div className="list-state">아직 적어 둔 용어가 없어요. ‘용어 추가’로 첫 용어를 적어 보세요.</div>
      ) : visible === 0 ? (
        <div className="list-state">맞는 용어가 없어요. {query ? "검색어를 줄이거나 " : ""}분류와 상태를 ‘전체’로 바꿔 보세요.</div>
      ) : (
        groups.map((g) => (
          <section key={g.cat} className="gl-sec">
            <div className="gl-sec-head"><h2>{g.cat}</h2><span>{g.items.length}개</span></div>
            <div className="card gl-list">
              {g.items.map((t) => (
                <TermRow
                  key={t.id}
                  term={t}
                  prog={progress[t.id]}
                  cats={allCats}
                  isOpen={open.has(t.id)}
                  onToggle={() => toggleOpen(t.id)}
                  onLearned={() => toggleLearned(t.id)}
                  onSaveMemo={saveMemo}
                  onEdit={(d) => editTerm(t.id, d)}
                  onDelete={() => deleteTerm(t.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {toast && <div className="gl-toast" role="status">{toast}</div>}
    </div>
  );
}

function TermRow({ term: t, prog, cats, isOpen, onToggle, onLearned, onSaveMemo, onEdit, onDelete }: {
  term: GlossaryTerm;
  prog?: GlossaryProgress;
  cats: string[];
  isOpen: boolean;
  onToggle: () => void;
  onLearned: () => void;
  onSaveMemo: (id: string, memo: string) => Promise<void>;
  onEdit: (d: Draft) => Promise<void>;
  onDelete: () => void;
}) {
  const learned = prog?.learned ?? false;
  const saved = prog?.memo ?? "";
  const [memo, setMemo] = useState(saved);
  const [memoState, setMemoState] = useState<"" | "typing" | "saving" | "saved" | "error">("");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const dirty = useRef(false);
  const latest = useRef(saved);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 다른 기기에서 저장된 메모가 들어오면, 지금 입력 중이 아닐 때만 반영
  useEffect(() => { if (!dirty.current) { setMemo(saved); latest.current = saved; } }, [saved]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const flush = useCallback((value: string) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (value === saved) { dirty.current = false; setMemoState(""); return; }
    setMemoState("saving");
    onSaveMemo(t.id, value)
      .then(() => { if (latest.current === value) { dirty.current = false; setMemoState("saved"); } })
      .catch(() => setMemoState("error"));
  }, [saved, onSaveMemo, t.id]);

  function onMemoChange(v: string) {
    setMemo(v);
    latest.current = v;
    dirty.current = true;
    setMemoState("typing");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(v), 900);
  }

  const memoLabel = { "": "", typing: "입력 중…", saving: "저장 중…", saved: "저장됨", error: "저장하지 못했어요. 다시 입력하면 다시 저장해요." }[memoState];

  return (
    <article className={`gl-row${isOpen ? " open" : ""}${learned ? " learned" : ""}`}>
      <div className="gl-line">
        <button type="button" className="gl-check" aria-pressed={learned} aria-label={learned ? `${t.term} 숙지함 — 누르면 해제` : `${t.term} 숙지 표시`} onClick={onLearned}>
          <i className="fa-solid fa-check"></i>
        </button>
        <button type="button" className="gl-head" aria-expanded={isOpen} onClick={onToggle}>
          <span className="gl-hw-line"><span className="gl-hw">{t.term}</span>{t.aka && <span className="gl-aka">{t.aka}</span>}</span>
          <span className="gl-short">{t.short}</span>
        </button>
        <span className="gl-flags">
          {t.asked && <span className="gl-flag asked">물어봄</span>}
          {t.watch && <span className="gl-flag watch">개정</span>}
          {saved.trim() && <span className="gl-flag memo">메모</span>}
        </span>
        <i className="fa-solid fa-chevron-down gl-caret" aria-hidden="true"></i>
      </div>

      {isOpen && (
        <div className="gl-detail">
          {editing ? (
            <TermEditor cats={cats} initial={toDraft(t)} submitLabel="저장" onCancel={() => setEditing(false)} onSubmit={async (d) => { await onEdit(d); setEditing(false); }} />
          ) : (
            <>
              <dl className="gl-blocks">
                {t.body && <div className="gl-blk wide"><dt>쉽게 말하면</dt><dd>{t.body}</dd></div>}
                {(t.refs ?? []).length > 0 && (
                  <div className="gl-blk"><dt>약관에서</dt><dd className="gl-refs">{t.refs.map((r) => <span key={r} className="gl-ref">{r}</span>)}</dd></div>
                )}
                {t.ours && <div className="gl-blk"><dt>우리 서비스에선</dt><dd>{t.ours}</dd></div>}
                {t.watch && <div className="gl-blk warn"><dt>이번 개정에서 볼 점</dt><dd>{t.watch}</dd></div>}
              </dl>
              <div className="gl-memo">
                <label htmlFor={`gl-memo-${t.id}`}>내 메모</label>
                <textarea
                  id={`gl-memo-${t.id}`}
                  rows={3}
                  value={memo}
                  placeholder="이해한 내용, 헷갈리는 점, 예시를 적어 두세요"
                  onChange={(e) => onMemoChange(e.target.value)}
                  onBlur={() => { if (dirty.current) flush(memo); }}
                />
                <div className="gl-memo-foot">
                  <span className={`gl-save${memoState === "error" ? " err" : ""}`} aria-live="polite">{memoLabel}</span>
                  {confirming ? (
                    <span className="gl-confirm">
                      <span>이 용어를 지울까요? 모든 관리자에게서 사라져요.</span>
                      <button type="button" className="btn btn-out gl-sm" onClick={() => setConfirming(false)}>취소</button>
                      <button type="button" className="btn gl-sm gl-danger" onClick={onDelete}><i className="fa-solid fa-trash"></i> 삭제</button>
                    </span>
                  ) : (
                    <span className="gl-actions">
                      <button type="button" className="btn btn-out gl-sm" onClick={() => setEditing(true)}><i className="fa-solid fa-pen"></i> 내용 고치기</button>
                      <button type="button" className="btn btn-out gl-sm gl-del" onClick={() => setConfirming(true)}><i className="fa-solid fa-trash"></i> 삭제</button>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function TermEditor({ cats, initial, submitLabel, onCancel, onSubmit }: {
  cats: string[];
  initial: Draft;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (d: Draft) => Promise<void>;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setD((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!d.term.trim() || !d.short.trim()) { setErr("용어와 한 줄 뜻을 적어 주세요."); return; }
    setBusy(true); setErr("");
    try { await onSubmit(d); } catch (e2) { setErr(errorText(e2)); setBusy(false); }
  }

  return (
    <form className="gl-editor" onSubmit={submit} noValidate>
      {err && <div className="form-msg err">{err}</div>}
      <div className="gl-fields">
        <label className="gl-field"><span>용어 <em>(필수)</em></span><input value={d.term} onChange={set("term")} autoFocus /></label>
        <label className="gl-field"><span>다른 이름·영문</span><input value={d.aka} onChange={set("aka")} /></label>
        <label className="gl-field"><span>분류</span>
          <select value={d.cat} onChange={set("cat")}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="gl-field"><span>약관에서 <em>(쉼표로 구분)</em></span><input value={d.refs} onChange={set("refs")} placeholder="방침 제5조 ②, 지원자 약관 제3조 ③" /></label>
        <label className="gl-field wide"><span>한 줄 뜻 <em>(필수)</em></span><input value={d.short} onChange={set("short")} /></label>
        <label className="gl-field wide"><span>쉽게 말하면</span><textarea rows={3} value={d.body} onChange={set("body")} /></label>
        <label className="gl-field wide"><span>우리 서비스에선</span><textarea rows={2} value={d.ours} onChange={set("ours")} /></label>
        <label className="gl-field wide"><span>이번 개정에서 볼 점 <em>(적으면 ‘개정 관련’으로 표시)</em></span><textarea rows={2} value={d.watch} onChange={set("watch")} /></label>
      </div>
      <div className="gl-form-foot">
        <button type="button" className="btn btn-out gl-sm" onClick={onCancel}>취소</button>
        <button type="submit" className="btn btn-blue gl-sm" disabled={busy}>{busy ? "저장 중…" : submitLabel}</button>
      </div>
    </form>
  );
}
