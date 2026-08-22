import { JWT } from "google-auth-library";
import { getRealLeadsYesterday, type RealLeads } from "./leads";
import { collectBlogViews, type BlogViews } from "./blogViews";
import { getServerPageViewsYesterday, type ServerPageViews } from "./pageViews";

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
  engagementPending: boolean;   // GA4가 어제 세션 지표를 아직 확정하지 않음 → 참여율 0%는 오탐
  avgEngagementPerSession: number; // 초(세션당 평균 참여시간)
  keyEvents: number;            // 전환(주요 이벤트) 총합 — apply_lead+brochure_lead 등(GA 이벤트, 사내 포함)
  realLeads: RealLeads;         // 실제 리드(Supabase, 사내 @supercoder.co 제외)
  blogViews: BlogViews;         // 서버측 블로그 조회수(동의 무관) — GA4 누락분 감시용
  serverViews: ServerPageViews; // 서버측 전 페이지 조회수(동의 무관) — 실제 방문 규모
  // 전일 대비(그제) 비교용
  prev: { activeUsers: number; sessions: number; engagementRate: number; keyEvents: number };
  // 7일 이동 평균(그제 기준 7일, yesterday 미포함)
  avg7: { activeUsers: number; sessions: number; engagementRate: number };
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
  // 크론은 KST 08:00에 도는데, GA4는 세션 스코프 지표(engagementRate·engagedSessions)를 그때까지
  // 확정하지 못해 0을 반환한다(이벤트 수는 이미 채워져 있어 모순처럼 보임). 참여시간이 있는데
  // 참여 세션이 0이면 미확정으로 판정하고, 0%를 "낮음" 경보로 쓰지 않는다.
  const engagementPending = engagedSessions === 0 && userEngagementDuration > 0;
  const returningUsers = Math.max(activeUsers - newUsers, 0);

  // 브레이크다운 + 이벤트 + 7일 이동 평균 (병렬)
  // 7일 평균: 그제(2daysAgo)부터 8일 전까지 7일간 — yesterday 제외
  const [pages, channels, devices, countries, events, sevenDay] = await Promise.all([
    runReport({ dateRanges: [yday], dimensions: [{ name: "pageTitle" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 5 }),
    runReport({ dateRanges: [yday], dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 8 }),
    runReport({ dateRanges: [{ startDate: "8daysAgo", endDate: "2daysAgo" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "engagementRate" }] }),
  ]);

  const s7r = sevenDay.rows?.[0]?.metricValues ?? [];
  const avg7 = {
    activeUsers: Math.round(n(s7r[0]?.value) / 7),
    sessions: Math.round(n(s7r[1]?.value) / 7),
    engagementRate: s7r[2]?.value ? Number(s7r[2].value) : 0, // GA가 기간 평균 반환
  };

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
  // 서버측 블로그 조회수 — 쿠키 동의와 무관하게 집계되므로 GA4 누락 규모를 감시할 수 있다.
  const [realLeads, blogViews, serverViews] = await Promise.all([
    getRealLeadsYesterday(),
    collectBlogViews(),
    getServerPageViewsYesterday(),
  ]);

  // ── 자동 인사이트 ─────────────────────────────
  const insights: string[] = [];
  const pct = (cur: number, base: number) => (base ? Math.round(((cur - base) / base) * 100) : cur ? 100 : 0);
  const arrow = (d: number) => (d > 0 ? `▲${d}%` : d < 0 ? `▼${Math.abs(d)}%` : "→0%");

  // 1. 트래픽 규모: 전일 대비 + 7일 평균 대비
  const erNow = Math.round(engagementRate * 1000) / 10;
  const erPrev = Math.round(prev.engagementRate * 1000) / 10;
  const dUsers = pct(activeUsers, prev.activeUsers);
  const vs7 = avg7.sessions > 0 ? pct(sessions, avg7.sessions) : null;
  const trafficLevel = vs7 !== null ? (vs7 >= 20 ? "🔥 좋은 날" : vs7 >= -20 ? "평균 수준" : "📉 저조") : "";
  insights.push(
    `활성 사용자 ${activeUsers.toLocaleString()}명 (전일 대비 ${arrow(dUsers)}), 세션 ${sessions.toLocaleString()}` +
    (vs7 !== null ? ` (7일 평균 대비 ${arrow(vs7)}, 평균 ${avg7.sessions}건/일 → ${trafficLevel})` : "") + "."
  );

  // 1-a. 서버측 전 페이지 조회(쿠키 동의 무관) — 실제 방문 규모. GA4 포착률의 분모가 된다.
  if (serverViews.available && serverViews.total > 0) {
    const dPrev = serverViews.prevTotal ? pct(serverViews.total, serverViews.prevTotal) : null;
    insights.push(
      `서버측 전체 조회 ${serverViews.total.toLocaleString()}회 (경로 ${serverViews.paths}개, 쿠키 동의 무관 집계` +
      (dPrev !== null ? `, 전일 대비 ${arrow(dPrev)}` : "") + ")."
    );

    // GA4 포착률 — 쿠키 배너 제거(2026-08-21) 효과를 매일 검증하는 지표.
    // 서버측 집계는 동의와 무관한 실제 방문 규모라, 둘의 비가 곧 GA4가 놓치는 몫이다.
    // 광고 차단 확장·스크립트 차단으로 100%에는 이르지 못하므로 70% 이상이면 정상으로 본다.
    const c = serverViews.consent;
    // 배너 시절(미클릭·거부) 조회는 analytics_storage가 denied라 GA4에 애초에 잡힐 수 없었다.
    // 분모에 섞으면 배너를 제거한 그 날 포착률이 실제보다 낮게 나와 오탐이 된다(2026-08-21 사례).
    // → 태그가 실제로 켜져 있던 조회(granted)만 분모로 쓴다.
    const legacy = c.none + c.denied;
    const usable = serverViews.hasConsentDim && legacy > 0 ? serverViews.total - legacy : serverViews.total;
    const rate = usable > 0 ? Math.round((pageViews / usable) * 100) : 0;
    const verdict = rate >= 70 ? "정상" : rate >= 40 ? "낮음 — 태그 동작 점검 권장" : "⚠️ 대부분 누락 — 즉시 점검 필요";
    insights.push(
      `GA4 포착률: 서버측 ${usable.toLocaleString()}회 대비 ` +
      `GA4 ${pageViews.toLocaleString()}회 (${rate}%) — ${verdict}` +
      (usable !== serverViews.total
        ? ` (분모는 전체 ${serverViews.total.toLocaleString()}회 중 배너 제거 후 ${usable.toLocaleString()}회).`
        : ".")
    );

    // 배너 제거 전 기록이 남아 있는 동안에만 동의 분해를 함께 보여준다(전환 구간 확인용).
    if (serverViews.hasConsentDim && legacy > 0) {
      insights.push(
        `배너 제거 전 기록 포함: 미클릭 ${c.none.toLocaleString()}회 · 거부 ${c.denied.toLocaleString()}회 · ` +
        `허용 ${c.granted.toLocaleString()}회` +
        (c.unknown > 0 ? ` · 미분류 ${c.unknown.toLocaleString()}회` : "") + "."
      );
    }
  }

  // 1-b. 서버측 실측(쿠키 동의 무관) — GA4 세션은 '허용을 누른 방문자' 표본이라 이 값과 함께 읽어야 한다.
  if (blogViews.available && blogViews.delta !== null && blogViews.hours) {
    const gap = pageViews > 0 ? (blogViews.delta / pageViews).toFixed(1) : null;
    insights.push(
      `서버측 블로그 조회 +${blogViews.delta.toLocaleString()}회 (최근 ${blogViews.hours}시간, 쿠키 동의 무관 집계` +
      (blogViews.perDay !== null ? ` · 최근 평균 ${blogViews.perDay}회/일` : "") + ")" +
      (gap ? ` — GA4 조회수 ${pageViews.toLocaleString()}회의 ${gap}배.` : ".")
    );
  } else if (blogViews.available) {
    insights.push(
      `서버측 블로그 누적 조회 ${blogViews.total.toLocaleString()}회 (공개 ${blogViews.postsCount}건) — 일별 증가분은 스냅샷이 2일치 모이면 표시됩니다.`
    );
  }

  // 2. 참여 품질: 참여율 + 수준 라벨 + 세션당 참여시간
  const er7 = Math.round(avg7.engagementRate * 1000) / 10;
  if (engagementPending) {
    // 미확정 상태의 0%를 "낮음" 경보로 내보내면 매일 오탐이 된다(2026-08-17 점검에서 확인).
    insights.push(
      `참여율 집계 중 (GA4가 어제 세션 지표를 아직 확정하지 않음) — 확정치는 그제 ${erPrev}%, 7일 평균 ${er7}%. ` +
      `세션당 평균 참여 ${fmtDuration(avgEngagementPerSession)}.`
    );
  } else {
    const erLabel = erNow >= 60 ? "양호" : erNow >= 40 ? "보통" : "낮음 — 랜딩/콘텐츠 점검 권장";
    insights.push(`참여율 ${erNow}% [${erLabel}] (전일 ${erPrev}%, 7일 평균 ${er7}%), 세션당 평균 참여 ${fmtDuration(avgEngagementPerSession)}.`);
  }

  // 3. 전환(리드): 건수 + 전환율
  if (realLeads.available) {
    if (realLeads.total > 0) {
      const convRate = sessions > 0 ? ((realLeads.total / sessions) * 100).toFixed(1) : "—";
      insights.push(`실제 리드 ${realLeads.total}건 (도입문의 ${realLeads.apply} · 소개서 ${realLeads.brochure}) — 세션 전환율 ${convRate}%, 사내(@supercoder.co) 제외.`);
    } else {
      insights.push(`실제 리드 0건 (사내 제출 제외) — 폼 유입/CTA 전환 점검 권장.`);
    }
  }

  // 4. 인기 페이지
  const topPage = listOf(pages)[0];
  if (topPage) insights.push(`최다 조회 페이지: "${topPage.name}" (${topPage.count.toLocaleString()}회).`);

  // 5. 유입 1위 채널
  const topCh = listOf(channels)[0];
  if (topCh) insights.push(`유입 1위: ${topCh.name} (${topCh.count.toLocaleString()} 세션).`);

  // 6. 신규 vs 재방문
  if (activeUsers > 0) insights.push(`신규 ${newUsers.toLocaleString()}명 / 재방문 ${returningUsers.toLocaleString()}명 (재방문 비중 ${Math.round((returningUsers / activeUsers) * 100)}%).`);

  // 7. 기기 우세
  const devShare = byDeviceShare(listOf(devices));
  if (devShare) insights.push(devShare);

  return {
    dateLabel,
    realtimeActiveUsers,
    activeUsers, newUsers, returningUsers, sessions, pageViews,
    engagementRate, engagedSessions, engagementPending, avgEngagementPerSession,
    keyEvents: keyEventsYday,
    realLeads,
    blogViews,
    serverViews,
    prev,
    avg7,
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
