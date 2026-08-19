"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/track";
import { getUtm, type Utm } from "@/lib/utm";
import {
  emailError, EMAIL_ERROR_MSG, isValidPhone,
  HOW_FOUND_OPTIONS, HOW_FOUND_ETC, isValidHowFound,
} from "@/lib/leadForm";

type Fields = { name: string; company: string; email: string; role: string; phone: string; size: string; howFound: string; howFoundEtc: string; memo: string };
const EMPTY: Fields = { name: "", company: "", email: "", role: "", phone: "", size: "", howFound: "", howFoundEtc: "", memo: "" };

export default function ApplyForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  // 이메일은 형식 오류·개인메일 차단으로 사유가 갈려 안내 문구를 따로 둔다
  const [emailMsg, setEmailMsg] = useState(EMAIL_ERROR_MSG.empty);
  const [agree, setAgree] = useState(false);
  const [agreeInvalid, setAgreeInvalid] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [utm, setUtm] = useState<Utm>({});
  const [honeypot, setHoneypot] = useState("");
  const mountTime = useRef(Date.now());

  // index 최종 CTA 등에서 넘어온 ?name=&company=&email= 프리필 + UTM 캡처
  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      setFields((f) => ({
        ...f,
        name: qp.get("name") || f.name,
        company: qp.get("company") || f.company,
        email: qp.get("email") || f.email,
      }));
      // UTM 유입 파라미터 캡처 — /apply URL 우선, 없으면 랜딩 등에서 세션에 저장된 값(lib/utm).
      const u = getUtm();
      if (Object.keys(u).length) setUtm(u);
    } catch {}
  }, []);

  function set<K extends keyof Fields>(k: K, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
    setInvalid((m) => ({ ...m, [k]: false }));
  }

  // 이메일은 입력을 마쳤을 때(blur) 먼저 알려준다 — 제출 버튼에서 막히는 것보다 덜 답답하다
  function checkEmail() {
    if (!fields.email.trim()) return;
    const e = emailError(fields.email);
    if (e) { setEmailMsg(EMAIL_ERROR_MSG[e]); setInvalid((m) => ({ ...m, email: true })); }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    // 봇 감지: 허니팟 채워졌거나 5초 미만 제출 → 가짜 성공(재시도 방지)
    if (honeypot || Date.now() - mountTime.current < 5000) {
      setDone(true);
      return;
    }
    const emailErr = emailError(fields.email);
    if (emailErr) setEmailMsg(EMAIL_ERROR_MSG[emailErr]);
    const next: Record<string, boolean> = {
      name: fields.name.trim() === "",
      company: fields.company.trim() === "",
      email: emailErr !== null,
      phone: !isValidPhone(fields.phone),
      size: fields.size.trim() === "",
      howFound: !isValidHowFound(fields.howFound),
      howFoundEtc: fields.howFound === HOW_FOUND_ETC && fields.howFoundEtc.trim() === "",
    };
    setInvalid(next);
    const agreeBad = !agree;
    setAgreeInvalid(agreeBad);
    if (Object.values(next).some(Boolean) || agreeBad) return;

    const payload = {
      name: fields.name.trim(),
      company: fields.company.trim(),
      email: fields.email.trim(),
      role: fields.role.trim() || null,
      phone: fields.phone.trim(),
      size: fields.size,
      memo: fields.memo.trim() || null,
    };
    // 유입 경로 직접 응답 — utm·referrer가 안 잡히는 유입(카톡·메일 등)을 메운다
    const howFound = {
      how_found: fields.howFound,
      how_found_detail: fields.howFound === HOW_FOUND_ETC ? fields.howFoundEtc.trim() : null,
    };

    setLoading(true);
    try {
      // 마이그레이션(docs/sql/add-how-found.sql·UTM 컬럼)이 아직 안 적용됐을 수 있으므로
      // 전체 → 유입경로 제외 → UTM까지 제외 순으로 축소 재시도해 접수 유실을 막는다.
      let res = await supabase.from("signups").insert({ ...payload, ...howFound, ...utm });
      if (res.error) {
        console.warn("signup insert with how_found failed, retrying without it:", res.error);
        res = await supabase.from("signups").insert({ ...payload, ...utm });
      }
      if (res.error && Object.keys(utm).length) {
        console.warn("signup insert with utm failed, retrying without utm:", res.error);
        res = await supabase.from("signups").insert(payload);
      }
      if (res.error) throw res.error;
      // 관리자 알림 메일(베스트 에포트 — 실패해도 신청 완료에는 영향 없음)
      fetch("/api/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...howFound, ...utm }),
      }).catch(() => {});
      // GA4 전환 이벤트 — 도입문의 폼 제출 완료(GA4에서 apply_lead를 주요 이벤트로 지정)
      trackEvent("apply_lead", { form_type: "apply", company_size: fields.size, how_found: fields.howFound });
      setDone(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } catch (err) {
      setLoading(false);
      setFormErr("신청 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      console.error("signup insert failed:", err);
    }
  }

  if (done) {
    return (
      <div className="apply-card apply-done" style={{ display: "block" }}>
        <div className="dot"><i className="fa-solid fa-check"></i></div>
        <h2>문의가 접수되었습니다.</h2>
        <p>영업일 기준 1일 내 담당자가<br />입력해 주신 이메일로 연락드립니다.</p>
        <Link href="/" className="btn btn-out">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="apply-card">
      <div className="ct">도입 상담 신청</div>
      <div className="cs">남겨주신 정보를 바탕으로 담당자가 맞춤 도입 방안을 안내해드립니다.</div>
      <form onSubmit={onSubmit} noValidate>
        {/* 허니팟: 사람은 안 보이는 필드, 봇이 채우면 제출 차단 */}
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
        <div className="field-row">
          <div className={`field${invalid.name ? " invalid" : ""}`}>
            <label htmlFor="f-name">이름 <span className="req">*</span></label>
            <input type="text" id="f-name" placeholder="홍길동" value={fields.name} onChange={(e) => set("name", e.target.value)} />
            <div className="err">이름을 입력해 주세요.</div>
          </div>
          <div className={`field${invalid.company ? " invalid" : ""}`}>
            <label htmlFor="f-company">회사명 <span className="req">*</span></label>
            <input type="text" id="f-company" placeholder="회사명" value={fields.company} onChange={(e) => set("company", e.target.value)} />
            <div className="err">회사를 입력해 주세요.</div>
          </div>
        </div>

        <div className={`field${invalid.email ? " invalid" : ""}`}>
          <label htmlFor="f-email">회사 이메일 <span className="req">*</span></label>
          <input type="email" id="f-email" placeholder="you@company.com" value={fields.email} onChange={(e) => set("email", e.target.value)} onBlur={checkEmail} />
          <div className="hint">naver, gmail 등 개인 메일은 사용할 수 없습니다.</div>
          <div className="err">{emailMsg}</div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="f-role">직무/직책</label>
            <input type="text" id="f-role" placeholder="예: 인사팀장" value={fields.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className={`field${invalid.phone ? " invalid" : ""}`}>
            <label htmlFor="f-phone">연락처 <span className="req">*</span></label>
            <input type="tel" id="f-phone" placeholder="010-0000-0000" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
            <div className="err">연락 가능한 번호를 입력해 주세요.</div>
          </div>
        </div>

        <div className={`field${invalid.size ? " invalid" : ""}`}>
          <label htmlFor="f-size">연간 채용 규모 <span className="req">*</span></label>
          <select id="f-size" value={fields.size} onChange={(e) => set("size", e.target.value)}>
            <option value="" disabled>연간 채용 규모를 선택해 주세요</option>
            <option value="1-10">1~10명</option>
            <option value="11-50">11~50명</option>
            <option value="51-200">51~200명</option>
            <option value="200+">200명 이상</option>
          </select>
          <div className="err">채용 규모를 선택해 주세요.</div>
        </div>

        <div className={`field${invalid.howFound ? " invalid" : ""}`}>
          <label htmlFor="f-how">어떻게 알게 되셨나요? <span className="req">*</span></label>
          <select id="f-how" value={fields.howFound} onChange={(e) => set("howFound", e.target.value)}>
            <option value="" disabled>유입 경로를 선택해 주세요</option>
            {HOW_FOUND_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="err">유입 경로를 선택해 주세요.</div>
        </div>

        {fields.howFound === HOW_FOUND_ETC && (
          <div className={`field${invalid.howFoundEtc ? " invalid" : ""}`}>
            <label htmlFor="f-how-etc">어떤 경로였는지 알려주세요 <span className="req">*</span></label>
            <input type="text" id="f-how-etc" placeholder="예: 사내 공유 자료, 협력사 소개" value={fields.howFoundEtc} onChange={(e) => set("howFoundEtc", e.target.value)} />
            <div className="err">유입 경로를 입력해 주세요.</div>
          </div>
        )}

        <div className="field">
          <label htmlFor="f-memo">문의 내용</label>
          <textarea id="f-memo" placeholder="궁금한 점이나 도입 배경을 자유롭게 적어주세요." value={fields.memo} onChange={(e) => set("memo", e.target.value)} />
        </div>

        <div className={`agree${agreeInvalid ? " invalid" : ""}`}>
          <label className="agree-main">
            <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setAgreeInvalid(false); }} />
            <span><b>[필수]</b> 개인정보 수집 및 이용 동의</span>
          </label>
          <a className="agree-more" href="/privacy" target="_blank" rel="noopener noreferrer">자세히보기 <i className="fa-solid fa-chevron-right"></i></a>
        </div>

        {formErr && <div className="form-err show">{formErr}</div>}
        <button type="submit" className="btn btn-blue" disabled={loading}>
          {loading ? <>전송 중… <i className="fa-solid fa-spinner fa-spin"></i></> : <>도입 문의하기 <i className="fa-solid fa-arrow-right"></i></>}
        </button>
      </form>
    </div>
  );
}
