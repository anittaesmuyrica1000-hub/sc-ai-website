import { NextRequest } from "next/server";
import { getDailyReport, fmtDuration, gaConfigured, type NameCount } from "@/lib/ga";
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

          <!-- 핵심 지표 (트래픽 획득 + 참여) -->
          <table width="100%" cellspacing="6" cellpadding="0" style="border-collapse:separate;margin-top:8px"><tr>
            ${metricCard("활성 사용자", s.activeUsers.toLocaleString())}
            ${metricCard("세션", s.sessions.toLocaleString())}
            ${metricCard("참여율", er + "%")}
            ${metricCard("세션당 참여시간", fmtDuration(s.avgEngagementPerSession))}
          </tr></table>
          <table width="100%" cellspacing="6" cellpadding="0" style="border-collapse:separate;margin-top:6px"><tr>
            ${metricCard("조회수", s.pageViews.toLocaleString())}
            ${metricCard("신규 사용자", s.newUsers.toLocaleString())}
            ${metricCard("재방문 사용자", s.returningUsers.toLocaleString())}
            ${metricCard("실제 리드(외부)", s.realLeads.available ? s.realLeads.total.toLocaleString() : "—")}
          </tr></table>
          <div style="font-size:11.5px;color:#5b6577;text-align:center;margin-top:8px">
            리드 = 도입문의 ${s.realLeads.apply} · 소개서 ${s.realLeads.brochure} (사내 @supercoder.co 제출 제외 · Supabase 기준)
          </div>

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

          <div style="margin-top:24px;text-align:center">
            <a href="https://analytics.google.com/analytics/web/#/p543685790/reports/reportinghub" style="display:inline-block;background:#2e6cf0;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">GA에서 자세히 보기</a>
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
