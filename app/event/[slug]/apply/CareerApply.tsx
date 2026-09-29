"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/track";
import { getUtm, type Utm } from "@/lib/utm";
import type { EventItem, EventStatus } from "@/lib/events";
import {
  EVENT_JOBS, type EventJob,
  APPLICANT_TYPES, FINAL_ATTEND_OPTIONS,
  EV_HOW_FOUND_OPTIONS, EV_HOW_FOUND_ETC,
  eventEmailError, EVENT_EMAIL_ERROR_MSG,
  isValidName, isValidPhone, FICTION_NOTICE,
} from "@/lib/eventApply";

/* 가상기업 슈퍼전자의 채용공고 화면.
   기획안(2026-슈퍼전자-AI면접챌린지-기획안.pptx) slide 12 "참가자가 보는 화면"을
   실제 기업 채용 사이트의 공고 목록 → 공고 선택 → 지원서 흐름으로 구현한다.
   지원자가 겪는 것이 '이벤트 신청'이 아니라 '채용 지원'이어야 행사의 전제가 산다.

   ⚠️ 이 화면에 쓰면 안 되는 것(기획안 제약):
      · 문항 수·소요시간 — "5문항", "약 O분" (slide 14)
      · 모델 직무의 설계 근거가 된 실존 기업명 (slide 13)
      · 실존 기업 로고를 떠올리게 하는 형태 (slide 12) */

type Fields = {
  name: string; phone: string; email: string;
  applicantType: string; finalAttend: string;
  howFound: string; howFoundEtc: string;
};
const EMPTY: Fields = {
  name: "", phone: "", email: "",
  applicantType: "", finalAttend: "",
  howFound: "", howFoundEtc: "",
};

export default function CareerApply({ event, status }: { event: EventItem; status: EventStatus }) {
  const [job, setJob] = useState<EventJob | null>(null);
  const [filter, setFilter] = useState<EventJob | "all">("all");
  // 10/2 제출 테스트용(?preview=1) — 모집 시작 전에도 폼을 열어 끝까지 넣어 볼 수 있다.
  // 이때 저장되는 행은 is_test=true 라 선착순·집계에서 빠진다(기획안 slide 20 "지원 폼 제출 테스트").
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      if (qp.get("preview") === "1") setPreview(true);
      const j = qp.get("job");
      if (j && EVENT_JOBS.some((x) => x.v === j)) setJob(j as EventJob);
    } catch {}
  }, []);

  const open = status === "open" || preview;
  const jobs = EVENT_JOBS.filter((j) => filter === "all" || j.v === filter);

  return (
    <section className="career">
      <div className="career-wrap">
        <div className="career-top">
          <div className="career-brand">
            <b>슈퍼전자</b>
            <span>SUPER ELECTRONICS · 채용</span>
          </div>
          <Link href={`/event/${event.slug}`} className="career-back">
            <i className="fa-solid fa-arrow-left"></i> 행사 안내로 돌아가기
          </Link>
        </div>

        {job ? (
          <ApplyStep event={event} job={job} open={open} status={status} preview={preview} />
        ) : (
          <>
            <div className="career-banners">
              <div className="career-banner career-banner--main">
                <div>
                  <div className="eyebrow-s">2026 RECRUIT</div>
                  <h2>
                    슈퍼전자 2026년
                    <br />
                    하반기 신입사원 채용
                  </h2>
                </div>
                <p>
                  접수 {event.applyFrom} ~ {event.applyTo}
                </p>
              </div>
              <div className="career-banner career-banner--sub">
                <div>
                  <div className="eyebrow-s">전형 안내</div>
                  <h2>
                    1차 전형은
                    <br />
                    온라인 AI 면접으로
                  </h2>
                </div>
                <p>전공·학년·졸업 시기 제한 없음 · 어학 점수·자격증·수상 경력 미반영</p>
              </div>
            </div>

            <div className="career-notice">
              <i className="fa-solid fa-circle-info"></i>
              <span>
                <b>안내</b> — {FICTION_NOTICE}
              </span>
            </div>

            <div className="career-listhead">
              <h2>
                모집 중인 공고 <em>{EVENT_JOBS.length}</em>
              </h2>
              <div className="career-filters">
                <button
                  type="button"
                  className="career-chip"
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                >
                  전체
                </button>
                {EVENT_JOBS.map((j) => (
                  <button
                    key={j.v}
                    type="button"
                    className="career-chip"
                    aria-pressed={filter === j.v}
                    onClick={() => setFilter(j.v)}
                  >
                    {j.l}
                  </button>
                ))}
              </div>
            </div>

            <ul className="career-jobs">
              {jobs.map((j) => (
                <li key={j.v}>
                  <Link
                    href={`/event/${event.slug}/jobs/${j.v}`}
                    className="career-job"
                    onClick={() => trackEvent("event_job_select", { event_slug: event.slug, job: j.v })}
                  >
                    <div className="career-job__body">
                      <div className="career-job__title">
                        {j.l} 신입사원 모집
                        <span className="career-job__new">채용중</span>
                      </div>
                      <div className="career-job__meta">
                        <span>{j.team}</span>
                        <span>신입</span>
                        <span>서울</span>
                        <span>학력·전공 무관</span>
                      </div>
                      <p className="career-job__desc">{j.desc}</p>
                    </div>
                    <span className="career-job__go" aria-hidden="true">
                      <i className="fa-solid fa-arrow-right"></i>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {!open && (
              <div className="career-closed">
                <div className="dot">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <h2>{status === "upcoming" ? "아직 접수 전입니다" : "접수가 마감되었습니다"}</h2>
                <p>
                  {status === "upcoming" ? (
                    <>
                      {event.applyFrom}부터 지원할 수 있습니다.
                      <br />
                      공고를 눌러 지원서를 미리 볼 수 있습니다.
                    </>
                  ) : (
                    <>
                      {event.applyTo}로 접수가 끝났습니다.
                      <br />
                      다음 회차 소식은 이벤트 페이지에서 안내드립니다.
                    </>
                  )}
                </p>
                <Link href={`/event/${event.slug}`} className="btn btn-out">
                  행사 안내 보기
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ── 지원서 단계 ───────────────────────────────────────── */

function ApplyStep({
  event, job, open, status, preview,
}: {
  event: EventItem;
  job: EventJob;
  open: boolean;
  status: EventStatus;
  preview: boolean;
}) {
  const meta = EVENT_JOBS.find((j) => j.v === job)!;

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [emailMsg, setEmailMsg] = useState(EVENT_EMAIL_ERROR_MSG.empty);
  const [agree, setAgree] = useState({ privacy: false, fiction: false, content: false });
  const [agreeInvalid, setAgreeInvalid] = useState<Record<string, boolean>>({});
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [utm, setUtm] = useState<Utm>({});
  const [honeypot, setHoneypot] = useState("");
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const u = getUtm();
    if (Object.keys(u).length) setUtm(u);
  }, []);

  function set<K extends keyof Fields>(k: K, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
    setInvalid((m) => ({ ...m, [k]: false }));
  }

  function checkEmail() {
    if (!fields.email.trim()) return;
    const e = eventEmailError(fields.email);
    if (e) {
      setEmailMsg(EVENT_EMAIL_ERROR_MSG[e]);
      setInvalid((m) => ({ ...m, email: true }));
    }
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormErr("");
    // 봇 감지 — 도입문의 폼과 같은 규칙(허니팟 + 5초 미만 제출은 가짜 성공으로 돌려보낸다)
    if (honeypot || Date.now() - mountTime.current < 5000) {
      setDone(true);
      return;
    }

    const emailErr = eventEmailError(fields.email);
    if (emailErr) setEmailMsg(EVENT_EMAIL_ERROR_MSG[emailErr]);
    const next: Record<string, boolean> = {
      name: !isValidName(fields.name),
      phone: !isValidPhone(fields.phone),
      email: emailErr !== null,
      applicantType: fields.applicantType === "",
      finalAttend: fields.finalAttend === "",
      howFound: fields.howFound === "",
      howFoundEtc: fields.howFound === EV_HOW_FOUND_ETC && fields.howFoundEtc.trim() === "",
    };
    setInvalid(next);
    const agreeBad = { privacy: !agree.privacy, fiction: !agree.fiction };
    setAgreeInvalid(agreeBad);
    if (Object.values(next).some(Boolean) || agreeBad.privacy || agreeBad.fiction) return;

    setLoading(true);
    try {
      // 저장은 서버가 한다 — event_applications 는 RLS로 anon 쓰기가 막혀 있고,
      // 중복 지원 차단·모집 기간 확인도 서버에서 한 번 더 본다(클라이언트 값은 믿지 않는다).
      const res = await fetch("/api/event-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: event.slug,
          job,
          name: fields.name.trim(),
          phone: fields.phone.trim(),
          email: fields.email.trim(),
          applicant_type: fields.applicantType,
          final_attend: fields.finalAttend,
          how_found: fields.howFound,
          how_found_detail: fields.howFound === EV_HOW_FOUND_ETC ? fields.howFoundEtc.trim() : null,
          consent_privacy: agree.privacy,
          consent_fiction: agree.fiction,
          consent_content: agree.content,
          preview,
          ...utm,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setLoading(false);
        setFormErr(j?.message || "지원서 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      trackEvent("event_apply", { event_slug: event.slug, job, how_found: fields.howFound });
      setDone(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } catch (err) {
      setLoading(false);
      setFormErr("지원서 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      console.error("event apply submit failed:", err);
    }
  }

  return (
    <div className="career-form">
      <div className="career-sum">
        <Link href={`/event/${event.slug}/jobs/${job}`} className="career-form__back">
          <i className="fa-solid fa-arrow-left"></i> 공고 상세
        </Link>
        <h1>{meta.l} 신입사원 모집</h1>
        <div className="career-sum__meta">
          <span>{meta.team}</span>
          <span>신입</span>
          <span>서울</span>
          <span>학력·전공 무관</span>
        </div>

        {/* 공고 전문은 상세 화면(/jobs/[job])이 맡는다. 여기서는 무엇에 지원 중인지만 확인시킨다 */}
        <dl>
          <div>
            <dt>지원 직군</dt>
            <dd>{meta.l}</dd>
          </div>
          <div>
            <dt>접수 기간</dt>
            <dd>
              {event.applyFrom} ~ {event.applyTo}
            </dd>
          </div>
          <div>
            <dt>채용절차</dt>
            <dd>지원서 접수 → 1차 직무 AI 면접(온라인) → Finalist 발표 → 2차 인재상 AI 면접(오프라인)</dd>
          </div>
          <div>
            <dt>공고 전문</dt>
            <dd>
              <Link href={`/event/${event.slug}/jobs/${job}`} style={{ color: "var(--blue-d)" }}>
                {meta.l} 공고 다시 보기
              </Link>
            </dd>
          </div>
        </dl>

        <div className="career-notice">
          <i className="fa-solid fa-circle-info"></i>
          <span>
            <b>안내</b> — {FICTION_NOTICE}
          </span>
        </div>
      </div>

      <div>
        {done ? (
          <div className="apply-card apply-done" style={{ display: "block" }}>
            <div className="dot">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2>지원서가 접수되었습니다.</h2>
            <div className="ev-next">
              <b>다음 일정</b>
              <ul>
                <li>11월 2일~3일 · 입력하신 메일로 응시 안내와 면접 링크를 보내드립니다</li>
                <li>11월 4일~8일 · 1차 직무 AI 면접 (기간 안에서 원하는 시간에 응시)</li>
                <li>11월 11일 · Finalist 발표 (개별 안내)</li>
              </ul>
            </div>
            <Link href={`/event/${event.slug}`} className="btn btn-out">
              행사 안내로 돌아가기
            </Link>
          </div>
        ) : status === "closed" && !preview ? (
          <div className="career-closed" style={{ marginTop: 0 }}>
            <div className="dot">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <h2>접수가 마감되었습니다</h2>
            <p>{event.applyTo}로 접수가 끝났습니다.</p>
          </div>
        ) : (
          /* 모집 전에도 폼을 그대로 보여주고 입력만 잠근다(fieldset disabled).
             "아직 접수 전입니다" 한 장으로 막으면 지원자가 무엇을 적어야 하는지 알 수 없어
             OPEN 첫날 다시 들어올 이유가 생기지 않는다. 제출은 서버도 한 번 더 막는다. */
          <div className="apply-card">
            <div className="ct">지원서 작성</div>
            <div className="cs">
              {meta.l} 직군에 지원합니다. 이력서나 자기소개서는 받지 않습니다.
              {preview && status !== "open" && " (내부 테스트 모드 — 집계에서 제외됩니다)"}
            </div>

            {!open && (
              <div className="career-preopen">
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>
                  <b>{event.applyFrom} 접수 시작</b>
                  아직 제출할 수 없습니다. 어떤 항목을 묻는지 미리 확인해 보세요.
                </span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate>
              {/* fieldset 하나로 내부 입력·버튼을 한꺼번에 잠근다 — 필드마다 disabled 를 달면
                  새 항목이 생길 때 빠뜨린다 */}
              <fieldset disabled={!open}>
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
              />

              <div className={`field${invalid.name ? " invalid" : ""}`}>
                <label htmlFor="ev-name">
                  이름 <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="ev-name"
                  placeholder="실명을 입력해 주세요"
                  value={fields.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                <div className="hint">상장·수료증과 쿠폰에 쓰이므로 실명으로 적어 주세요.</div>
                <div className="err">이름을 실명으로 입력해 주세요.</div>
              </div>

              <div className={`field${invalid.phone ? " invalid" : ""}`}>
                <label htmlFor="ev-phone">
                  휴대폰 번호 <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  id="ev-phone"
                  placeholder="010-1234-5678"
                  value={fields.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
                <div className="hint">이 번호로 참가 혜택 쿠폰을 보내드립니다.</div>
                <div className="err">연락 가능한 번호를 입력해 주세요. (예: 010-1234-5678)</div>
              </div>

              <div className={`field${invalid.email ? " invalid" : ""}`}>
                <label htmlFor="ev-email">
                  이메일 <span className="req">*</span>
                </label>
                <input
                  type="email"
                  id="ev-email"
                  placeholder="hong@example.com"
                  value={fields.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={checkEmail}
                />
                <div className="hint">응시 안내와 AI 면접 링크를 이 주소로 보내드립니다.</div>
                <div className="err">{emailMsg}</div>
              </div>

              <div className={`field${invalid.applicantType ? " invalid" : ""}`}>
                <label htmlFor="ev-type">
                  현재 상태 <span className="req">*</span>
                </label>
                <select
                  id="ev-type"
                  value={fields.applicantType}
                  onChange={(e) => set("applicantType", e.target.value)}
                >
                  <option value="" disabled>
                    선택해 주세요
                  </option>
                  {APPLICANT_TYPES.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
                <div className="hint">참가 대상 확인에만 씁니다. 학교·학년·전공은 묻지 않습니다.</div>
                <div className="err">현재 상태를 선택해 주세요.</div>
              </div>

              <div className={`field${invalid.finalAttend ? " invalid" : ""}`}>
                <label>
                  2차 인재상 AI 면접 참석 가능 여부 <span className="req">*</span>
                </label>
                <div className="hint" style={{ marginTop: 0, marginBottom: 9 }}>
                  {event.final} · Finalist 3인만 참여합니다. 1차 직무 AI 면접까지만 참여하셔도 됩니다.
                  현장에서는 면접·인터뷰와 시상식의 상장 수여 장면을 촬영하며, 촬영물의 홍보 활용은
                  Finalist 확정 후 따로 동의를 받습니다.
                </div>
                <div className="ev-radios">
                  {FINAL_ATTEND_OPTIONS.map((o) => (
                    <label key={o.v} className="ev-radio">
                      <input
                        type="radio"
                        name="ev-final"
                        value={o.v}
                        checked={fields.finalAttend === o.v}
                        onChange={(e) => set("finalAttend", e.target.value)}
                      />
                      <span>{o.l}</span>
                    </label>
                  ))}
                </div>
                <div className="err">참석 가능 여부를 선택해 주세요.</div>
              </div>

              <div className={`field${invalid.howFound ? " invalid" : ""}`}>
                <label htmlFor="ev-how">
                  어떻게 알게 되셨나요? <span className="req">*</span>
                </label>
                <select id="ev-how" value={fields.howFound} onChange={(e) => set("howFound", e.target.value)}>
                  <option value="" disabled>
                    선택해 주세요
                  </option>
                  {EV_HOW_FOUND_OPTIONS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
                <div className="err">유입 경로를 선택해 주세요.</div>
              </div>

              {fields.howFound === EV_HOW_FOUND_ETC && (
                <div className={`field${invalid.howFoundEtc ? " invalid" : ""}`}>
                  <label htmlFor="ev-how-etc">
                    어떤 경로였는지 알려주세요 <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="ev-how-etc"
                    placeholder="예: 학과 단톡방, 동아리 공지"
                    value={fields.howFoundEtc}
                    onChange={(e) => set("howFoundEtc", e.target.value)}
                  />
                  <div className="err">유입 경로를 입력해 주세요.</div>
                </div>
              )}

              <div className="ev-agrees">
                <div className={`agree${agreeInvalid.privacy ? " invalid" : ""}`}>
                  <label className="agree-main">
                    <input
                      type="checkbox"
                      checked={agree.privacy}
                      onChange={(e) => {
                        setAgree((a) => ({ ...a, privacy: e.target.checked }));
                        setAgreeInvalid((m) => ({ ...m, privacy: false }));
                      }}
                    />
                    <span>
                      <b>[필수]</b> 개인정보 수집 및 이용 동의
                    </span>
                  </label>
                  <a className="agree-more" href="/privacy" target="_blank" rel="noopener noreferrer">
                    방침 <i className="fa-solid fa-chevron-right"></i>
                  </a>
                </div>
                {/* 수집 항목·목적·보유기간을 폼 안에서 바로 확인할 수 있게 둔다.
                    파기일(2027-02-28)은 이벤트 페이지 유의사항과 같은 값이어야 한다. */}
                <details className="ev-agree-detail">
                  <summary>수집 항목과 보유기간 보기</summary>
                  <table>
                    <tbody>
                      <tr>
                        <th>수집 항목</th>
                        <td>이름, 휴대폰 번호, 이메일, 지원 직군, 현재 상태, 오프라인 면접 참석 가능 여부, 유입 경로</td>
                      </tr>
                      <tr>
                        <th>이용 목적</th>
                        <td>
                          참가 자격 확인, 행사 안내와 면접 링크 발송, 참가 혜택 발송, Finalist 선발과 안내, 행사 운영
                          통계 작성
                        </td>
                      </tr>
                      <tr>
                        <th>보유기간</th>
                        <td>행사 종료 후 3개월까지 보관하며 2027년 2월 28일까지 전량 파기</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ marginTop: 7 }}>
                    동의하지 않으실 수 있으나, 동의하지 않으면 참가 자격 확인과 면접 링크 발송이 불가능해 지원이
                    어렵습니다.
                  </p>
                </details>

                <div className={`agree${agreeInvalid.fiction ? " invalid" : ""}`}>
                  <label className="agree-main">
                    <input
                      type="checkbox"
                      checked={agree.fiction}
                      onChange={(e) => {
                        setAgree((a) => ({ ...a, fiction: e.target.checked }));
                        setAgreeInvalid((m) => ({ ...m, fiction: false }));
                      }}
                    />
                    <span>
                      <b>[필수]</b> 슈퍼전자가 본 행사를 위한 가상 기업이며, 참가와 결과가 어떠한 기업의 채용에도 영향을
                      주지 않는다는 점을 확인했습니다.
                    </span>
                  </label>
                </div>

                {/* [선택] — 기획안 slide 8. 결과 기사에 응시 데이터를 쓰려면 지원 시점에 받아 둬야 하고,
                    나중에 소급해서 받을 수 없다. 참가에 필수인 항목이 아니므로 선택으로 둔다. */}
                <div className="agree">
                  <label className="agree-main agree-opt">
                    <input
                      type="checkbox"
                      checked={agree.content}
                      onChange={(e) => setAgree((a) => ({ ...a, content: e.target.checked }))}
                    />
                    <span>
                      <b>[선택]</b> 1차 직무 AI 면접 응답을 개인을 식별할 수 없도록 처리한 뒤 보도자료·블로그 등 콘텐츠에
                      활용하는 것에 동의합니다. 동의하지 않으셔도 참가에는 영향이 없습니다.
                    </span>
                  </label>
                </div>
              </div>

              {formErr && <div className="form-err show">{formErr}</div>}
              <button type="submit" className="btn btn-blue" disabled={loading}>
                {loading ? (
                  <>
                    접수 중… <i className="fa-solid fa-spinner fa-spin"></i>
                  </>
                ) : !open ? (
                  <>{event.applyFrom} 접수 시작</>
                ) : (
                  <>
                    지원서 제출하기 <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
              </fieldset>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
