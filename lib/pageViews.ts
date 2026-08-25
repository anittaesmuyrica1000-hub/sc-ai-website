import { createClient } from "@supabase/supabase-js";

// 서버 전용: 전 페이지 서버측 조회수(page_views) 집계.
// 쿠키 동의와 무관하게 경로별 카운터만 올린 값이라, GA4가 놓치는 방문자도 포함된다.
// ⚠️ 이 값을 GA4 조회수로 나눠 "포착률"로 쓰지 말 것 — 세는 규칙이 달라 그날 탐색 패턴에 따라
// 널뛴다(2026-08-25 점검: 8/22 96% ↔ 8/24 39%인데 둘 다 태그는 정상이었다).
// 포착률 판정은 사람 수 기준(lib/vercelViews.ts)으로 한다. 이 값은 '실제 방문 규모'로만 읽는다.
// 테이블(add-page-views.sql)이 없으면 조용히 비활성 처리한다 — 리포트는 계속 발송된다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type PathCount = { name: string; count: number };
// 쿠키 동의 상태별 조회수 — 미클릭(none)과 거부(denied)는 GA4에서 똑같이 사라지므로 여기서만 구분된다.
export type ConsentSplit = { none: number; denied: number; granted: number; unknown: number };
export type ServerPageViews = {
  available: boolean;   // page_views 조회 성공 여부
  total: number;        // 어제(KST) 전체 조회수
  paths: number;        // 조회된 서로 다른 경로 수
  top: PathCount[];     // 상위 경로
  prevTotal: number | null; // 그제 전체 조회수(전일 대비용)
  consent: ConsentSplit;    // 동의 상태별 분해
  hasConsentDim: boolean;   // consent 차원 사용 가능 여부(마이그레이션 적용 후 true)
};

const EMPTY: ServerPageViews = {
  available: false, total: 0, paths: 0, top: [], prevTotal: null,
  consent: { none: 0, denied: 0, granted: 0, unknown: 0 }, hasConsentDim: false,
};

// KST 기준 n일 전 날짜(YYYY-MM-DD)
function kstDate(daysAgo: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  d.setDate(d.getDate() - daysAgo);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function getServerPageViewsYesterday(limit = 5): Promise<ServerPageViews> {
  if (!SUPABASE_URL || !SERVICE_KEY) return EMPTY;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const yday = kstDate(1);
  const dby = kstDate(2);

  // consent 차원은 마이그레이션(add-page-views-consent.sql) 적용 후에만 존재 → 실패 시 경로만으로 재조회
  let rows: { path: string; count: number; consent?: string }[] = [];
  let hasConsentDim = true;
  const withConsent = await admin.from("page_views").select("path,count,consent").eq("view_date", yday);
  if (withConsent.error) {
    hasConsentDim = false;
    const plain = await admin.from("page_views").select("path,count").eq("view_date", yday);
    if (plain.error) {
      // 테이블 미생성(42P01/PGRST205) 등 — 이 지표만 비활성
      console.warn("page_views unavailable:", plain.error.message);
      return EMPTY;
    }
    rows = (plain.data ?? []) as typeof rows;
  } else {
    rows = (withConsent.data ?? []) as typeof rows;
  }

  const d = await admin.from("page_views").select("count").eq("view_date", dby);

  const total = rows.reduce((a, r) => a + (r.count ?? 0), 0);

  // 같은 경로가 동의 상태별로 여러 행이므로 경로 기준으로 합산한 뒤 상위를 뽑는다
  const byPath = new Map<string, number>();
  for (const r of rows) byPath.set(r.path, (byPath.get(r.path) ?? 0) + (r.count ?? 0));
  const top = [...byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

  const consent: ConsentSplit = { none: 0, denied: 0, granted: 0, unknown: 0 };
  for (const r of rows) {
    const k = (r.consent ?? "unknown") as keyof ConsentSplit;
    if (k in consent) consent[k] += r.count ?? 0;
    else consent.unknown += r.count ?? 0;
  }

  const prevTotal = d.error ? null : (d.data ?? []).reduce((a, r) => a + (r.count ?? 0), 0);

  return { available: true, total, paths: byPath.size, top, prevTotal, consent, hasConsentDim };
}
