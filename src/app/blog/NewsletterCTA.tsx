"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* 뉴스레터 구독 CTA — roundhr/greeting 패턴. 이메일을 Supabase subscribers 에 저장. */
export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRe.test(email.trim())) {
      setState("error");
      setMsg("올바른 이메일을 입력해 주세요.");
      return;
    }
    setState("loading");
    const supabase = createClient();
    const { error } = await supabase.from("subscribers").insert({ email: email.trim() });
    if (error) {
      // 중복 구독(unique 위반)도 사용자에겐 성공으로 안내
      if (error.code === "23505") {
        setState("done");
        return;
      }
      setState("error");
      setMsg("구독 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setState("done");
  }

  return (
    <section className="news-cta">
      <div className="wrap">
        <div className="news-card">
          <div className="news-copy">
            <div className="eyebrow"><i className="fa-solid fa-envelope-open-text" /> NEWSLETTER</div>
            <h2>채용 인사이트, 메일로 받아보세요</h2>
            <p>AI 면접·채용 검증·HR 트렌드 — 새 글이 올라오면 가장 먼저 알려드립니다.</p>
          </div>
          {state === "done" ? (
            <div className="news-done">
              <i className="fa-solid fa-circle-check" /> 구독해 주셔서 감사합니다.
            </div>
          ) : (
            <form className="news-form" onSubmit={onSubmit}>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
                aria-label="이메일"
              />
              <button type="submit" className="btn btn-blue" disabled={state === "loading"}>
                {state === "loading" ? "구독 중…" : "구독하기"}
              </button>
              {state === "error" && <p className="news-err">{msg}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
