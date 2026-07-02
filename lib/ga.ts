import { JWT } from "google-auth-library";

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
