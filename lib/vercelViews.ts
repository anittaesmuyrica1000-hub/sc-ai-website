// 서버 전용: Vercel Web Analytics(쿠키리스 실측)에서 어제(KST) 방문자·조회수를 가져온다.
//
// 왜 필요한가 — GA4 포착률의 분모를 "조회수"가 아니라 "사람 수"로 잡기 위해서다.
// 조회수끼리 비교하면 두 집계가 서로 다른 규칙으로 세기 때문에 값이 널뛴다
// (2026-08-25 점검: 8/22 96% ↔ 8/24 39%, 사람 수로 보면 같은 기간 내내 54~105%로 안정적).
//   - 서버측 page_views(increment_page_view): 탭세션×경로당 1회 → 페이지를 넘길수록 증가
//   - GA4 screenPageViews: SPA 이동 후 히트가 약 1.8초 늦게 나가 빠른 이동은 통째로 누락
//   → 같은 방문자 1명이 서버측 3회 / GA4 1회가 되어 "67% 누락"으로 보인다(실제 누락 0명).
// 사람 수는 이 차이에 영향을 받지 않으므로 계측 건강도 판정에 쓸 수 있다.
//
// env: VERCEL_ANALYTICS_TOKEN(서버 전용·필수) · VERCEL_PROJECT_ID · VERCEL_TEAM_ID(기본값 내장)
// 미설정·실패 시 조용히 available:false — 리포트 발송 자체는 막지 않는다.
const TOKEN = process.env.VERCEL_ANALYTICS_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_iA3dSllyREa7UHyhyBDkrEn9pcNi";
const TEAM_ID = process.env.VERCEL_TEAM_ID || "team_n6q1PTxUVr5pzkD5NkYtQ0tu";

// 사내 관리자 화면은 제외 — 서버측 page_views·GA4 분자와 기준을 맞춘다.
const FILTER = "requestPath ne '/admin'";

export type VercelViews = {
  available: boolean;        // 조회 성공 여부
  visitors: number;          // 어제(KST) 방문자 — 포착률의 분모
  pageviews: number;         // 어제(KST) 조회수 — 서버측 집계와의 교차검증용
  prevVisitors: number | null; // 그제(KST) 방문자(전일 대비용)
};

const EMPTY: VercelViews = { available: false, visitors: 0, pageviews: 0, prevVisitors: null };

export function vercelAnalyticsConfigured() {
  return !!TOKEN;
}

// KST 하루(00:00~24:00)에 해당하는 UTC 구간.
// count 엔드포인트는 범위를 UTC 일 단위로 내림해 KST 하루와 9시간 어긋나므로 쓸 수 없다.
// aggregate 엔드포인트는 임의 시각을 그대로 받되 until을 다음 정시로 올림하므로,
// until을 시작 +23시간으로 주면 정확히 24개 시간 버킷(= KST 하루)이 된다.
function kstDayWindowUtc(daysAgo: number): { since: string; until: string } {
  const seoul = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  seoul.setDate(seoul.getDate() - daysAgo);
  // KST 자정 = 같은 날짜의 UTC 자정에서 9시간 전
  const start = Date.UTC(seoul.getFullYear(), seoul.getMonth(), seoul.getDate()) - 9 * 3_600_000;
  return {
    since: new Date(start).toISOString(),
    until: new Date(start + 23 * 3_600_000).toISOString(),
  };
}

// 한 구간의 방문자·조회수. by=environment로 묶어 production 행만 읽는다 —
// aggregate는 그룹 단위로 방문자를 중복제거하므로, 상수에 가까운 차원으로 묶으면
// 구간 전체의 순방문자를 한 행으로 얻을 수 있다(시간별 합산은 중복제거가 깨져 쓸 수 없다).
async function fetchWindow(since: string, until: string) {
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/aggregate");
  url.searchParams.set("projectId", PROJECT_ID);
  url.searchParams.set("teamId", TEAM_ID);
  url.searchParams.set("by", "environment");
  url.searchParams.set("since", since);
  url.searchParams.set("until", until);
  url.searchParams.set("filter", FILTER);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Vercel Web Analytics ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as { data?: { environment?: string; visitors?: number; pageviews?: number }[] };
  const row = (json.data ?? []).find((r) => r.environment === "production");
  return { visitors: row?.visitors ?? 0, pageviews: row?.pageviews ?? 0 };
}

export async function getVercelViewsYesterday(): Promise<VercelViews> {
  if (!TOKEN) return EMPTY;

  const yday = kstDayWindowUtc(1);
  try {
    const cur = await fetchWindow(yday.since, yday.until);

    // 전일 대비는 부가 정보 — 실패해도 어제 수치는 그대로 보고한다.
    let prevVisitors: number | null = null;
    try {
      const dby = kstDayWindowUtc(2);
      prevVisitors = (await fetchWindow(dby.since, dby.until)).visitors;
    } catch {
      /* 그제 조회 실패는 무시 */
    }

    return { available: true, visitors: cur.visitors, pageviews: cur.pageviews, prevVisitors };
  } catch (e) {
    console.warn("vercel web analytics unavailable:", e instanceof Error ? e.message : e);
    return EMPTY;
  }
}
