"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "../apply/apply.css";
import "./brochure.css";

const BROCHURE_FILE = "/brochure-aiview.pdf";
const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Fields = "name" | "company" | "email" | "role" | "phone" | "size";

export default function BrochurePage() {
  const [v, setV] = useState<Record<Fields, string>>({
    name: "", company: "", email: "", role: "", phone: "", size: "",
  });
  const [agree, setAgree] = useState(false);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [formErr, setFormErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function set(k: Fields, val: string) {
    setV((s) => ({ ...s, [k]: val }));
    if (invalid[k]) setInvalid((s) => ({ ...s, [k]: false }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    const bad: Record<string, boolean> = {};
    if (!v.name.trim()) bad.name = true;
    if (!v.company.trim()) bad.company = true;
    if (!emailRe.test(v.email.trim())) bad.email = true;
    if (!v.size) bad.size = true;
    if (!agree) bad.agree = true;
    setInvalid(bad);
    if (Object.keys(bad).length) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("brochure_requests").insert({
        name: v.name.trim(),
        company: v.company.trim(),
        email: v.email.trim(),
        role: v.role.trim() || null,
        phone: v.phone.trim() || null,
        size: v.size,
      });
      if (error) throw error;
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setLoading(false);
      setFormErr("요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      console.error("brochure request failed:", err);
    }
  }

  return (
    <section className="apply">
      <div className="wrap">
        <div className="apply-grid">
          {/* 좌: 카피 */}
          <div className="apply-copy">
            <div className="eyebrow"><i className="fa-solid fa-file-lines" /> 서비스 소개서</div>
            <h1>AI 면접관<br /><span className="blue">서비스 소개서</span></h1>
            <p className="lead">복잡하고 어려운 채용과정, 이제 결정만 하세요. 정보를 남겨주시면 소개서를 바로 받아보실 수 있습니다.</p>
            <ul className="bro-toc">
              <li><i className="fa-solid fa-circle-check" /> AI 면접 작동 방식과 검증 리포트 예시</li>
              <li><i className="fa-solid fa-circle-check" /> 도입 효과(시간·비용 절감) 데이터</li>
              <li><i className="fa-solid fa-circle-check" /> 요금제와 도입 절차 안내</li>
            </ul>
            <div className="trust">500개 이상의 팀이 신뢰하는 선택</div>
          </div>

          {/* 우: 폼 / 완료 */}
          {!done ? (
            <div className="apply-card">
              <div className="ct">소개서 받기</div>
              <div className="cs">아래 정보를 남겨주시면 소개서를 보내드립니다.</div>
              <form onSubmit={onSubmit} noValidate>
                <div className="field-row">
                  <div className={"field" + (invalid.name ? " invalid" : "")}>
                    <label htmlFor="b-name">이름 <span className="req">*</span></label>
                    <input id="b-name" type="text" placeholder="홍길동" value={v.name} onChange={(e) => set("name", e.target.value)} />
                    <div className="err">이름을 입력해 주세요.</div>
                  </div>
                  <div className={"field" + (invalid.company ? " invalid" : "")}>
                    <label htmlFor="b-company">회사 <span className="req">*</span></label>
                    <input id="b-company" type="text" placeholder="회사명" value={v.company} onChange={(e) => set("company", e.target.value)} />
                    <div className="err">회사를 입력해 주세요.</div>
                  </div>
                </div>

                <div className={"field" + (invalid.email ? " invalid" : "")}>
                  <label htmlFor="b-email">업무 이메일 <span className="req">*</span></label>
                  <input id="b-email" type="email" placeholder="you@company.com" value={v.email} onChange={(e) => set("email", e.target.value)} />
                  <div className="err">올바른 이메일을 입력해 주세요.</div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="b-role">직무 / 직책</label>
                    <input id="b-role" type="text" placeholder="예: 인사팀장" value={v.role} onChange={(e) => set("role", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="b-phone">연락처</label>
                    <input id="b-phone" type="tel" placeholder="010-0000-0000" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>

                <div className={"field" + (invalid.size ? " invalid" : "")}>
                  <label htmlFor="b-size">연간 채용 규모 <span className="req">*</span></label>
                  <select id="b-size" value={v.size} onChange={(e) => set("size", e.target.value)}>
                    <option value="" disabled>선택해 주세요</option>
                    <option value="1-10">1~10명</option>
                    <option value="11-50">11~50명</option>
                    <option value="51-200">51~200명</option>
                    <option value="200+">200명 이상</option>
                  </select>
                  <div className="err">채용 규모를 선택해 주세요.</div>
                </div>

                <label className={"agree" + (invalid.agree ? " invalid" : "")}>
                  <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (invalid.agree) setInvalid((s) => ({ ...s, agree: false })); }} />
                  <span><Link href="/privacy">개인정보 수집·이용</Link>에 동의합니다. (필수)</span>
                </label>

                <div className={"form-err" + (formErr ? " show" : "")}>{formErr}</div>
                <button type="submit" className="btn btn-blue" disabled={loading}>
                  {loading ? <>전송 중… <i className="fa-solid fa-spinner fa-spin" /></> : <>소개서 다운로드 <i className="fa-solid fa-download" /></>}
                </button>
              </form>
            </div>
          ) : (
            <div className="apply-card bro-done">
              <div className="apply-done" style={{ display: "block" }}>
                <div className="dot"><i className="fa-solid fa-file-arrow-down" /></div>
                <h2>소개서가 준비되었습니다.</h2>
                <p>아래 버튼으로 소개서를 내려받으세요.<br />입력하신 이메일로도 보내드립니다.</p>
                <a href={BROCHURE_FILE} download className="btn btn-blue">
                  <i className="fa-solid fa-download" /> 소개서 다운로드
                </a>
                <p className="sub-note">담당자가 도입 관련 안내로 곧 연락드릴 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
