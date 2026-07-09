import { JWT } from "google-auth-library";
import { getRealLeadsYesterday, type RealLeads } from "./leads";

// GA4 Data API 조회 — Gmail용과 동일한 Google 서비스계정을 재사용한다(스코프만 analytics.readonly).
// 서비스계정 이메일(GMAIL_SA_CLIENT_EMAIL)에 GA4 속성 "뷰어" 권한 + 프로젝트에 GA Data API 활성화 필요.
// env: GMAIL_SA_CLIENT_EMAIL / GMAIL_SA_PRIVATE_KEY (mailer와 공유), GA_PROPERTY_ID(기본 543685790)
const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DEFAULT_PROPERTY_ID = "543685790";

function creds() {
  const email = process.env.GMAIL_SA_CLIENT_EMAIL;
  const key = process.env.GMAIL_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const propertyId = process.env.GA_PROPERTY_ID || DEFAULT_PROPERTY_ID;
  return { email, key, propertyId };
}

export function gaConfigured() {
  const { email, key } = creds();
  return !!(email && key);
}

async function token() {
  const { email, key } = creds();
  if (!email || !key) throw new Error("GA 서비스계정 미설정(GMAIL_SA_CLIENT_EMAIL/PRIVATE_KEY)");
  const client = new JWT({ email, key, scopes: [GA_SCOPE] });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("GA 액세스 토큰 발급 실패");
  return token;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runReport(body: any) {
  const { propertyId } = creds();
  const t = await token();
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GA Data API ${res.status}: ${await res.text()}`);
  return res.json();
}

// 실시간 리포트(최근 30분) — runReport와 별개 엔드포인트. 실패해도 리포트 전체가 죽지 않게 상위에서 감싼다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runRealtime(body: any) {
  const { propertyId } = creds();
  const t = await token();
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GA Realtime API ${res.status}: ${await res.text()}`);
  return res.json();
}

export type NameCount = { name: string; count: number };
export type DailyStats = {
  dateLabel: string; // 어제 날짜(KST) 표시용
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  topPages: NameCount[];
  topChannels: NameCount[];
};

function n(v: string | undefined) {
  return v ? Number(v) : 0;
}

// 어제(속성 시간대 기준) 핵심 지표
export async function getDailyStats(): Promise<DailyStats> {
  const range = { startDate: "yesterday", endDate: "yesterday" };

  const totals = await runReport({
    dateRanges: [range],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
  });
  const row = totals.rows?.[0]?.metricValues ?? [];

  const pages = await runReport({
    dateRanges: [range],
    dimensions: [{ name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 5,
  });

  const channels = await runReport({
    dateRanges: [range],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 5,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toList = (r: any): NameCount[] =>
    (r.rows ?? []).map((x: any) => ({
      name: x.dimensionValues?.[0]?.value || "(기타)",
      count: n(x.metricValues?.[0]?.value),
    }));

  // 어제 날짜(KST) 라벨
  const seoulNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  seoulNow.setDate(seoulNow.getDate() - 1);
  const dateLabel = `${seoulNow.getFullYear()}-${String(seoulNow.getMonth() + 1).padStart(2, "0")}-${String(seoulNow.getDate()).padStart(2, "0")}`;

  return {
    dateLabel,
    activeUsers: n(row[0]?.value),
    newUsers: n(row[1]?.value),
    sessions: n(row[2]?.value),
    pageViews: n(row[3]?.value),
    topPages: toList(pages),
    topChannels: toList(channels),
  };
}

/* ============================================================
   풍부한 일일 리포트 (7개 섹션 + 인사이트) — getDailyReport()
   실시간·페이지·트래픽획득·인구통계·기기·참여/재방문·이벤트/전환 + 전일 대비 자동 인사이트
   ============================================================ */

export type DailyReport = {
  dateLabel: string;            // 어제 날짜(KST)
  realtimeActiveUsers: number;  // 지금(최근 30분) 활성 사용자
  // 어제 핵심 지표
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  pageViews: number;
  engagementRate: number;       // 0~1
  engagedSessions: number;
  avgEngagementPerSession: number; // 초(세션당 평균 참여시간)
  keyEvents: number;            // 전환(주요 이벤트) 총합 — apply_lead+brochure_lead 등(GA 이벤트, 사내 포함)
  realLeads: RealLeads;         // 실제 리드(Supabase, 사내 @supercoder.co 제외)
  // 전일 대비(그제) 비교용
  prev: { activeUsers: number; sessions: number; engagementRate: number; keyEvents: number };
  // 브레이크다운
  topPages: NameCount[];
  topChannels: NameCount[];
  byDevice: NameCount[];        // deviceCategory × activeUsers
  byCountry: NameCount[];       // country × activeUsers
  topEvents: NameCount[];       // eventName × eventCount
  insights: string[];           // 자동 생성 인사이트 문장들
};

// 초 → "m분 s초" / "s초"
export function fmtDuration(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}분 ${r}초` : `${m}분`;
}

// GA4 주요 이벤트(전환)로 취급할 이벤트 이름
const KEY_EVENT_NAMES = ["apply_lead", "brochure_lead"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listOf = (r: any): NameCount[] =>
  (r.rows ?? []).map((x: any) => ({
    name: x.dimensionValues?.[0]?.value || "(기타)",
    count: n(x.metricValues?.[0]?.value),
  }));

export async function getDailyReport(): Promise<DailyReport> {
  const yday = { startDate: "yesterday", endDate: "yesterday" };
  const dby = { startDate: "2daysAgo", endDate: "2daysAgo" }; // 그제(전일 대비)

  // 실시간 활성 사용자(최근 30분) — 실패해도 0으로 처리
  let realtimeActiveUsers = 0;
  try {
    const rt = await runRealtime({ metrics: [{ name: "activeUsers" }] });
    realtimeActiveUsers = n(rt.rows?.[0]?.metricValues?.[0]?.value);
  } catch (e) {
    console.warn("realtime fetch failed:", e instanceof Error ? e.message : e);
  }

  // 어제/그제 핵심 지표 (신규+재방문 위해 newVsReturning 없이 총량으로, 재방문=active-new 근사)
  const coreMetrics = [
    { name: "activeUsers" },
    { name: "newUsers" },
    { name: "sessions" },
    { name: "screenPageViews" },
    { name: "engagementRate" },
    { name: "engagedSessions" },
    { name: "userEngagementDuration" },
  ];
  const [ydayTot, dbyTot] = await Promise.all([
    runReport({ dateRanges: [yday], metrics: coreMetrics }),
    runReport({ dateRanges: [dby], metrics: coreMetrics }),
  ]);
  const yr = ydayTot.rows?.[0]?.metricValues ?? [];
  const dr = dbyTot.rows?.[0]?.metricValues ?? [];

  const activeUsers = n(yr[0]?.value);
  const newUsers = n(yr[1]?.value);
  const sessions = n(yr[2]?.value);
  const pageViews = n(yr[3]?.value);
  const engagementRate = yr[4]?.value ? Number(yr[4].value) : 0;
  const engagedSessions = n(yr[5]?.value);
  const userEngagementDuration = n(yr[6]?.value); // 초 합계
  const avgEngagementPerSession = sessions ? userEngagementDuration / sessions : 0;
  const returningUsers = Math.max(activeUsers - newUsers, 0);

  // 브레이크다운 + 이벤트 (병렬)
  const [pages, channels, devices, countries, events] = await Promise.all([
    runReport({ dateRanges: [yday], dimensions: [{ name: "pageTitle" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 8 }),
  ]);

  const topEvents = listOf(events);
  // 전환(주요 이벤트) 합계 = 이벤트 목록에서 KEY_EVENT_NAMES 매칭 (metric keyEvents가 커넥터별로 불안정하여 이벤트수 기반)
  const keyEventsYday = topEvents.filter((e) => KEY_EVENT_NAMES.includes(e.name)).reduce((a, b) => a + b.count, 0);

  // 그제 전환(비교용) — 이벤트 이름 필터로 조회
  let prevKeyEvents = 0;
  try {
    const dbyEvents = await runReport({
      dateRanges: [dby],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: KEY_EVENT_NAMES } } },
    });
    prevKeyEvents = listOf(dbyEvents).reduce((a, b) => a + b.count, 0);
  } catch { /* 무시 */ }

  const prev = {
    activeUsers: n(dr[0]?.value),
    sessions: n(dr[2]?.value),
    engagementRate: dr[4]?.value ? Number(dr[4].value) : 0,
    keyEvents: prevKeyEvents,
  };

  // 어제 날짜(KST) 라벨
  const seoulNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  seoulNow.setDate(seoulNow.getDate() - 1);
  const dateLabel = `${seoulNow.getFullYear()}-${String(seoulNow.getMonth() + 1).padStart(2, "0")}-${String(seoulNow.getDate()).padStart(2, "0")}`;

  // 실제 리드(Supabase, 사내 제외) — GA 이벤트는 사내 테스트도 세므로 리드 지표는 DB 기준.
  const realLeads = await getRealLeadsYesterday();

  // ── 자동 인사이트 ─────────────────────────────
  const insights: string[] = [];
  const pct = (cur: number, base: number) => (base ? Math.round(((cur - base) / base) * 100) : cur ? 100 : 0);
  const arrow = (d: number) => (d > 0 ? `▲${d}%` : d < 0 ? `▼${Math.abs(d)}%` : "→0%");
  // 사용자/세션 전일 대비
  const dUsers = pct(activeUsers, prev.activeUsers);
  insights.push(`활성 사용자 ${activeUsers.toLocaleString()}명 (전일 대비 ${arrow(dUsers)}), 세션 ${sessions.toLocaleString()} (${arrow(pct(sessions, prev.sessions))}).`);
  // 참여율
  const erNow = Math.round(engagementRate * 1000) / 10;
  const erPrev = Math.round(prev.engagementRate * 1000) / 10;
  insights.push(`참여율 ${erNow}% (전일 ${erPrev}%), 세션당 평균 참여 ${fmtDuration(avgEngagementPerSession)}.`);
  // 기기
  if (byDeviceShare(listOf(devices))) insights.push(byDeviceShare(listOf(devices))!);
  // 유입 1위
  const topCh = listOf(channels)[0];
  if (topCh) insights.push(`유입 1위: ${topCh.name} (${topCh.count.toLocaleString()} 세션).`);
  // 실제 리드(사내 제외) — Supabase 기준
  if (realLeads.available && realLeads.total > 0) insights.push(`실제 리드 ${realLeads.total}건(도입문의 ${realLeads.apply}·소개서 ${realLeads.brochure}) — 사내(@supercoder.co) 제출 제외.`);
  else if (realLeads.available) insights.push(`어제 실제 리드 0건(사내 제출 제외) — 폼 유입/전환 점검 권장.`);
  // 신규 비중
  if (activeUsers > 0) insights.push(`신규 ${newUsers.toLocaleString()}명 / 재방문 ${returningUsers.toLocaleString()}명 (재방문 ${Math.round((returningUsers / activeUsers) * 100)}%).`);

  return {
    dateLabel,
    realtimeActiveUsers,
    activeUsers, newUsers, returningUsers, sessions, pageViews,
    engagementRate, engagedSessions, avgEngagementPerSession,
    keyEvents: keyEventsYday,
    realLeads,
    prev,
    topPages: listOf(pages),
    topChannels: listOf(channels),
    byDevice: listOf(devices),
    byCountry: listOf(countries),
    topEvents,
    insights,
  };
}

// 기기 점유율 문장 (모바일 vs 데스크톱)
function byDeviceShare(devs: NameCount[]): string | null {
  const total = devs.reduce((a, b) => a + b.count, 0);
  if (!total) return null;
  const label = (k: string) => (k === "desktop" ? "데스크톱" : k === "mobile" ? "모바일" : k === "tablet" ? "태블릿" : k);
  const top = devs[0];
  const share = Math.round((top.count / total) * 100);
  return `기기: ${label(top.name)} ${share}% 우세.`;
}
