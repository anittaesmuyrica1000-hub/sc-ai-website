import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail, mailerConfigured } from "@/lib/mailer";
import { TRACKING_KEYS } from "@/lib/supabase";
import { howFoundText } from "@/lib/leadForm";
import { validateLead } from "@/lib/leadGuard";

// 도입문의(signups) 접수 — 검증 → service_role 로 저장 → 관리자 알림.
//
// 2026-09-13 이전에는 ApplyForm이 anon 키로 클라이언트에서 직접 insert 하고
// /api/notify-signup 은 알림만 보냈다. 그래서 임시메일·유령 도메인 검증(서버 전용)이
// /apply 에는 걸리지 않았다 — 소개서 폼만 막혀 있던 구멍. 저장까지 서버로 옮겨 닫는다.
//
// 저장 실패는 감추지 않는다(문의가 유실되면 사용자가 다시 넣을 기회를 잃는다).
// 반대로 알림 발송 실패는 삼킨다 — 접수는 이미 끝난 상태다.

export const runtime = "nodejs";

const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim();
  const role = String(body.role ?? "").trim() || null;
  const phone = String(body.phone ?? "").trim();
  const size = String(body.size ?? "").trim();
  const memo = String(body.memo ?? "").trim().slice(0, 5000) || null;
  const howFound = String(body.how_found ?? "").trim();
  const howFoundDetail = String(body.how_found_detail ?? "").trim().slice(0, 300) || null;

  // 유입 추적 파라미터(utm·클릭 ID·referrer, 있는 값만)
  const utm: Record<string, string> = {};
  for (const k of TRACKING_KEYS) {
    const v = String(body[k] ?? "").trim();
    if (v) utm[k] = v.slice(0, 300);
  }

  const err = await validateLead({ name, company, email, phone, size, howFound, howFoundDetail });
  if (err) return bad(err);

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("submit-signup: Supabase 서버 환경변수 누락");
    return bad("서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.", 500);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 마이그레이션(how_found·UTM 컬럼)이 아직 안 된 환경을 대비해 단계적으로 축소 재시도한다 —
  // 컬럼 하나 때문에 문의가 통째로 날아가지 않도록.
  const base = { name, company, email, role, phone, size, memo };
  const how = { how_found: howFound, how_found_detail: howFoundDetail };
  let ins = await admin.from("signups").insert({ ...base, ...how, ...utm });
  if (ins.error) {
    console.warn("submit-signup: how_found 포함 저장 실패, 유입경로 없이 재시도", ins.error);
    ins = await admin.from("signups").insert({ ...base, ...utm });
  }
  if (ins.error && Object.keys(utm).length) {
    console.warn("submit-signup: utm 포함 저장 실패, utm 없이 재시도", ins.error);
    ins = await admin.from("signups").insert(base);
  }
  if (ins.error) {
    console.error("submit-signup: 문의 저장 실패", ins.error);
    return bad("신청 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  // 관리자 알림 — 반드시 await. Vercel 서버리스는 응답을 반환하는 순간 함수를 정지시킬 수 있어서
  // fire-and-forget으로 두면 발송 전에 잘린다(2026-07~08 리드 19건 중 4건만 도착한 원인).
  const NOTIFY_TO = process.env.SALES_NOTIFY_TO || process.env.GMAIL_FROM;
  if (NOTIFY_TO && mailerConfigured()) {
    const howText = howFoundText(howFound, howFoundDetail);
    const utmLine = TRACKING_KEYS.filter((k) => utm[k]).map((k) => `${k}=${utm[k]}`).join(", ");
    const row = (label: string, value: string) =>
      `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;vertical-align:top">${label}</td><td style="padding:4px 0">${value}</td></tr>`;
    const html = `<div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1f2a44;word-break:keep-all;max-width:560px">
      <h2 style="font-size:17px;margin:0 0 14px">🔔 새 도입 문의가 접수됐어요</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${row("회사", `<b>${esc(company)}</b>`)}
        ${row("담당자", esc(name))}
        ${row("이메일", `<a href="mailto:${esc(email)}">${esc(email)}</a>`)}
        ${row("연락처", esc(phone || "-"))}
        ${row("직책", esc(role || "-"))}
        ${row("규모", esc(size || "-"))}
        ${howText ? row("알게 된 경로", `<b>${esc(howText)}</b>`) : ""}
        ${memo ? `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;vertical-align:top">메모</td><td style="padding:4px 0;white-space:pre-wrap">${esc(memo)}</td></tr>` : ""}
        ${utmLine ? `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;vertical-align:top">유입</td><td style="padding:4px 0;word-break:break-all">${esc(utmLine)}</td></tr>` : ""}
      </table>
      <p style="margin:20px 0 0"><a href="https://www.supercoder.co/admin" style="display:inline-block;background:#3b6ef5;color:#fff;text-decoration:none;font-weight:700;padding:11px 22px;border-radius:8px">어드민에서 보기</a></p>
    </div>`;
    await sendMail({
      to: NOTIFY_TO,
      replyTo: email,
      subject: `[도입문의] ${company || "신규"} · ${name}`,
      html,
    }).catch((e) => console.error("submit-signup: 알림 발송 실패(무시)", e));
  } else if (!NOTIFY_TO) {
    console.warn("submit-signup: SALES_NOTIFY_TO/GMAIL_FROM 미설정 — 알림 생략");
  }

  return NextResponse.json({ ok: true });
}
