"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, TRACKING_KEYS, type EventApplication } from "@/lib/supabase";
import { EVENTS } from "@/lib/events";
import {
  EVENT_JOBS, EVENT_JOB_LABEL,
  APPLICANT_TYPE_LABEL, FINAL_ATTEND_LABEL,
  EV_HOW_FOUND_OPTIONS, EV_HOW_FOUND_LABEL, evHowFoundText,
} from "@/lib/eventApply";

/* 이벤트 참가 신청(event_applications) 관리.
   도입문의(signups)와 성격이 달라서 따로 둔다 —
   · 상담 파이프라인이 아니라 **선착순 순번**이 핵심이다(쿠폰 지급 대상 선정).
   · 보유기간이 1년 롤링이 아니라 **고정 파기일**이다(이벤트 페이지에 공지한 값).
   · 지원자는 개인이라 회사·채용규모 같은 리드 컬럼이 없다.

   읽기·수정·삭제는 admins RLS 로 보호된다(supabase/event-applications-setup.sql). */

// 이벤트 페이지 유의사항·지원 폼 동의서에 공지한 파기일. 세 곳이 같은 값이어야 한다.
const PURGE_DATE = "2027-02-28";
// 쿠폰 지급 상한 — 기획안 slide 10(5,000원 × 선착순 100명 = 50만원, 예산 상한)
const COUPON_LIMIT = 100;

function fmtDateTime(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtPhone(phone: string): string {
  const d = (phone || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

const PERIODS = [
  { k: "all", l: "전체" },
  { k: "today", l: "오늘" },
  { k: "7", l: "최근 7일" },
  { k: "30", l: "최근 30일" },
];

export const APPLICANT_STATUSES = ["신규", "면접 안내 발송", "면접 완료", "Finalist", "미응시", "제외"] as const;

export default function EventApplicants() {
  const [rows, setRows] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fEvent, setFEvent] = useState(EVENTS[0]?.slug ?? "all");
  const [fJob, setFJob] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fAttend, setFAttend] = useState("all");
  const [fHow, setFHow] = useState("all");
  const [fTest, setFTest] = useState("real");
  const [fPeriod, setFPeriod] = useState("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 선착순 판정이 제출 시각 기준이라 오름차순으로 읽어 순번을 그대로 매긴다.
      const res = await supabase.from("event_applications").select("*").order("created_at", { ascending: true });
      if (res.error) throw res.error;
      setRows((res.data as EventApplication[]) || []);
      setLoadErr(null);
    } catch (err) {
      console.error("event_applications load failed:", err);
      setLoadErr(
        "목록을 불러오지 못했습니다. supabase/event-applications-setup.sql 을 SQL Editor 에서 실행했는지 확인해 주세요."
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function updateRow(id: string, patch: Partial<EventApplication>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const res = await supabase.from("event_applications").update(patch).eq("id", id).select().single();
    if (res.error) {
      console.error("update failed:", res.error);
      alert("저장에 실패했습니다. 관리자 권한을 확인해 주세요.");
      await load();
      return;
    }
    const saved = res.data as EventApplication;
    setRows((rs) => rs.map((r) => (r.id === id ? saved : r)));
  }

  async function purgeRow(r: EventApplication) {
    if (!confirm(`${r.name}님의 지원서를 영구 삭제합니다. 되돌릴 수 없습니다. 진행할까요?`)) return;
    setBusy(true);
    try {
      const res = await supabase.from("event_applications").delete().eq("id", r.id);
      if (res.error) throw res.error;
      await load();
    } catch (err) {
      console.error("purge failed:", err);
      alert("삭제에 실패했습니다. 관리자 권한을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  /* 선착순 순번 — 테스트 행을 뺀 실제 지원자만 순서대로 센다.
     쿠폰 지급 기준은 "1차 직무 AI 면접 완료 선착순"이므로 이 번호는 지원 순서일 뿐이다.
     실제 지급 대상은 면접 완료 시각으로 다시 정렬해야 한다(상태 = 면접 완료). */
  const seq = useMemo(() => {
    const m = new Map<string, number>();
    let n = 0;
    for (const r of rows) {
      if (r.is_test) continue;
      m.set(r.id, ++n);
    }
    return m;
  }, [rows]);

  const scoped = useMemo(() => rows.filter((r) => fEvent === "all" || r.event_slug === fEvent), [rows, fEvent]);

  const stats = useMemo(() => {
    const real = scoped.filter((r) => !r.is_test);
    const by = (v: string) => real.filter((r) => r.job === v).length;
    return {
      total: real.length,
      test: scoped.length - real.length,
      marketing: by("marketing"),
      dev: by("dev"),
      attend: real.filter((r) => r.final_attend === "yes").length,
      done: real.filter((r) => r.status === "면접 완료").length,
      contentOk: real.filter((r) => r.consent_content).length,
    };
  }, [scoped]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return scoped.filter((r) => {
      if (fTest === "real" && r.is_test) return false;
      if (fTest === "test" && !r.is_test) return false;
      if (fJob !== "all" && r.job !== fJob) return false;
      if (fStatus !== "all" && (r.status || "신규") !== fStatus) return false;
      if (fAttend !== "all" && r.final_attend !== fAttend) return false;
      if (fHow !== "all" && r.how_found !== fHow) return false;
      if (fPeriod !== "all") {
        const cutoff =
          fPeriod === "today"
            ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
            : now - Number(fPeriod) * 86400000;
        if (new Date(r.created_at).getTime() < cutoff) return false;
      }
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        if (![r.name, r.email, r.phone].some((v) => (v || "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [scoped, fJob, fStatus, fAttend, fHow, fTest, fPeriod, q]);

  function exportCsv() {
    const head = [
      "순번", "접수일시", "이름", "지원직군", "연락처", "이메일", "현재상태", "오프라인참석",
      "알게된경로", "알게된경로(기타)", "진행상태", "콘텐츠활용동의", "쿠폰발송일", "내부메모", "테스트여부",
      ...TRACKING_KEYS,
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = filtered.map((r) =>
      [
        seq.get(r.id) ?? "",
        fmtDateTime(r.created_at),
        r.name,
        EVENT_JOB_LABEL[r.job] || r.job,
        fmtPhone(r.phone),
        r.email,
        APPLICANT_TYPE_LABEL[r.applicant_type] || r.applicant_type,
        FINAL_ATTEND_LABEL[r.final_attend] || r.final_attend,
        evHowFoundText(r.how_found, r.how_found_detail) ?? "",
        r.how_found_detail ?? "",
        r.status || "신규",
        r.consent_content ? "동의" : "미동의",
        r.coupon_sent_at ? fmtDateTime(r.coupon_sent_at) : "",
        r.admin_note ?? "",
        r.is_test ? "테스트" : "",
        ...TRACKING_KEYS.map((k) => r[k] ?? ""),
      ]
        .map(esc)
        .join(",")
    );
    const csv = "﻿" + [head.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-applicants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const STATS: { label: string; v: string | number; sub: string; icon: string }[] = [
    { label: "총 지원자", v: stats.total, sub: stats.test > 0 ? `테스트 ${stats.test}건 제외` : "실제 지원 기준", icon: "fa-users" },
    { label: "제품마케팅", v: stats.marketing, sub: "마케팅 직군 지원", icon: "fa-chart-simple" },
    { label: "소프트웨어 개발", v: stats.dev, sub: "개발 직군 지원", icon: "fa-diagram-project" },
    { label: "1차 면접 완료", v: stats.done, sub: `쿠폰 지급 상한 ${COUPON_LIMIT}명`, icon: "fa-user-check" },
    { label: "오프라인 참석 가능", v: stats.attend, sub: "Finalist 후보 모수", icon: "fa-user" },
    { label: "콘텐츠 활용 동의", v: stats.contentOk, sub: "결과 기사에 쓸 수 있는 응답", icon: "fa-file-lines" },
  ];

  return (
    <>
      <div className="adm-note">
        <i className="fa-solid fa-lock"></i>
        <span>
          지원자 개인정보입니다. 이벤트 페이지와 지원 폼에 <b>{PURGE_DATE}까지 전량 파기</b>로 공지했습니다. 그날
          <code> supabase/event-applications-setup.sql </code>의 파기 쿼리를 실행해 주세요.
        </span>
      </div>

      <div className="admin-grid">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card" style={{ cursor: "default" }}>
            <div className="stat-ic">
              <i className={`fa-solid ${s.icon}`}></i>
            </div>
            <div className="stat-v">{s.v}</div>
            <div className="stat-l">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="adm-filters">
        {EVENTS.length > 1 && (
          <div className="filt">
            <label>행사</label>
            <select value={fEvent} onChange={(e) => setFEvent(e.target.value)}>
              <option value="all">전체</option>
              {EVENTS.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="filt">
          <label>지원 직군</label>
          <select value={fJob} onChange={(e) => setFJob(e.target.value)}>
            <option value="all">전체</option>
            {EVENT_JOBS.map((j) => (
              <option key={j.v} value={j.v}>
                {j.l}
              </option>
            ))}
          </select>
        </div>
        <div className="filt">
          <label>진행 상태</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">전체</option>
            {APPLICANT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="filt">
          <label>오프라인 참석</label>
          <select value={fAttend} onChange={(e) => setFAttend(e.target.value)}>
            <option value="all">전체</option>
            <option value="yes">참석 가능</option>
            <option value="undecided">미정</option>
            <option value="no">참석 어려움</option>
          </select>
        </div>
        <div className="filt">
          <label>유입 경로</label>
          <select value={fHow} onChange={(e) => setFHow(e.target.value)}>
            <option value="all">전체</option>
            {EV_HOW_FOUND_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>
        <div className="filt">
          <label>구분</label>
          <select value={fTest} onChange={(e) => setFTest(e.target.value)}>
            <option value="real">실제 지원</option>
            <option value="test">테스트</option>
            <option value="all">전체</option>
          </select>
        </div>
        <div className="filt">
          <label>기간</label>
          <select value={fPeriod} onChange={(e) => setFPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.k} value={p.k}>
                {p.l}
              </option>
            ))}
          </select>
        </div>
        <div className="filt grow">
          <label>검색</label>
          <input
            type="search"
            placeholder="이름·이메일·연락처"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {filtered.length > 0 && (
          <button className="btn btn-out" style={{ alignSelf: "flex-end" }} onClick={exportCsv}>
            <i className="fa-solid fa-file-csv"></i> CSV
          </button>
        )}
      </div>

      <div className="card list-card">
        <div className="list-head">
          <h2>참가 신청 내역</h2>
          <span className="count">
            {filtered.length} / {scoped.length}건
            {stats.test > 0 && <> · 테스트 {stats.test}건</>}
          </span>
        </div>
        {loading ? (
          <div className="list-state">
            <i className="fa-solid fa-spinner fa-spin"></i> 불러오는 중…
          </div>
        ) : loadErr ? (
          <div className="list-state">{loadErr}</div>
        ) : scoped.length === 0 ? (
          <div className="list-state">아직 접수된 지원서가 없습니다.</div>
        ) : filtered.length === 0 ? (
          <div className="list-state">조건에 맞는 지원서가 없습니다.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>순번</th>
                  <th>접수일</th>
                  <th>이름</th>
                  <th>지원 직군</th>
                  <th>연락처</th>
                  <th>이메일</th>
                  <th>현재 상태</th>
                  <th>오프라인</th>
                  <th>유입</th>
                  <th>콘텐츠</th>
                  <th>진행 상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">{r.is_test ? "—" : seq.get(r.id)}</td>
                    <td className="nowrap">{fmtDateTime(r.created_at)}</td>
                    <td className="nowrap">
                      {r.name}
                      {r.is_test && <span className="adm-badge" style={{ marginLeft: 6 }}>TEST</span>}
                    </td>
                    <td className="nowrap">{EVENT_JOB_LABEL[r.job] || r.job}</td>
                    <td className="nowrap">{fmtPhone(r.phone)}</td>
                    <td>
                      <a href={`mailto:${r.email}`}>{r.email}</a>
                    </td>
                    <td className="nowrap">{APPLICANT_TYPE_LABEL[r.applicant_type] || r.applicant_type}</td>
                    <td className="nowrap">
                      {r.final_attend === "yes" ? "가능" : r.final_attend === "no" ? "어려움" : "미정"}
                    </td>
                    <td className="nowrap" title={evHowFoundText(r.how_found, r.how_found_detail) ?? ""}>
                      {r.how_found ? EV_HOW_FOUND_LABEL[r.how_found]?.split(" (")[0] || r.how_found : "—"}
                    </td>
                    <td className="nowrap">{r.consent_content ? "동의" : "—"}</td>
                    <td className="nowrap">
                      <select
                        className="status-sel"
                        value={r.status || "신규"}
                        onChange={(e) => updateRow(r.id, { status: e.target.value })}
                      >
                        {APPLICANT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="nowrap">
                      <div className="row-actions">
                        <button
                          className="btn btn-out"
                          disabled={busy}
                          title={r.is_test ? "실제 지원으로 되돌리기" : "테스트로 표시(집계 제외)"}
                          onClick={() => updateRow(r.id, { is_test: !r.is_test })}
                        >
                          <i className="fa-solid fa-ban"></i>
                        </button>
                        <button
                          className="btn btn-out"
                          disabled={busy}
                          title="영구 삭제"
                          onClick={() => purgeRow(r)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
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
