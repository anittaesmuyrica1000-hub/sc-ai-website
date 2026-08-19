"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/track";
import { getUtm, type Utm } from "@/lib/utm";
import {
  emailError, EMAIL_ERROR_MSG, isValidPhone,
  HOW_FOUND_OPTIONS, HOW_FOUND_ETC, isValidHowFound,
} from "@/lib/leadForm";

// 서비스소개서 리드 폼(페이지판). 기존 모달과 동일하게 /api/send-brochure 호출 →
// 회사 이메일로 보안 링크 전송. 모달과 달리 고유 URL(/brochure)이 있어 GA·UTM 추적이 가능하다.

type Fields = { name: string; company: string; email: string; role: string; phone: string; size: string; howFound: string; howFoundEtc: string };
const EMPTY: Fields = { name: "", company: "", email: "", role: "", phone: "", size: "", howFound: "", howFoundEtc: "" };

export default function BrochureForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  // 이메일은 형식 오류·개인메일 차단으로 사유가 갈려 안내 문구를 따로 둔다
  const [emailMsg, setEmailMsg] = useState(EMAIL_ERROR_MSG.empty);
  const [agree, setAgree] = useState(false);
  const [agreeInvalid, setAgreeInvalid] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [utm, setUtm] = useState<Utm>({});
  const mountTime = useRef(Date.now());

  // UTM 유입 파라미터 캡처 — /brochure URL 우선, 없으면 랜딩 등에서 세션에 저장된 값(lib/utm).
  useEffect(() => {
    const u = getUtm();
    if (Object.keys(u).length) setUtm(u);
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
      // 유입 경로 직접 응답 — utm·referrer가 안 잡히는 유입(카톡·메일 등)을 메운다
      how_found: fields.howFound,
      how_found_detail: fields.howFound === HOW_FOUND_ETC ? fields.howFoundEtc.trim() : null,
    };

    setSending(true);
    try {
      const res = await fetch("/api/send-brochure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...utm }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setSending(false);
        setFormErr(j?.message || "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      // GA4 전환 이벤트 — 서비스소개서 신청 완료(GA4에서 brochure_lead를 주요 이벤트로 지정)
      trackEvent("brochure_lead", { form_type: "brochure", company_size: fields.size, how_found: fields.howFound });
      setDone(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } catch (err) {
      setSending(false);
      setFormErr("요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      console.error("brochure request failed:", err);
    }
  }

  if (done) {
    return (
      <div className="bro-card">
        <div className="bro-done">
          <div className="dot"><i className="fa-solid fa-envelope-circle-check"></i></div>
          <h2>소개서를 보내드렸습니다.</h2>
          <p>입력하신 <b>회사 이메일</b>로 소개서를 보내드렸어요.<br />메일함을 확인해 주세요.</p>
          <p className="sub-note">메일이 안 보이면 스팸함도 확인해 주세요.</p>
          <Link href="/" className="btn btn-out" style={{ marginTop: 18 }}>홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bro-card">
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
        <div className="b-row">
          <div className={`b-field${invalid.name ? " invalid" : ""}`}>
            <label htmlFor="bro-name">이름 <span className="req">*</span></label>
            <input type="text" id="bro-name" placeholder="홍길동" value={fields.name} onChange={(e) => set("name", e.target.value)} />
            <div className="b-err">이름을 입력해 주세요.</div>
          </div>
          <div className={`b-field${invalid.company ? " invalid" : ""}`}>
            <label htmlFor="bro-company">회사명 <span className="req">*</span></label>
            <input type="text" id="bro-company" placeholder="회사명" value={fields.company} onChange={(e) => set("company", e.target.value)} />
            <div className="b-err">회사를 입력해 주세요.</div>
          </div>
        </div>
        <div className={`b-field${invalid.email ? " invalid" : ""}`}>
          <label htmlFor="bro-email">회사 이메일 <span className="req">*</span></label>
          <input type="email" id="bro-email" placeholder="you@company.com" value={fields.email} onChange={(e) => set("email", e.target.value)} onBlur={checkEmail} />
          <div className="b-hint">naver, gmail 등 개인 메일은 사용할 수 없습니다.</div>
          <div className="b-err">{emailMsg}</div>
        </div>
        <div className="b-row">
          <div className="b-field">
            <label htmlFor="bro-role">직무/직책</label>
            <input type="text" id="bro-role" placeholder="예: 인사팀장" value={fields.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className={`b-field${invalid.phone ? " invalid" : ""}`}>
            <label htmlFor="bro-phone">연락처 <span className="req">*</span></label>
            <input type="tel" id="bro-phone" placeholder="010-0000-0000" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
            <div className="b-err">연락 가능한 번호를 입력해 주세요.</div>
          </div>
        </div>
        <div className={`b-field${invalid.size ? " invalid" : ""}`}>
          <label htmlFor="bro-size">연간 채용 규모 <span className="req">*</span></label>
          <select id="bro-size" value={fields.size} onChange={(e) => set("size", e.target.value)}>
            <option value="" disabled>연간 채용 규모를 선택해 주세요</option>
            <option value="1-10">1~10명</option>
            <option value="11-50">11~50명</option>
            <option value="51-200">51~200명</option>
            <option value="200+">200명 이상</option>
          </select>
          <div className="b-err">채용 규모를 선택해 주세요.</div>
        </div>
        <div className={`b-field${invalid.howFound ? " invalid" : ""}`}>
          <label htmlFor="bro-how">어떻게 알게 되셨나요? <span className="req">*</span></label>
          <select id="bro-how" value={fields.howFound} onChange={(e) => set("howFound", e.target.value)}>
            <option value="" disabled>유입 경로를 선택해 주세요</option>
            {HOW_FOUND_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="b-err">유입 경로를 선택해 주세요.</div>
        </div>
        {fields.howFound === HOW_FOUND_ETC && (
          <div className={`b-field${invalid.howFoundEtc ? " invalid" : ""}`}>
            <label htmlFor="bro-how-etc">어떤 경로였는지 알려주세요 <span className="req">*</span></label>
            <input type="text" id="bro-how-etc" placeholder="예: 사내 공유 자료, 협력사 소개" value={fields.howFoundEtc} onChange={(e) => set("howFoundEtc", e.target.value)} />
            <div className="b-err">유입 경로를 입력해 주세요.</div>
          </div>
        )}
        <div className={`bro-agree${agreeInvalid ? " invalid" : ""}`}>
          <label className="bro-agree-main">
            <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setAgreeInvalid(false); }} />
            <span><b>[필수]</b> 개인정보 수집 및 이용 동의</span>
          </label>
          <a className="bro-agree-more" href="/privacy" target="_blank" rel="noopener noreferrer">자세히보기 <i className="fa-solid fa-chevron-right"></i></a>
        </div>
        {formErr && <div className="bro-formerr show">{formErr}</div>}
        <button type="submit" className="btn btn-blue" disabled={sending} style={{ width: "100%" }}>
          {sending ? <>전송 중… <i className="fa-solid fa-spinner fa-spin"></i></> : <>회사 메일로 소개서 받기 <i className="fa-solid fa-paper-plane"></i></>}
        </button>
      </form>
    </div>
  );
}
