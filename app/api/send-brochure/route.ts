import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { JWT } from "google-auth-library";

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

  // 발송 방식 환경변수
  const SA_EMAIL = process.env.GMAIL_SA_CLIENT_EMAIL;
  const SA_KEY = process.env.GMAIL_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const GMAIL_FROM = process.env.GMAIL_FROM || GMAIL_USER || SA_EMAIL;

  const useServiceAccount = !!(SA_EMAIL && SA_KEY && GMAIL_FROM);
  const useSmtp = !!(GMAIL_USER && GMAIL_APP_PASSWORD);

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("send-brochure: Supabase 서버 환경변수 누락");
    return bad("서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.", 500);
  }
  if (!useServiceAccount && !useSmtp) {
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
  const fromHeader = `"Supercoder" <${GMAIL_FROM}>`;
  const subject = "[Supercoder] 요청하신 서비스소개서를 보내드립니다";
  const html = `
    <div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;max-width:600px;margin:0;padding:64px 8px 32px;color:#1f2a44;text-align:left">
      <a href="https://sc-ai-website.vercel.app" style="display:inline-block;margin:0 0 26px"><img src="https://sc-ai-website.vercel.app/supercoder-email-logo.png" alt="Supercoder" height="28" style="display:block;height:28px;width:auto;border:0"/></a>
      <hr style="border:none;border-top:2px solid #dfe4ee;margin:0 0 40px"/>
      <p style="font-size:18px;line-height:1.85;margin:0 0 38px;font-weight:400">
        ${name}님, 안녕하세요.<br/>요청하신 <b style="font-weight:700">AI 면접 서비스 소개서</b>를 보내드립니다.<br/><br/>아래 버튼에서 소개서를 확인하실 수 있습니다.
      </p>
      <p style="margin:0 0 38px">
        <a href="${link}" style="display:inline-block;background:#2E6CF0;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:18px 40px;border-radius:12px">AI 면접 서비스 소개서</a>
      </p>
      <p style="font-size:13px;color:#8a96ad;line-height:1.9;margin:0;font-weight:400">
        위 링크는 보안을 위해 7일 후 만료됩니다. 만료 시 다시 신청해 주세요.<br/>
        도입 관련 문의는 회신 또는 <a href="https://sc-ai-website.vercel.app/apply" style="color:#2E6CF0">도입 문의</a>로 남겨주세요.
      </p>
      <hr style="border:none;border-top:1px solid #eef1f7;margin:40px 0 18px"/>
      <p style="font-size:12px;color:#9aa6bf;line-height:1.7;margin:0;font-weight:400">
        © 2026 Second Team. All rights reserved.<br/>
        대표 최재웅 · 서울 서초구 효령로55길 19 4층<br/>
        support@supercoder.co
      </p>
    </div>`;

  try {
    if (useServiceAccount) {
      // (A) 서비스 계정으로 noreply@ 위임 → Gmail API send
      const client = new JWT({
        email: SA_EMAIL,
        key: SA_KEY,
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
        subject: GMAIL_FROM, // 위임(impersonate) 대상 = 발신 계정
      });
      const { token } = await client.getAccessToken();
      if (!token) throw new Error("서비스 계정 토큰 발급 실패");

      const mime = await new MailComposer({ from: fromHeader, to: email, subject, html })
        .compile()
        .build();
      const raw = mime.toString("base64url");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Gmail API ${res.status}: ${detail}`);
      }
    } else {
      // (B) SMTP + 앱 비밀번호 폴백
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER!, pass: GMAIL_APP_PASSWORD! },
      });
      await transporter.sendMail({ from: fromHeader, to: email, subject, html });
    }
  } catch (err) {
    console.error("send-brochure: 메일 발송 실패", err);
    return bad("이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  return NextResponse.json({ ok: true });
}
