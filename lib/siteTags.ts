import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export { CONSENT_DEFAULT_JS } from "./consent";

// 서버에서 Google 태그 설정(site_settings)을 읽어 layout의 <head>에 바로 심기 위한 헬퍼.
//
// 왜 서버로 옮겼나 — 2026-08-22 점검:
//   기존에는 Analytics(클라이언트)가 하이드레이션 → Supabase 왕복 → 스크립트 주입 순서로 동작해
//   운영 실측에서 GA4 첫 히트(/g/collect)가 페이지 시작 후 4.2초에야 나갔다.
//   같은 페이지의 서버측 카운터(increment_page_view)는 3.4초에 이미 기록돼,
//   4초 안에 이탈한 방문자가 "서버측에는 있고 GA4에는 없는" 상태로 남았다 → 포착률 28%.
//   <head>에 직접 렌더하면 HTML 파싱 시점(수백 ms)에 실행돼 이 격차가 사라진다.
//
// 어드민에서 값을 바꾸면 재배포 없이 반영되던 성질은 그대로 유지한다 — unstable_cache의
// revalidate(5분)로 갱신되며, 그 사이 페이지는 계속 정적으로 서빙된다.
const REVALIDATE_SEC = 300;

// GA4 측정 ID 형식(G-XXXXXXXXXX) · GTM 컨테이너 ID 형식(GTM-XXXXXXX).
const GA_ID_RE = /^G-[A-Z0-9]{4,}$/i;
const GTM_ID_RE = /^GTM-[A-Z0-9]{4,}$/i;


export type SiteTags = {
  gaId: string;   // 서버에서 <head>에 심을 GA4 측정 ID (없으면 "")
  gtmId: string;  // 서버에서 <head>에 심을 GTM 컨테이너 ID (없으면 "")
  gaRaw: string;  // 어드민이 전체 <script> 스니펫을 붙여넣은 경우 — 클라이언트가 주입
  gtmRaw: string; // 〃
};

const EMPTY: SiteTags = { gaId: "", gtmId: "", gaRaw: "", gtmRaw: "" };

// 저장값을 "ID 한 줄"과 "전체 스니펫" 두 형태로 나눈다.
// ID 한 줄이면 서버에서 바로 스크립트를 만들 수 있고(빠른 경로),
// 전체 스니펫은 임의 <script> 조합이라 클라이언트 주입에 맡긴다(기존 동작 유지).
function split(raw: string, idRe: RegExp, idInSnippet: RegExp): { id: string; snippet: string } {
  const v = raw.trim();
  if (!v) return { id: "", snippet: "" };
  if (idRe.test(v)) return { id: v, snippet: "" };
  if (v.includes("<script") && idInSnippet.test(v)) return { id: "", snippet: v };
  return { id: "", snippet: "" };
}

const load = unstable_cache(
  async (): Promise<SiteTags> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return EMPTY;
    try {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await db
        .from("site_settings")
        .select("key,value")
        .in("key", ["ga_measurement_id", "gtm_container_id"]);
      if (error) return EMPTY;
      const get = (k: string) => String((data || []).find((r) => r.key === k)?.value || "");
      const ga = split(get("ga_measurement_id"), GA_ID_RE, /G-[A-Z0-9]{4,}/i);
      const gtm = split(get("gtm_container_id"), GTM_ID_RE, /GTM-[A-Z0-9]{4,}/i);
      return { gaId: ga.id, gtmId: gtm.id, gaRaw: ga.snippet, gtmRaw: gtm.snippet };
    } catch {
      // 설정 조회 실패가 페이지 렌더를 막지 않게 한다 — 태그만 빠진다.
      return EMPTY;
    }
  },
  ["site-tags"],
  { revalidate: REVALIDATE_SEC, tags: ["site-tags"] }
);

export async function getSiteTags(): Promise<SiteTags> {
  // Vercel preview 배포에서는 GA 수집 제외 (운영 데이터 오염 방지)
  if (process.env.VERCEL_ENV === "preview") return EMPTY;
  return load();
}

// GTM 컨테이너 부트스트랩 — dataLayer 기반이라 위 consent default 뒤에 와야 한다.
// <noscript> iframe 폴백은 JS 없는 방문자를 위한 것인데, 우리 사이트 자체가 JS 앱이라 넣지 않는다.
export function gtmBootstrapJs(id: string): string {
  return (
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
    `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
    `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
    `})(window,document,'script','dataLayer','${id}');`
  );
}

export function gtagConfigJs(id: string): string {
  return `gtag('js',new Date());gtag('config','${id}');`;
}
