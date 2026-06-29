"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Fields = { name: string; company: string; email: string; role: string; phone: string; size: string; memo: string };
const EMPTY: Fields = { name: "", company: "", email: "", role: "", phone: "", size: "", memo: "" };

export default function ApplyForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [agree, setAgree] = useState(false);
  const [agreeInvalid, setAgreeInvalid] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // index 최종 CTA 등에서 넘어온 ?name=&company=&email= 프리필
  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      setFields((f) => ({
        ...f,
        name: qp.get("name") || f.name,
        company: qp.get("company") || f.company,
        email: qp.get("email") || f.email,
      }));
    } catch {}
  }, []);

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
      memo: fields.memo.trim() || null,
    };

    setLoading(true);
    try {
      const res = await supabase.from("signups").insert(payload);
      if (res.error) throw res.error;
      // 관리자 알림 메일(베스트 에포트 — 실패해도 신청 완료에는 영향 없음)
      fetch("/api/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
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
          <label htmlFor="f-email">업무 이메일 <span className="req">*</span></label>
          <input type="email" id="f-email" placeholder="you@company.com" value={fields.email} onChange={(e) => set("email", e.target.value)} />
          <div className="err">올바른 이메일을 입력해 주세요.</div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="f-role">직무/직책</label>
            <input type="text" id="f-role" placeholder="예: 인사팀장" value={fields.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-phone">연락처</label>
            <input type="tel" id="f-phone" placeholder="010-0000-0000" value={fields.phone} onChange={(e) => set("phone", e.target.value)} />
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
