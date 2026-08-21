import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail, mailerConfigured } from "@/lib/mailer";
import { TRACKING_KEYS } from "@/lib/supabase";
import { isValidEmail, isPersonalEmail, isValidPhone, isValidHowFound, howFoundText, HOW_FOUND_ETC } from "@/lib/leadForm";

// 서비스소개서 발송 API — 회사 이메일로 소개서(현재본) 보안 링크(7일 만료)를 전송.
// 발송 방식 2가지 지원(우선순위):
//   (A) Google 서비스 계정 + 도메인 전체 위임 → Gmail API로 noreply@ 위임 발송  ← 권장(2FA/앱비번 정책 무관)
//       env: GMAIL_SA_CLIENT_EMAIL, GMAIL_SA_PRIVATE_KEY, GMAIL_FROM(=noreply@supercoder.co)
//   (B) Gmail SMTP + 앱 비밀번호  (폴백)
//       env: GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_FROM(선택)
// 공통: service_role 키로 Storage 서명URL 생성 + brochure_requests 리드 저장(서버 전용).

export const runtime = "nodejs";

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
  const phone = String(body.phone ?? "").trim();
  const size = String(body.size ?? "").trim();
  // 유입 경로 직접 응답(폼 필수) — utm·referrer가 안 잡히는 유입을 메운다
  const howFound = String(body.how_found ?? "").trim();
  const howFoundDetail = String(body.how_found_detail ?? "").trim().slice(0, 300) || null;

  // 유입 추적 파라미터(utm·클릭 ID·referrer, 있는 값만) — 리드 저장·관리자 알림에 함께 기록
  const utm: Record<string, string> = {};
  for (const k of TRACKING_KEYS) {
    const v = String(body[k] ?? "").trim();
    if (v) utm[k] = v.slice(0, 300);
  }

  if (!name || !company || !size) return bad("필수 항목을 입력해 주세요.");
  if (!isValidEmail(email)) return bad("올바른 이메일 형식으로 입력해 주세요.");
  if (isPersonalEmail(email)) return bad("naver, gmail 등 개인 메일은 사용할 수 없습니다. 회사 이메일을 입력해 주세요.");
  if (!isValidPhone(phone)) return bad("연락 가능한 번호를 입력해 주세요.");
  if (!isValidHowFound(howFound)) return bad("유입 경로를 선택해 주세요.");
  if (howFound === HOW_FOUND_ETC && !howFoundDetail) return bad("유입 경로를 입력해 주세요.");

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

  // 2) 리드 저장 + 다운로드 추적 토큰 확보(베스트 에포트 — 실패해도 메일 발송은 진행)
  // download_token/UTM 컬럼이 아직 없으면(마이그레이션 미적용) 단계적으로 재시도해 리드 유실을 방지한다.
  const base = { name, company, email, role, phone, size };
  const how = { how_found: howFound, how_found_detail: howFoundDetail };
  let token: string | null = null;
  const withToken = await admin.from("brochure_requests").insert({ ...base, ...how, ...utm }).select("download_token").single();
  if (!withToken.error) {
    token = (withToken.data as { download_token?: string } | null)?.download_token ?? null;
  } else {
    console.warn("send-brochure: 토큰 포함 리드 저장 실패, 단계적 재시도", withToken.error);
    let ins = await admin.from("brochure_requests").insert({ ...base, ...how, ...utm });
    if (ins.error) {
      console.warn("send-brochure: how_found 포함 리드 저장 실패, 유입경로 없이 재시도", ins.error);
      ins = await admin.from("brochure_requests").insert({ ...base, ...utm });
    }
    if (ins.error && Object.keys(utm).length) {
      console.warn("send-brochure: utm 포함 리드 저장 실패, utm 없이 재시도", ins.error);
      ins = await admin.from("brochure_requests").insert(base);
    }
    if (ins.error) console.error("send-brochure: 리드 저장 실패(무시)", ins.error);
  }

  // 3) 다운로드 링크 — 토큰이 있으면 클릭 추적 리다이렉트(/api/brochure-download에서 시각 기록),
  // 없으면(마이그레이션 미적용 등) 기존처럼 7일 서명 URL 직행.
  let link: string;
  if (token) {
    link = `https://www.supercoder.co/api/brochure-download?t=${token}`;
  } else {
    const { data: signed, error: signErr } = await admin.storage
      .from("brochures")
      .createSignedUrl(cur.path, LINK_TTL);
    if (signErr || !signed?.signedUrl) {
      console.error("send-brochure: 서명URL 생성 실패", signErr);
      return bad("다운로드 링크 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
    }
    link = signed.signedUrl;
  }

  // 4) 메일 본문
  const subject = "[Supercoder] 요청하신 서비스소개서를 보내드립니다";
  const html = `
    <div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;max-width:600px;margin:0 auto;padding:56px 24px 40px;color:#1f2a44;text-align:center;word-break:keep-all">
      <div style="text-align:left"><a href="https://www.supercoder.co" style="display:inline-block"><img src="https://www.supercoder.co/supercoder-email-logo.png" alt="Supercoder" width="216" height="30" style="display:block;width:216px;max-width:100%;height:auto;border:0"/></a></div>
      <hr style="border:none;border-top:1px solid #e9edf3;margin:22px 0 0"/>
      <p style="font-size:18px;line-height:1.75;margin:104px 0 0;font-weight:400;color:#2b3450">
        ${name}님, 안녕하세요.<br/>요청하신 <b style="font-weight:700">AI 면접 서비스 소개서</b> 보내드립니다.
      </p>
      <p style="margin:64px 0 0">
        <a href="${link}" style="display:inline-block;background:#3b6ef5;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:18px 56px;border-radius:10px">자료 다운로드</a>
      </p>
      <p style="font-size:13px;color:#8a96ad;line-height:1.9;margin:36px 0 0;font-weight:400">
        링크는 보안을 위해 7일 후 만료됩니다.<br/>
        문의는 회신 또는 <a href="https://www.supercoder.co/apply" style="color:#3b6ef5;text-decoration:underline">도입 문의</a>로 남겨주세요.
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

  // 5) 관리자에게 소개서 신청 알림
  // 반드시 await — Vercel 서버리스는 응답을 반환하는 순간 함수를 정지시킬 수 있어서,
  // fire-and-forget으로 두면 발송이 끝나기 전에 잘려 알림이 유실된다(2026-07~08 리드 19건 중 4건만 도착).
  // 발송 실패는 삼켜서 신청자 응답에는 영향을 주지 않는다(리드 저장·소개서 메일은 이미 완료된 상태).
  const NOTIFY_TO = process.env.SALES_NOTIFY_TO || process.env.GMAIL_FROM;
  if (NOTIFY_TO) {
    const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendMail({
      to: NOTIFY_TO,
      replyTo: email,
      subject: `[소개서 신청] ${company} · ${name}`,
      html: `<div style="font-family:Pretendard,Arial,sans-serif;font-size:14px;color:#1f2a44;word-break:keep-all">
        <h2 style="font-size:16px">서비스소개서 신청</h2>
        <p>회사: <b>${esc(company)}</b><br/>이름: ${esc(name)}<br/>이메일: ${esc(email)}<br/>연락처: ${esc(phone || "-")}<br/>직책: ${esc(role || "-")}<br/>규모: ${esc(size)}<br/>알게 된 경로: ${esc(howFoundText(howFound, howFoundDetail) || "-")}${Object.keys(utm).length ? `<br/>유입: ${esc(TRACKING_KEYS.filter((k) => utm[k]).map((k) => `${k}=${utm[k]}`).join(", "))}` : ""}</p>
      </div>`,
    }).catch((e) => console.error("send-brochure: 관리자 알림 실패(무시)", e));
  }

  return NextResponse.json({ ok: true });
}
