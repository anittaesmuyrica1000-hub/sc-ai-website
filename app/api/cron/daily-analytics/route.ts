import { NextRequest } from "next/server";
import { getDailyReport, fmtDuration, gaConfigured, captureRate, type NameCount } from "@/lib/ga";
import { sendMail, mailerConfigured } from "@/lib/mailer";
// 매일 오전 8시(KST) GA4 어제 지표 요약 + 인사이트를 이메일로 발송하는 크론 엔드포인트.
// Vercel Cron이 GET으로 호출(설정: vercel.json). 스케줄 "0 23 * * *"(UTC) = 08:00 KST.
// 보안: CRON_SECRET 설정 시 Authorization: Bearer <CRON_SECRET> 또는 ?key=<CRON_SECRET> 필요.
// 수신자: ANALYTICS_REPORT_TO(콤마로 여러 명 가능). 기본: juhee + 대표(jay.choi).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TO = "juhee.kim@supercoder.co, jay.choi@supercoder.co";
const SITE = "https://www.supercoder.co";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 시크릿 미설정 시 통과(설정 권장)
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
}

// 이름-수치 표 행 (수치 오른쪽 정렬)
function rows(list: NameCount[], emptyText: string, fmt: (n: number) => string = (n) => n.toLocaleString()): string {
  if (!list.length) return `<tr><td colspan="2" style="padding:8px 12px;color:#8a94a6;font-size:13px">${emptyText}</td></tr>`;
  return list
    .map(
      (x, i) => `<tr style="border-top:1px solid #eef1f6">
        <td style="padding:8px 12px;font-size:13.5px;color:#1b2333">${i + 1}. ${escapeHtml(x.name)}</td>
        <td style="padding:8px 12px;font-size:13.5px;color:#1b2333;text-align:right;font-weight:700">${fmt(x.count)}</td>
      </tr>`
    )
    .join("");
}

function metricCard(label: string, value: string) {
  return `<td style="padding:14px 8px;text-align:center;background:#f6f8fc;border-radius:12px">
    <div style="font-size:22px;font-weight:800;color:#2e6cf0;line-height:1.1">${value}</div>
    <div style="font-size:11.5px;color:#5b6577;margin-top:4px">${label}</div>
  </td>`;
}

function sectionTitle(t: string) {
  return `<div style="font-size:13px;font-weight:800;color:#1b2333;margin:24px 0 6px">${t}</div>`;
}

// 지표 카드 묶음의 머리말 — 이 줄들이 "무엇을 센 숫자인지"를 카드마다 다시 설명하지 않아도 되게 한다.
// 세 묶음의 출처가 서로 달라(실측 / GA4 표본 / DB) 섞어 비교하면 안 되는데, 예전 배치는
// 그 경계가 보이지 않아 조회수끼리 나누는 오해를 불렀다(2026-08-24 오탐).
function groupLabel(title: string, hint: string, badge = "") {
  return `<div style="margin:22px 0 8px">
    <span style="font-size:13px;font-weight:800;color:#1b2333">${title}</span>${badge}
    <div style="font-size:11.5px;color:#8a94a6;margin-top:4px;line-height:1.55">${hint}</div>
  </div>`;
}

// 머리말에 붙는 포착률 배지 — 판정은 lib/ga.ts의 captureRate() 한 곳에서만 한다.
function captureBadge(cap: { rate: number; short: string; level: "ok" | "warn" | "bad" } | null) {
  if (!cap) return "";
  const c = cap.level === "ok"
    ? { bg: "#e8f6ec", fg: "#16a34a" }
    : cap.level === "warn"
    ? { bg: "#fbf1df", fg: "#b8710a" }
    : { bg: "#fbebe9", fg: "#c6483c" };
  return `<span style="display:inline-block;margin-left:8px;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700;background:${c.bg};color:${c.fg}">포착률 ${cap.rate}% · ${cap.short}</span>`;
}

function table(inner: string) {
  return `<table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eef1f6;border-radius:10px;overflow:hidden">${inner}</table>`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!gaConfigured()) return Response.json({ ok: false, error: "GA 서비스계정 미설정" }, { status: 500 });
  if (!mailerConfigured()) return Response.json({ ok: false, error: "메일러 미설정" }, { status: 500 });

  const to = process.env.ANALYTICS_REPORT_TO || DEFAULT_TO;

  try {
    const s = await getDailyReport();
    const er = Math.round(s.engagementRate * 1000) / 10;
    const cap = captureRate(s);

    // 참여 지표 카드 — 크론이 KST 08:00에 도는데 GA4는 그때까지 어제의 세션 스코프 지표를
    // 확정하지 못한다(2026-08-26 실측: 어제 세션 40건 중 참여 세션 1건만 처리 → 참여율 2.5%).
    // 그래서 이 카드는 사실상 매일 "집계 중"이었다 — 숫자가 뜨지 않는 카드는 자리만 차지한다.
    // → 미확정일 땐 이미 확정된 그제 값을 라벨에 날짜를 밝혀 표시한다.
    //   그제마저 세션이 없으면(주말 등) 표시할 값이 없으므로 그때만 "집계 중"으로 남긴다.
    const engFallback = s.engagementPending && s.prev.sessions > 0;
    const engLabel = (base: string) => (engFallback ? `${base} (그제 확정)` : base);
    const engRate = engFallback
      ? Math.round(s.prev.engagementRate * 1000) / 10 + "%"
      : s.engagementPending ? "집계 중" : er + "%";
    const engTime = fmtDuration(engFallback ? s.prev.avgEngagementPerSession : s.avgEngagementPerSession);

    const insightsHtml = s.insights
      .map((t) => `<li style="margin:0 0 7px;font-size:13px;color:#26324a;line-height:1.55">${escapeHtml(t)}</li>`)
      .join("");

    const html = `<!doctype html><html><body style="margin:0;background:#f0f3f8;padding:24px 0;font-family:-apple-system,Pretendard,Segoe UI,Roboto,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7ebf2">
        <div style="background:#0b1830;padding:22px 24px">
          <div style="color:#fff;font-size:17px;font-weight:800">Supercoder · 일일 애널리틱스</div>
          <div style="color:#9fb3d9;font-size:13px;margin-top:4px">${s.dateLabel} (어제) · www.supercoder.co</div>
        </div>
        <div style="padding:22px 24px">

          <!-- 인사이트 -->
          <div style="background:#eef4ff;border:1px solid #d7e3ff;border-radius:12px;padding:14px 16px;margin-bottom:6px">
            <div style="font-size:13px;font-weight:800;color:#1f59d6;margin-bottom:8px">📊 오늘의 인사이트</div>
            <ul style="margin:0;padding-left:18px">${insightsHtml}</ul>
          </div>

          <!-- 실시간 -->
          <div style="text-align:center;margin:18px 0 6px;font-size:12.5px;color:#5b6577">
            🟢 지금 활성 사용자(최근 30분): <b style="color:#0f9d58;font-size:15px">${s.realtimeActiveUsers.toLocaleString()}</b>명
          </div>

          <!-- 지표 카드는 출처별로 ①실측 → ②GA4 표본 → ③성과 순서다.
               실측을 먼저 보여줘야 GA4 수치가 '그중 얼마'인지로 읽힌다. -->

          <!-- ① 실제 방문 규모 — 차단·동의와 무관. ②의 기준이 되는 숫자. -->
          ${
            s.vercelViews.available || s.serverViews.available || s.blogViews.available
              ? groupLabel(
                  "① 어제 실제로 온 사람",
                  "광고·스크립트 차단이나 동의 여부와 상관없이 집계됩니다. 가장 실제에 가까운 규모이고, 아래 ②의 기준이 되는 숫자입니다."
                ) +
                `<table width="100%" cellspacing="6" cellpadding="0" style="border-collapse:separate"><tr>
            ${s.vercelViews.available ? metricCard("실측 방문자 (사람)", s.vercelViews.visitors.toLocaleString()) : ""}
            ${s.serverViews.available ? metricCard("서버측 조회 (횟수)", s.serverViews.total.toLocaleString()) : ""}
            ${metricCard("블로그 조회 증가 (횟수)", s.blogViews.delta !== null ? `+${s.blogViews.delta.toLocaleString()}` : "집계 시작")}
            ${metricCard("블로그 누적 조회 (횟수)", s.blogViews.total.toLocaleString())}
          </tr></table>`
              : ""
          }

          <!-- ② GA4가 본 몫 — ①의 부분집합임을 머리말에서 못박는다 -->
          ${groupLabel(
            "② 그중 GA4가 본 몫",
            cap
              ? `실측 방문자 ${s.vercelViews.visitors.toLocaleString()}명 가운데 GA4가 ${s.activeUsersExAdmin.toLocaleString()}명을 봤습니다. 아래 수치는 모두 그 ${s.activeUsersExAdmin.toLocaleString()}명만의 표본입니다.`
              : "아래 수치는 GA4가 잡은 방문자만의 표본입니다. 차단기를 쓰거나 태그가 뜨기 전에 떠난 사람은 빠져 있습니다.",
            captureBadge(cap)
          )}
          <table width="100%" cellspacing="6" cellpadding="0" style="border-collapse:separate"><tr>
            ${metricCard("활성 사용자 (사람)", s.activeUsers.toLocaleString())}
            ${metricCard("세션 (방문 횟수)", s.sessions.toLocaleString())}
            ${metricCard(engLabel("참여율"), engRate)}
            ${metricCard(engLabel("세션당 참여시간"), engTime)}
          </tr></table>
          <div style="font-size:11.5px;color:#8a94a6;text-align:center;margin-top:8px;line-height:1.6">
            신규 ${s.newUsers.toLocaleString()}명 · 재방문 ${s.returningUsers.toLocaleString()}명 · GA4 조회수 ${s.pageViews.toLocaleString()}회<br>
            ※ 조회수(횟수)는 ①의 조회수와 세는 규칙이 달라 서로 나누면 안 됩니다. 포착률은 <b>사람 수</b>로만 판정합니다.
            ${engFallback ? "<br>※ 참여 지표는 GA4가 어제치를 아침까지 확정하지 못해 <b>그제 확정값</b>을 표시합니다." : ""}
          </div>

          <!-- ③ 성과 — 유일하게 GA4와 무관하게 정확한 숫자라 따로 떼어 크게 보여준다 -->
          ${groupLabel(
            "③ 성과",
            "Supabase DB에 실제로 남은 제출 건수입니다. GA4 포착률과 무관하게 정확하며, 사내 @supercoder.co 제출은 제외했습니다."
          )}
          <table width="100%" cellspacing="6" cellpadding="0" style="border-collapse:separate"><tr>
            <td style="padding:18px 8px;text-align:center;background:#f6f8fc;border-radius:12px">
              <div style="font-size:26px;font-weight:800;color:#2e6cf0;line-height:1.1">${s.realLeads.available ? s.realLeads.total.toLocaleString() : "—"}</div>
              <div style="font-size:11.5px;color:#5b6577;margin-top:5px">실제 리드 — 도입문의 ${s.realLeads.apply} · 소개서 ${s.realLeads.brochure}</div>
            </td>
          </tr></table>

          ${
            s.serverViews.available && s.serverViews.top.length
              ? sectionTitle("⑥ 서버측 페이지별 조회 (동의 무관 · 실제 방문 규모)") +
                table(rows(s.serverViews.top, "어제 데이터 없음"))
              : ""
          }

          ${sectionTitle("① 페이지 및 화면 — 많이 본 페이지 (조회수)")}
          ${table(rows(s.topPages, "어제 데이터 없음"))}

          ${sectionTitle("② 트래픽 획득 — 유입 경로 (세션)")}
          ${table(rows(s.topChannels, "어제 데이터 없음"))}

          ${sectionTitle("③ 기술 세부정보 — 기기별 사용자")}
          ${table(rows(s.byDevice, "어제 데이터 없음"))}

          ${sectionTitle("④ 인구통계 — 국가별 사용자")}
          ${table(rows(s.byCountry, "어제 데이터 없음"))}

          ${sectionTitle("⑤ 이벤트/전환(CTA) — 방문자 행동 (GA 이벤트 수 · 사내 포함)")}
          ${table(rows(s.topEvents, "어제 데이터 없음"))}

          <div style="margin-top:24px;text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <a href="https://analytics.google.com/analytics/web/#/p543685790/reports/reportinghub" style="display:inline-block;background:#2e6cf0;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">GA 대시보드</a>
            <a href="https://analytics.google.com/analytics/web/#/analysis/a197816586p543685790/edit/cE1Zwzq1Q0yGbaQRGvC28g" style="display:inline-block;background:#1b2333;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">정상 트래픽 모니터 (봇 제외)</a>
          </div>
          <div style="font-size:11px;color:#9aa4b5;margin-top:16px;text-align:center;line-height:1.6">
            매일 오전 8시(KST) 자동 발송 · 데이터는 GA4 처리 특성상 최대 24~48시간 내 소폭 조정될 수 있습니다.<br>
            실시간·유지율(코호트)은 GA4 화면에서 확인 · <a href="${SITE}" style="color:#9aa4b5">${SITE}</a>
          </div>
        </div>
      </div>
    </body></html>`;

    await sendMail({ to, subject: `[Supercoder] 일일 애널리틱스 · ${s.dateLabel}`, html });
    return Response.json({ ok: true, to, date: s.dateLabel, activeUsers: s.activeUsers, sessions: s.sessions, realLeads: s.realLeads, gaEvents_keyEvents: s.keyEvents, realtime: s.realtimeActiveUsers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("daily-analytics failed:", msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
