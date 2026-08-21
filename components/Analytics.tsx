"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// GA4 측정 ID 형식(G-XXXXXXXXXX) · GTM 컨테이너 ID 형식(GTM-XXXXXXX).
const GA_ID_RE = /^G-[A-Z0-9]{4,}$/i;
const GTM_ID_RE = /^GTM-[A-Z0-9]{4,}$/i;

// 저장값(site_settings.ga_measurement_id)으로 Google 태그(gtag)를 주입한다.
// 값은 둘 중 하나를 허용한다:
//   1) 측정 ID 한 줄(G-XXXXXXXXXX) → 표준 gtag.js 스니펫을 자동 생성
//   2) <script>...</script> 가 포함된 전체 gtag 스니펫 → 그대로 주입(커스텀 설정/추가 태그 가능)
// 관리자만 쓰는 신뢰된 값이며, 클라이언트에서 읽으므로 정적 페이지를 동적으로 만들지 않고
// 어드민에서 값을 바꾸면 재배포 없이 반영된다. 값이 없으면 아무것도 주입하지 않는다.
function buildSnippet(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (GA_ID_RE.test(v)) {
    return (
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${v}"></script>` +
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
      `gtag('js',new Date());gtag('config','${v}');</script>`
    );
  }
  // 전체 스니펫을 붙여넣은 경우: 측정 ID가 들어 있을 때만 신뢰하고 그대로 사용
  if (v.includes("<script") && /G-[A-Z0-9]{4,}/i.test(v)) return v;
  return "";
}

// 저장값(site_settings.gtm_container_id)으로 Google Tag Manager 컨테이너를 주입한다.
// GA와 동일하게 컨테이너 ID 한 줄(GTM-XXXXXXX) 또는 전체 GTM 스니펫을 허용한다.
// GTM은 dataLayer 기반이므로 아래 consent default 스크립트가 먼저 실행되면
// 컨테이너 안의 태그들도 Consent Mode v2 상태를 그대로 따른다.
// <noscript> iframe 폴백은 이 스크립트 자체가 JS로 주입되므로 의미가 없어 넣지 않는다.
function buildGtmSnippet(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (GTM_ID_RE.test(v)) {
    return (
      `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
      `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
      `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
      `})(window,document,'script','dataLayer','${v}');</script>`
    );
  }
  if (v.includes("<script") && /GTM-[A-Z0-9]{4,}/i.test(v)) return v;
  return "";
}

// Consent Mode v2: 분석 쿠키는 개인정보처리방침 제10조에 따라 전 방문자에게 사용한다
// (2026-08-21 개정 — 「개인정보 보호법」상 분석 쿠키의 사전 동의는 의무가 아니며,
//  거부 수단은 브라우저 설정·GA 차단 부가기능으로 제공). 광고 관련 항목은 계속 denied.
// 쿠키 동의 배너는 2026-08-21 제거됨 — 방문의 78%가 미클릭·거부로 집계에서 빠지고 있었다.
const ANALYTICS_CONSENT = "granted";

// 배너 시절 저장된 값이 남아 있으면 지운다(더 이상 아무 동작도 좌우하지 않는 잔여 키).
function clearLegacyConsent() {
  try { localStorage.removeItem("cookie_consent"); } catch { /* 접근 불가 환경은 무시 */ }
}

export default function Analytics() {
  const [snippet, setSnippet] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      // Vercel preview 배포에서는 GA 수집 제외 (운영 데이터 오염 방지)
      if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") return;
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", ["ga_measurement_id", "gtm_container_id"]);
      const get = (k: string) => String((data || []).find((r) => r.key === k)?.value || "");
      // GTM을 먼저 두어 컨테이너 안의 태그가 GA 직접 태그보다 늦지 않게 한다.
      if (active) setSnippet(buildGtmSnippet(get("gtm_container_id")) + buildSnippet(get("ga_measurement_id")));
    }

    load();
    clearLegacyConsent();

    return () => {
      active = false;
    };
  }, []);

  // 스니펫 안의 <script> 들을 실제 실행되는 script 엘리먼트로 head에 주입한다.
  // (dangerouslySetInnerHTML 로는 스크립트가 실행되지 않으므로 직접 생성한다.)
  useEffect(() => {
    if (!snippet || !snippet.includes("<script")) return;
    const added: HTMLScriptElement[] = [];
    // 동의 기본값은 gtag('config') 명령보다 먼저 dataLayer에 들어가야 한다.
    const consent = document.createElement("script");
    consent.textContent =
      "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
      "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied'," +
      `ad_personalization:'denied',analytics_storage:'${ANALYTICS_CONSENT}'});`;
    document.head.appendChild(consent);
    added.push(consent);
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
  }, [snippet]);

  return null;
}
