"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// GA4 측정 ID 형식(G-XXXXXXXXXX).
const GA_ID_RE = /^G-[A-Z0-9]{4,}$/i;

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

export default function Analytics() {
  const [snippet, setSnippet] = useState("");

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ga_measurement_id")
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSnippet(buildSnippet(String(data?.value || "")));
      });
    return () => { active = false; };
  }, []);

  // 스니펫 안의 <script> 들을 실제 실행되는 script 엘리먼트로 head에 주입한다.
  // (dangerouslySetInnerHTML 로는 스크립트가 실행되지 않으므로 직접 생성한다.)
  useEffect(() => {
    if (!snippet || !snippet.includes("<script")) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = snippet;
    const added: HTMLScriptElement[] = [];
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
