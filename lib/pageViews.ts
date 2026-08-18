import { createClient } from "@supabase/supabase-js";

// 서버 전용: 전 페이지 서버측 조회수(page_views) 집계.
// 쿠키 동의와 무관하게 경로별 카운터만 올린 값이라, GA4가 놓치는 방문자도 포함된다.
// (2026-08-18 점검: GA4는 배너 미클릭 방문자를 denied 처리해 실제의 약 19%만 집계)
// 테이블(add-page-views.sql)이 없으면 조용히 비활성 처리한다 — 리포트는 계속 발송된다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type PathCount = { name: string; count: number };
export type ServerPageViews = {
  available: boolean;   // page_views 조회 성공 여부
  total: number;        // 어제(KST) 전체 조회수
  paths: number;        // 조회된 서로 다른 경로 수
  top: PathCount[];     // 상위 경로
  prevTotal: number | null; // 그제 전체 조회수(전일 대비용)
};

const EMPTY: ServerPageViews = { available: false, total: 0, paths: 0, top: [], prevTotal: null };

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

  const [y, d] = await Promise.all([
    admin.from("page_views").select("path,count").eq("view_date", yday),
    admin.from("page_views").select("count").eq("view_date", dby),
  ]);

  if (y.error) {
    // 테이블 미생성(42P01/PGRST205) 등 — 이 지표만 비활성
    console.warn("page_views unavailable:", y.error.message);
    return EMPTY;
  }

  const rows = y.data ?? [];
  const total = rows.reduce((a, r) => a + (r.count ?? 0), 0);
  const top = [...rows]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, limit)
    .map((r) => ({ name: r.path as string, count: (r.count ?? 0) as number }));

  const prevTotal = d.error ? null : (d.data ?? []).reduce((a, r) => a + (r.count ?? 0), 0);

  return { available: true, total, paths: rows.length, top, prevTotal };
}
