import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// 서비스소개서 발송 API — 회사 이메일로 소개서(현재본) 보안 링크(7일 만료)를 Gmail SMTP로 전송.
// 모달(BrochureModal)이 호출. service_role 키로 Storage 서명URL 생성 + 리드 저장(서버 전용).
// 필요한 환경변수(Vercel, 서버 전용): SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
//   (SUPABASE_URL 은 NEXT_PUBLIC_SUPABASE_URL 재사용)

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
  const GMAIL_USER = process.env.GMAIL_USER; // SMTP 로그인 계정(앱 비밀번호 발급된 실제 계정)
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  // 실제 발신 표시 주소. 미설정 시 GMAIL_USER. (예: GMAIL_USER=juhee.kim@…, GMAIL_FROM=noreply@…)
  const GMAIL_FROM = process.env.GMAIL_FROM || GMAIL_USER;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("send-brochure: Supabase 서버 환경변수 누락");
    return bad("서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.", 500);
  }
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("send-brochure: Gmail 환경변수 누락");
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

  // 4) Gmail SMTP로 발송
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const html = `
    <div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2a44">
      <h2 style="font-size:20px;margin:0 0 14px">AI면접 서비스소개서</h2>
      <p style="font-size:15px;line-height:1.7;margin:0 0 18px">
        ${name}님, 안녕하세요.<br/>요청하신 <b>AI면접 서비스소개서</b>를 보내드립니다.
      </p>
      <p style="margin:0 0 24px">
        <a href="${link}" style="display:inline-block;background:#2E6CF0;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px">소개서 다운로드 (PDF)</a>
      </p>
      <p style="font-size:13px;color:#7E8AA3;line-height:1.6;margin:0">
        위 링크는 보안을 위해 <b>7일 후 만료</b>됩니다. 만료 시 다시 신청해 주세요.<br/>
        도입 관련 문의는 회신 또는 <a href="https://sc-ai-website.vercel.app/apply">도입 문의</a>로 남겨주세요.
      </p>
      <hr style="border:none;border-top:1px solid #e8edf6;margin:24px 0"/>
      <p style="font-size:12px;color:#9aa6bf;margin:0">Supercoder · AIVIEW</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"AIVIEW (Supercoder)" <${GMAIL_FROM}>`,
      to: email,
      subject: "[AIVIEW] 요청하신 서비스소개서를 보내드립니다",
      html,
    });
  } catch (err) {
    console.error("send-brochure: 메일 발송 실패", err);
    return bad("이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  return NextResponse.json({ ok: true });
}
