import { NextResponse } from "next/server";
import { sendMail, mailerConfigured } from "@/lib/mailer";

// 도입문의(signups) 접수 시 관리자에게 알림 메일 발송. 폼 저장은 클라이언트에서 이미 완료된 뒤 호출(베스트 에포트).
// 수신 주소: SALES_NOTIFY_TO 우선, 없으면 GMAIL_FROM. 둘 다 없으면 조용히 종료.
export const runtime = "nodejs";

const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim();
  const role = String(body.role ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const size = String(body.size ?? "").trim();
  const memo = String(body.memo ?? "").trim();

  const NOTIFY_TO = process.env.SALES_NOTIFY_TO || process.env.GMAIL_FROM;
  // 알림 미설정/메일러 미설정이어도 폼 제출은 이미 성공했으므로 조용히 200 반환
  if (!NOTIFY_TO || !mailerConfigured()) {
    if (!NOTIFY_TO) console.warn("notify-signup: SALES_NOTIFY_TO/GMAIL_FROM 미설정 — 알림 생략");
    return NextResponse.json({ ok: true, skipped: true });
  }

  const html = `<div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1f2a44;word-break:keep-all;max-width:560px">
      <h2 style="font-size:17px;margin:0 0 14px">🔔 새 도입 문의가 접수됐어요</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 14px 4px 0;color:#6b7280">회사</td><td style="padding:4px 0"><b>${esc(company)}</b></td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#6b7280">담당자</td><td style="padding:4px 0">${esc(name)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#6b7280">이메일</td><td style="padding:4px 0"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#6b7280">연락처</td><td style="padding:4px 0">${esc(phone || "-")}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#6b7280">직책</td><td style="padding:4px 0">${esc(role || "-")}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#6b7280">규모</td><td style="padding:4px 0">${esc(size || "-")}</td></tr>
        ${memo ? `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;vertical-align:top">메모</td><td style="padding:4px 0;white-space:pre-wrap">${esc(memo)}</td></tr>` : ""}
      </table>
      <p style="margin:20px 0 0"><a href="https://sc-ai-website.vercel.app/admin" style="display:inline-block;background:#3b6ef5;color:#fff;text-decoration:none;font-weight:700;padding:11px 22px;border-radius:8px">어드민에서 보기</a></p>
    </div>`;

  try {
    await sendMail({ to: NOTIFY_TO, replyTo: email || undefined, subject: `[도입문의] ${company || "신규"} · ${name}`, html });
  } catch (err) {
    console.error("notify-signup: 알림 발송 실패(무시)", err);
    return NextResponse.json({ ok: false }, { status: 200 }); // 폼 제출은 이미 성공 — 클라이언트엔 영향 없음
  }
  return NextResponse.json({ ok: true });
}
