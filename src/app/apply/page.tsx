"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./apply.css";

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Fields = {
  name: string;
  company: string;
  email: string;
  role: string;
  phone: string;
  size: string;
  memo: string;
  agree: boolean;
};

const EMPTY: Fields = {
  name: "",
  company: "",
  email: "",
  role: "",
  phone: "",
  size: "",
  memo: "",
  agree: false,
};

function ApplyForm() {
  const searchParams = useSearchParams();

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [formErr, setFormErr] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const doneRef = useRef<HTMLDivElement>(null);

  // index.html 최종 CTA 인라인 폼에서 넘어온 값을 채운다 (?name=&company=&email=)
  useEffect(() => {
    const next: Partial<Fields> = {};
    (["name", "company", "email"] as const).forEach((key) => {
      const v = searchParams.get(key);
      if (v) next[key] = v;
    });
    if (Object.keys(next).length) {
      setFields((prev) => ({ ...prev, ...next }));
    }
  }, [searchParams]);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // 입력 시 해당 필드의 오류 표시 해제
    setInvalid((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormErr("");

    const nextInvalid: Record<string, boolean> = {};

    if (fields.name.trim() === "") nextInvalid.name = true;
    if (fields.company.trim() === "") nextInvalid.company = true;
    if (fields.email.trim() === "" || !emailRe.test(fields.email.trim()))
      nextInvalid.email = true;
    if (fields.size.trim() === "") nextInvalid.size = true;
    if (!fields.agree) nextInvalid.agree = true;

    if (Object.keys(nextInvalid).length) {
      setInvalid(nextInvalid);
      const first = document.querySelector<HTMLElement>(
        ".field.invalid input, .field.invalid select",
      );
      if (first) first.focus();
      return;
    }

    setInvalid({});

    const payload = {
      name: fields.name.trim(),
      company: fields.company.trim(),
      email: fields.email.trim(),
      role: fields.role.trim() || null,
      phone: fields.phone.trim() || null,
      size: fields.size.trim(),
      memo: fields.memo.trim() || null,
    };

    setLoading(true);
    try {
      const supabase = createClient();
      const res = await supabase.from("signups").insert(payload);
      if (res.error) throw res.error;

      // 저장 성공 → 완료 화면으로 전환
      setDone(true);
      requestAnimationFrame(() => {
        doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch (err) {
      setLoading(false);
      setFormErr("신청 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      console.error("signup insert failed:", err);
    }
  }

  return (
    <section className="apply">
      <div className="wrap">
        <div className="apply-grid">
          {/* 좌: 카피 */}
          <div className="apply-copy">
            <div className="eyebrow">
              <i className="fa-solid fa-bolt" /> AI 면접 채용 검증
            </div>
            <h1>
              이제, 진짜 인재만
              <br />
              <span className="blue">만나보세요.</span>
            </h1>
            <p className="lead">
              수천 명의 지원자를 AI 면접으로 자동 검증하고, 검증된 핵심 인재
              리포트만 받아보세요. 신청하면 담당자가 데모를 안내해 드립니다.
            </p>
            <div className="reassure">
              <span>
                <i className="fa-solid fa-circle-check" /> 설치 없음 — 바로 시작
              </span>
              <span>
                <i className="fa-solid fa-circle-check" /> 계약 없음 — 부담 없이
                체험
              </span>
              <span>
                <i className="fa-solid fa-circle-check" /> 5분이면 충분
              </span>
            </div>
            <div className="trust">500개 이상의 팀이 신뢰하는 선택</div>
          </div>

          {/* 우: 신청 폼 카드 */}
          {!done && (
            <div className="apply-card" id="applyCard">
              <div className="ct">무료 신청</div>
              <div className="cs">
                아래 정보를 남겨주시면 영업일 기준 1일 내 연락드립니다.
              </div>
              <form id="applyForm" noValidate onSubmit={onSubmit}>
                <div className="field-row">
                  <div className={`field${invalid.name ? " invalid" : ""}`}>
                    <label htmlFor="f-name">
                      이름 <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="f-name"
                      name="name"
                      placeholder="홍길동"
                      value={fields.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                    <div className="err">이름을 입력해 주세요.</div>
                  </div>
                  <div className={`field${invalid.company ? " invalid" : ""}`}>
                    <label htmlFor="f-company">
                      회사 <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="f-company"
                      name="company"
                      placeholder="회사명"
                      value={fields.company}
                      onChange={(e) => update("company", e.target.value)}
                    />
                    <div className="err">회사를 입력해 주세요.</div>
                  </div>
                </div>

                <div className={`field${invalid.email ? " invalid" : ""}`}>
                  <label htmlFor="f-email">
                    업무 이메일 <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="f-email"
                    name="email"
                    placeholder="you@company.com"
                    value={fields.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  <div className="err">올바른 이메일을 입력해 주세요.</div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="f-role">직무 / 직책</label>
                    <input
                      type="text"
                      id="f-role"
                      name="role"
                      placeholder="예: 인사팀장"
                      value={fields.role}
                      onChange={(e) => update("role", e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="f-phone">연락처</label>
                    <input
                      type="tel"
                      id="f-phone"
                      name="phone"
                      placeholder="010-0000-0000"
                      value={fields.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className={`field${invalid.size ? " invalid" : ""}`}>
                  <label htmlFor="f-size">
                    연간 채용 규모 <span className="req">*</span>
                  </label>
                  <select
                    id="f-size"
                    name="size"
                    value={fields.size}
                    onChange={(e) => update("size", e.target.value)}
                  >
                    <option value="" disabled>
                      선택해 주세요
                    </option>
                    <option value="1-10">1~10명</option>
                    <option value="11-50">11~50명</option>
                    <option value="51-200">51~200명</option>
                    <option value="200+">200명 이상</option>
                  </select>
                  <div className="err">채용 규모를 선택해 주세요.</div>
                </div>

                <div className="field">
                  <label htmlFor="f-memo">문의 메모</label>
                  <textarea
                    id="f-memo"
                    name="memo"
                    placeholder="궁금한 점이나 도입 배경을 자유롭게 적어주세요."
                    value={fields.memo}
                    onChange={(e) => update("memo", e.target.value)}
                  />
                </div>

                <label
                  className={`agree${invalid.agree ? " invalid" : ""}`}
                  id="f-agree-wrap"
                >
                  <input
                    type="checkbox"
                    id="f-agree"
                    name="agree"
                    checked={fields.agree}
                    onChange={(e) => update("agree", e.target.checked)}
                  />
                  <span>
                    <Link href="/privacy">개인정보 수집·이용</Link>에 동의합니다.
                    (필수)
                  </span>
                </label>

                <div className={`form-err${formErr ? " show" : ""}`} id="formErr">
                  {formErr}
                </div>
                <button
                  type="submit"
                  className="btn btn-blue"
                  id="submitBtn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      전송 중… <i className="fa-solid fa-spinner fa-spin" />
                    </>
                  ) : (
                    <>
                      무료 신청하기 <i className="fa-solid fa-arrow-right" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 우: 제출 완료 상태 (폼 카드 자리 교체) */}
          {done && (
            <div className="apply-card apply-done show" id="applyDone" ref={doneRef}>
              <div className="dot">
                <i className="fa-solid fa-check" />
              </div>
              <h2>신청이 접수되었습니다.</h2>
              <p>
                영업일 기준 1일 내 담당자가
                <br />
                입력해 주신 이메일로 연락드립니다.
              </p>
              <Link href="/" className="btn btn-out">
                홈으로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyForm />
    </Suspense>
  );
}
