"use client";

import { useEffect, useRef, useState } from "react";

// 서비스소개서 리드 모달 — GNB '서비스소개서'(.js-brochure) 클릭 시 열림. 스타일은 theme.css(.bro-*).
// 제출 시 /api/send-brochure(Next API + Gmail SMTP) 호출 → 회사 이메일로 보안 링크를 전송(가짜 이메일 방지).
const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Fields = { name: string; company: string; email: string; role: string; phone: string; size: string };
const EMPTY: Fields = { name: "", company: "", email: "", role: "", phone: "", size: "" };

export default function BrochureModal() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [agree, setAgree] = useState(false);
  const [agreeInvalid, setAgreeInvalid] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [sending, setSending] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  // GNB '서비스소개서' 클릭(위임) → 모달 열기
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = (e.target as HTMLElement)?.closest?.(".js-brochure, #navBrochure");
      if (t) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      window.dispatchEvent(new Event("app:overlay-open")); // 히어로 입자 애니메이션 일시정지
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
        window.dispatchEvent(new Event("app:overlay-close")); // 닫히면 재개
      };
    }
    document.body.style.overflow = "";
  }, [open]);

  function close() {
    setOpen(false);
  }

  function set<K extends keyof Fields>(k: K, v: string) {
    setFields((f) => ({ ...f, [k]: v }));
    setInvalid((m) => ({ ...m, [k]: false }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    const next: Record<string, boolean> = {
      name: fields.name.trim() === "",
      company: fields.company.trim() === "",
      email: !emailRe.test(fields.email.trim()),
      size: fields.size.trim() === "",
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
      phone: fields.phone.trim() || null,
      size: fields.size,
    };

    setSending(true);
    setFormErr("");
    try {
      const res = await fetch("/api/send-brochure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setSending(false);
        setFormErr(j?.message || "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setDone(true);
    } catch (err) {
      setSending(false);
      setFormErr("요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      console.error("brochure request failed:", err);
    }
  }

  if (!open) return null;

  return (
    <div
      className="bro-modal open"
      id="broModal"
      role="dialog"
      aria-modal="true"
      aria-label="서비스소개서 신청"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bro-card">
        <button type="button" className="bro-close" aria-label="닫기" onClick={close}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div id="broInner">
          {done ? (
            <div className="bro-done">
              <div className="dot"><i className="fa-solid fa-envelope-circle-check"></i></div>
              <h2>소개서를 보내드렸습니다.</h2>
              <p>입력하신 <b>회사 이메일</b>로 소개서 다운로드 링크를<br />보내드렸어요. 메일함을 확인해 주세요.</p>
              <p className="sub-note">메일이 안 보이면 스팸함도 확인해 주세요. 담당자가 도입 관련 안내로 곧 연락드릴 수 있습니다.</p>
            </div>
          ) : (
            <>
              <div className="bro-head">
                <h2>AI 면접관 서비스소개서</h2>
                <p>정보를 남겨주시면 소개서를 바로 받아보실 수 있습니다.</p>
              </div>
              <form onSubmit={onSubmit} noValidate>
                <div className="b-row">
                  <div className={`b-field${invalid.name ? " invalid" : ""}`}>
                    <label htmlFor="bro-name">이름 <span className="req">*</span></label>
                    <input ref={firstRef} type="text" id="bro-name" placeholder="홍길동" value={fields.name} onChange={(e) => set("name", e.target.value)} />
                    <div className="b-err">이름을 입력해 주세요.</div>
                  </div>
                  <div className={`b-field${invalid.company ? " invalid" : ""}`}>
                    <label htmlFor="bro-company">회사 <span className="req">*</span></label>
                    <input type="text" id="bro-company" placeholder="회사명" value={fields.company} onChange={(e) => set("company", e.target.value)} />
                    <div className="b-err">회사를 입력해 주세요.</div>
                  </div>
                </div>
                <div className={`b-field${invalid.email ? " invalid" : ""}`}>
                  <label htmlFor="bro-email">회사 이메일 <span className="req">*</span></label>
                  <input type="email" id="bro-email" placeholder="you@company.com" value={fields.email} onChange={(e) => set("email", e.target.value)} />
                  <div className="b-err">올바른 이메일을 입력해 주세요.</div>
                </div>
                <div className="b-row">
                  <div className="b-field">
                    <label htmlFor="bro-role">직무 / 직책</label>
                    <input type="text" id="bro-role" placeholder="예: 인사팀장" value={fields.role} onChange={(e) => set("role", e.target.value)} />
                  </div>
                  <div className="b-field">
                    <label htmlFor="bro-phone">연락처</label>
                    <input type="tel" id="bro-phone" placeholder="010-0000-0000" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>
                <div className={`b-field${invalid.size ? " invalid" : ""}`}>
                  <label htmlFor="bro-size">연간 채용 규모 <span className="req">*</span></label>
                  <select id="bro-size" value={fields.size} onChange={(e) => set("size", e.target.value)}>
                    <option value="" disabled>선택해 주세요</option>
                    <option value="1-10">1~10명</option>
                    <option value="11-50">11~50명</option>
                    <option value="51-200">51~200명</option>
                    <option value="200+">200명 이상</option>
                  </select>
                  <div className="b-err">채용 규모를 선택해 주세요.</div>
                </div>
                <label className={`bro-agree${agreeInvalid ? " invalid" : ""}`}>
                  <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setAgreeInvalid(false); }} />
                  <span><a href="/privacy" target="_blank" rel="noopener">개인정보 수집·이용</a>에 동의합니다. (필수)</span>
                </label>
                {formErr && <div className="bro-formerr show">{formErr}</div>}
                <button type="submit" className="btn btn-blue" disabled={sending}>
                  {sending ? <>전송 중… <i className="fa-solid fa-spinner fa-spin"></i></> : <>회사 메일로 소개서 받기 <i className="fa-solid fa-paper-plane"></i></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
