"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { supabase } from "@/lib/supabase";

// GA4 측정 ID 형식(G-XXXXXXXXXX). 관리자만 쓰지만 방어적으로 형식 검증 후에만 주입.
const GA_ID_RE = /^G-[A-Z0-9]{4,}$/i;

// 사이트 전역 설정(site_settings.ga_measurement_id)을 읽어 Google Analytics(gtag)를 주입한다.
// 클라이언트에서 읽으므로 정적 페이지를 동적으로 만들지 않고, 어드민에서 ID를 바꾸면 재배포 없이 반영된다.
// site_settings 테이블/값이 없으면 아무것도 렌더하지 않는다(GA 미설치 상태).
export default function Analytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ga_measurement_id")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const id = String(data?.value || "").trim();
        if (GA_ID_RE.test(id)) setGaId(id);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
