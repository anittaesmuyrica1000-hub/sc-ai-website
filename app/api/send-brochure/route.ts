import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail, mailerConfigured } from "@/lib/mailer";

// 서비스소개서 발송 API — 회사 이메일로 소개서(현재본) 보안 링크(7일 만료)를 전송.
// 발송 방식 2가지 지원(우선순위):
//   (A) Google 서비스 계정 + 도메인 전체 위임 → Gmail API로 noreply@ 위임 발송  ← 권장(2FA/앱비번 정책 무관)
//       env: GMAIL_SA_CLIENT_EMAIL, GMAIL_SA_PRIVATE_KEY, GMAIL_FROM(=noreply@supercoder.co)
//   (B) Gmail SMTP + 앱 비밀번호  (폴백)
//       env: GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM(선택)
// 공통: service_role 키로 Storage 서명URL 생성 + brochure_requests 리드 저장(서버 전용).

export const runtime = "nodejs";

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LINK_TTL = 60 * 60 * 24 * 7; // 7일

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
  const phone = String(body.phone ?? "").trim() || null;
  const size = String(body.size ?? "").trim();

  if (!name || !company || !size) return bad("필수 항목을 입력해 주세요.");
  if (!emailRe.test(email)) return bad("올바른 이메일을 입력해 주세요.");

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("send-brochure: Supabase 서버 환경변수 누락");
    return bad("서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.", 500);
  }
  if (!mailerConfigured()) {
    console.error("send-brochure: 메일 발송 환경변수 누락");
    return bad("이메일 발송이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.", 500);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 1) 현재 소개서 파일 경로
  const { data: cur, error: curErr } = await admin
    .from("brochure_files")
    .select("path")
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (curErr || !cur?.path) {
    console.error("send-brochure: 현재 소개서 없음", curErr);
    return bad("현재 등록된 소개서가 없습니다. 관리자에게 문의해 주세요.", 500);
  }

  // 2) 7일 서명 URL 생성
  const { data: signed, error: signErr } = await admin.storage
    .from("brochures")
    .createSignedUrl(cur.path, LINK_TTL);
  if (signErr || !signed?.signedUrl) {
    console.error("send-brochure: 서명URL 생성 실패", signErr);
    return bad("다운로드 링크 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
  const link = signed.signedUrl;

  // 3) 리드 저장(베스트 에포트 — 실패해도 메일 발송은 진행)
  const { error: insErr } = await admin
    .from("brochure_requests")
    .insert({ name, company, email, role, phone, size });
  if (insErr) console.error("send-brochure: 리드 저장 실패(무시)", insErr);

  // 4) 메일 본문
  const subject = "[Supercoder] 요청하신 서비스소개서를 보내드립니다";
  const html = `
    <div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;max-width:600px;margin:0 auto;padding:56px 24px 40px;color:#1f2a44;text-align:center;word-break:keep-all">
      <div style="text-align:left"><a href="https://sc-ai-website.vercel.app" style="display:inline-block"><img src="https://sc-ai-website.vercel.app/supercoder-email-logo.png" alt="Supercoder" width="216" height="30" style="display:block;width:216px;max-width:100%;height:auto;border:0"/></a></div>
      <hr style="border:none;border-top:1px solid #e9edf3;margin:22px 0 0"/>
      <p style="font-size:18px;line-height:1.75;margin:104px 0 0;font-weight:400;color:#2b3450">
        ${name}님, 안녕하세요.<br/>요청하신 <b style="font-weight:700">AI 면접 서비스 소개서</b> 보내드립니다.
      </p>
      <p style="margin:64px 0 0">
        <a href="${link}" style="display:inline-block;background:#3b6ef5;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:18px 56px;border-radius:10px">자료 다운로드</a>
      </p>
      <p style="font-size:13px;color:#8a96ad;line-height:1.9;margin:36px 0 0;font-weight:400">
        링크는 보안을 위해 7일 후 만료됩니다.<br/>
        문의는 회신 또는 <a href="https://sc-ai-website.vercel.app/apply" style="color:#3b6ef5;text-decoration:underline">도입 문의</a>로 남겨주세요.
      </p>
      <hr style="border:none;border-top:1px solid #e9edf3;margin:120px 0 0"/>
      <p style="font-size:12px;color:#9aa6bf;line-height:1.9;margin:24px 0 0;font-weight:400;text-align:left">
        © 2026 Second Team. All rights reserved.
      </p>
    </div>`;

  try {
    await sendMail({ to: email, subject, html });
  } catch (err) {
    console.error("send-brochure: 메일 발송 실패", err);
    return bad("이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  // 5) 관리자에게 소개서 신청 알림(베스트 에포트)
  const NOTIFY_TO = process.env.SALES_NOTIFY_TO || process.env.GMAIL_FROM;
  if (NOTIFY_TO) {
    const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    sendMail({
      to: NOTIFY_TO,
      replyTo: email,
      subject: `[소개서 신청] ${company} · ${name}`,
      html: `<div style="font-family:Pretendard,Arial,sans-serif;font-size:14px;color:#1f2a44;word-break:keep-all">
        <h2 style="font-size:16px">서비스소개서 신청</h2>
        <p>회사: <b>${esc(company)}</b><br/>이름: ${esc(name)}<br/>이메일: ${esc(email)}<br/>연락처: ${esc(phone || "-")}<br/>직책: ${esc(role || "-")}<br/>규모: ${esc(size)}</p>
      </div>`,
    }).catch((e) => console.error("send-brochure: 관리자 알림 실패(무시)", e));
  }

  return NextResponse.json({ ok: true });
}
