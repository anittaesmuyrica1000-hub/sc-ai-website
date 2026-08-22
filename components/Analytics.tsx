"use client";

import { useEffect } from "react";
import { CONSENT_DEFAULT_JS } from "@/lib/consent";

// Google 태그의 **예외 경로**만 담당한다.
//
// 정상 경로(측정 ID 한 줄 G-XXXX / GTM-XXXX)는 layout이 서버에서 <head>에 직접 심는다.
// 2026-08-22 점검 전에는 이 컴포넌트가 하이드레이션 → Supabase 왕복 → 스크립트 주입을
// 모두 맡아서 GA4 첫 히트가 4.2초에야 나갔고, 그 전에 이탈한 방문자가 통째로 누락됐다.
// (같은 페이지의 서버측 카운터는 3.4초에 기록 → 일일 리포트의 "GA4 포착률 28%".)
//
// 여기 남는 일은 두 가지뿐이다:
//   1) 어드민이 ID 대신 전체 <script> 스니펫을 붙여넣은 경우 — 임의 태그 조합이라
//      서버 JSX로는 그대로 못 심으므로 기존처럼 클라이언트에서 주입한다.
//   2) 배너 시절 localStorage 잔여 키 정리.
type Props = {
  gaRaw?: string;          // 전체 gtag 스니펫(서버가 ID로 해석하지 못한 경우)
  gtmRaw?: string;         // 전체 GTM 스니펫
  consentInjected?: boolean; // 서버가 consent default를 이미 심었는지
};

// 배너 시절 저장된 값이 남아 있으면 지운다(더 이상 아무 동작도 좌우하지 않는 잔여 키).
function clearLegacyConsent() {
  try { localStorage.removeItem("cookie_consent"); } catch { /* 접근 불가 환경은 무시 */ }
}

export default function Analytics({ gaRaw = "", gtmRaw = "", consentInjected = false }: Props) {
  useEffect(() => { clearLegacyConsent(); }, []);

  // 스니펫 안의 <script> 들을 실제 실행되는 script 엘리먼트로 head에 주입한다.
  // (dangerouslySetInnerHTML 로는 스크립트가 실행되지 않으므로 직접 생성한다.)
  useEffect(() => {
    // GTM을 먼저 두어 컨테이너 안의 태그가 GA 직접 태그보다 늦지 않게 한다.
    const snippet = gtmRaw + gaRaw;
    if (!snippet.includes("<script")) return;

    const added: HTMLScriptElement[] = [];
    // 서버가 이미 심었으면 중복으로 넣지 않는다 — consent default는 한 번만 나가야 한다.
    if (!consentInjected) {
      const consent = document.createElement("script");
      consent.textContent = CONSENT_DEFAULT_JS;
      document.head.appendChild(consent);
      added.push(consent);
    }
    const tmp = document.createElement("div");
    tmp.innerHTML = snippet;
    tmp.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value);
      if (old.textContent) s.textContent = old.textContent;
      document.head.appendChild(s);
      added.push(s);
    });
    return () => { added.forEach((s) => s.remove()); };
  }, [gaRaw, gtmRaw, consentInjected]);

  return null;
}
