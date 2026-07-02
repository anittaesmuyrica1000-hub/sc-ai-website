import { NextRequest } from "next/server";
import { getDailyStats, gaConfigured, type NameCount } from "@/lib/ga";
import { sendMail, mailerConfigured } from "@/lib/mailer";

// 매일 오전 8시(KST) GA4 어제 지표 요약을 이메일로 발송하는 크론 엔드포인트.
// Vercel Cron이 GET으로 호출(설정: vercel.json). 스케줄 "0 23 * * *"(UTC) = 08:00 KST.
// 보안: CRON_SECRET 설정 시 Authorization: Bearer <CRON_SECRET> 또는 ?key=<CRON_SECRET> 필요.
// 수신자: ANALYTICS_REPORT_TO(기본 juhee.kim@supercoder.co).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TO = "juhee.kim@supercoder.co";
const SITE = "https://www.supercoder.co";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 시크릿 미설정 시 통과(설정 권장)
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}

function rows(list: NameCount[], emptyText: string): string {
  if (!list.length) return `<tr><td colspan="2" style="padding:8px 12px;color:#8a94a6;font-size:13px">${emptyText}</td></tr>`;
  return list
    .map(
      (x, i) => `<tr style="border-top:1px solid #eef1f6">
        <td style="padding:8px 12px;font-size:13.5px;color:#1b2333">${i + 1}. ${escapeHtml(x.name)}</td>
        <td style="padding:8px 12px;font-size:13.5px;color:#1b2333;text-align:right;font-weight:700">${x.count.toLocaleString()}</td>
      </tr>`
    )
    .join("");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
}

function metricCard(label: string, value: number) {
  return `<td style="padding:14px 10px;text-align:center;background:#f6f8fc;border-radius:12px">
    <div style="font-size:24px;font-weight:800;color:#2e6cf0;line-height:1.1">${value.toLocaleString()}</div>
    <div style="font-size:12px;color:#5b6577;margin-top:4px">${label}</div>
  </td>`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!gaConfigured()) return Response.json({ ok: false, error: "GA 서비스계정 미설정" }, { status: 500 });
  if (!mailerConfigured()) return Response.json({ ok: false, error: "메일러 미설정" }, { status: 500 });

  const to = process.env.ANALYTICS_REPORT_TO || DEFAULT_TO;

  try {
    const s = await getDailyStats();
    const html = `<!doctype html><html><body style="margin:0;background:#f0f3f8;padding:24px 0;font-family:-apple-system,Pretendard,Segoe UI,Roboto,sans-serif">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7ebf2">
        <div style="background:#0b1830;padding:22px 24px">
          <div style="color:#fff;font-size:17px;font-weight:800">Supercoder · 일일 애널리틱스</div>
          <div style="color:#9fb3d9;font-size:13px;margin-top:4px">${s.dateLabel} (어제) · www.supercoder.co</div>
        </div>
        <div style="padding:22px 24px">
          <table width="100%" cellspacing="8" cellpadding="0" style="border-collapse:separate"><tr>
            ${metricCard("활성 사용자", s.activeUsers)}
            ${metricCard("신규 사용자", s.newUsers)}
            ${metricCard("세션", s.sessions)}
            ${metricCard("조회수", s.pageViews)}
          </tr></table>

          <div style="font-size:13px;font-weight:800;color:#1b2333;margin:24px 0 6px">인기 페이지 (조회수)</div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eef1f6;border-radius:10px;overflow:hidden">${rows(s.topPages, "어제 데이터 없음")}</table>

          <div style="font-size:13px;font-weight:800;color:#1b2333;margin:22px 0 6px">유입 경로 (세션)</div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eef1f6;border-radius:10px;overflow:hidden">${rows(s.topChannels, "어제 데이터 없음")}</table>

          <div style="margin-top:24px;text-align:center">
            <a href="https://analytics.google.com/analytics/web/#/p543685790/reports/reportinghub" style="display:inline-block;background:#2e6cf0;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">GA에서 자세히 보기</a>
          </div>
          <div style="font-size:11px;color:#9aa4b5;margin-top:18px;text-align:center;line-height:1.6">매일 오전 8시 자동 발송 · <a href="${SITE}" style="color:#9aa4b5">${SITE}</a></div>
        </div>
      </div>
    </body></html>`;

    await sendMail({ to, subject: `[Supercoder] 일일 애널리틱스 · ${s.dateLabel}`, html });
    return Response.json({ ok: true, to, date: s.dateLabel, activeUsers: s.activeUsers, sessions: s.sessions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("daily-analytics failed:", msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
