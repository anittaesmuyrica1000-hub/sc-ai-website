import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail, mailerConfigured } from "@/lib/mailer";
import { TRACKING_KEYS } from "@/lib/supabase";
import { findEvent, statusOf } from "@/lib/events";
import { isDisposableEmail, hasMailExchanger } from "@/lib/leadGuard";
import {
  isValidJob, isValidApplicantType, isValidFinalAttend, isValidEvHowFound,
  eventEmailError, isValidName, isValidPhone, normalizePhone,
  EVENT_JOB_LABEL, APPLICANT_TYPE_LABEL, FINAL_ATTEND_LABEL, evHowFoundText,
  EV_HOW_FOUND_ETC,
} from "@/lib/eventApply";

// 이벤트 참가 신청(event_applications) 접수 — 검증 → service_role 로 저장 → 관리자 알림.
//
// 테이블·RLS는 supabase/event-applications-setup.sql 을 SQL Editor 에서 1회 실행해야 만들어진다.
// anon 은 읽기·쓰기 모두 막혀 있으므로 저장은 반드시 이 라우트를 거친다(/apply 와 같은 구조).
//
// 리드 폼(/api/submit-signup)과 다른 점 두 가지:
//  1) **개인 메일을 허용한다.** 지원자는 대학생·취업준비생이라 naver·gmail 이 정상이다.
//     validateLead / isBusinessEmail 을 쓰면 정상 지원자가 전부 막힌다. 일회용 메일만 막는다.
//  2) **모집 기간을 서버에서 다시 본다.** 클라이언트 상태만 믿으면 마감 뒤 제출이 들어온다.
//
// 저장 실패는 감추지 않는다(지원서가 유실되면 선착순 순번이 어긋난다).
// 알림 발송 실패는 삼킨다 — 접수는 이미 끝난 상태다.

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

  const eventSlug = String(body.event_slug ?? "").trim();
  const event = findEvent(eventSlug);
  if (!event) return bad("존재하지 않는 행사입니다.");

  // 내부 제출 테스트(?preview=1) — 모집 기간 밖에서도 통과시키되 is_test 로 표시해 집계에서 뺀다.
  const isTest = body.preview === true;
  const status = statusOf(event);
  if (!isTest && status !== "open") {
    return bad(
      status === "upcoming"
        ? `아직 접수 전입니다. ${event.applyFrom}부터 지원할 수 있습니다.`
        : `접수가 마감되었습니다. (${event.applyTo})`
    );
  }

  const name = String(body.name ?? "").trim();
  const phoneRaw = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  const job = String(body.job ?? "").trim();
  const applicantType = String(body.applicant_type ?? "").trim();
  const finalAttend = String(body.final_attend ?? "").trim();
  const howFound = String(body.how_found ?? "").trim();
  const howFoundDetail = String(body.how_found_detail ?? "").trim().slice(0, 300) || null;

  if (!isValidName(name)) return bad("이름을 실명으로 입력해 주세요.");
  if (!isValidPhone(phoneRaw)) return bad("연락 가능한 휴대폰 번호를 입력해 주세요.");
  if (!isValidJob(job)) return bad("지원 직군을 선택해 주세요.");
  if (!isValidApplicantType(applicantType)) return bad("현재 상태를 선택해 주세요.");
  if (!isValidFinalAttend(finalAttend)) return bad("오프라인 AI 역량 검사 참석 가능 여부를 선택해 주세요.");
  if (!isValidEvHowFound(howFound)) return bad("유입 경로를 선택해 주세요.");
  if (howFound === EV_HOW_FOUND_ETC && !howFoundDetail) return bad("유입 경로를 입력해 주세요.");

  const emailErr = eventEmailError(email);
  if (emailErr === "empty") return bad("이메일을 입력해 주세요.");
  if (emailErr === "format") return bad("올바른 이메일 형식으로 입력해 주세요.");
  // 일회용 메일은 11/2~3 면접 링크 발송이 그대로 유실된다. 전체 목록(8,792개)으로 한 번 더 본다.
  if (emailErr === "temp" || isDisposableEmail(email)) {
    return bad("일회용 메일로는 면접 링크를 받을 수 없습니다. 실제로 쓰는 메일을 입력해 주세요.");
  }
  // 오타로 존재하지 않는 도메인을 적은 경우(gmial.com 등) — 메일 서버가 없으면 발송이 불가능하다.
  if (!(await hasMailExchanger(email))) {
    return bad("메일을 받을 수 없는 주소입니다. 주소를 다시 확인해 주세요.");
  }

  // 필수 동의 — 세 항목 모두 체크돼야 접수한다(2026-10-06 현장 사진 동의가 필수로 바뀌었다).
  const consentPrivacy = body.consent_privacy === true;
  const consentFiction = body.consent_fiction === true;
  const consentContent = body.consent_content === true; // 선택
  // [필수] 11/14 현장 사진의 홍보 활용. Finalist 가 아니면 쓰이지 않지만 동의는 지원 시점에 받아 둔다.
  const consentPhoto = body.consent_photo === true;
  if (!consentPrivacy) return bad("개인정보 수집 및 이용에 동의해 주세요.");
  if (!consentFiction) return bad("가상 기업 안내를 확인하고 동의해 주세요.");
  if (!consentPhoto) return bad("11월 14일 현장 사진 활용에 동의해 주세요.");

  // 유입 추적 파라미터(utm·클릭 ID·referrer, 있는 값만)
  const utm: Record<string, string> = {};
  for (const k of TRACKING_KEYS) {
    const v = String(body[k] ?? "").trim();
    if (v) utm[k] = v.slice(0, 300);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("event-apply: Supabase 서버 환경변수 누락");
    return bad("서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.", 500);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const phone = normalizePhone(phoneRaw);
  const row = {
    event_slug: event.slug,
    name,
    phone,
    email,
    job,
    applicant_type: applicantType,
    final_attend: finalAttend,
    how_found: howFound,
    how_found_detail: howFoundDetail,
    consent_privacy: consentPrivacy,
    consent_fiction: consentFiction,
    consent_content: consentContent,
    consent_photo: consentPhoto,
    is_test: isTest,
    ...utm,
  };

  const ins = await admin.from("event_applications").insert(row);
  if (ins.error) {
    // 23505 = unique 위반. 중복 지원은 DB가 막는다(동시 제출까지 확실히 걸러야 선착순이 어긋나지 않는다).
    if (ins.error.code === "23505") {
      return bad("이미 지원하신 내역이 있습니다. 한 분당 한 번만 지원할 수 있습니다.", 409);
    }
    // 테이블 없음 — 마이그레이션 미적용. PostgREST 는 스키마 캐시 미스를 PGRST205 로 돌려준다.
    if (ins.error.code === "42P01" || ins.error.code === "PGRST205") {
      console.error("event-apply: event_applications 테이블 없음 — supabase/event-applications-setup.sql 실행 필요");
      return bad("접수 준비가 아직 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.", 503);
    }
    console.error("event-apply: 지원서 저장 실패", ins.error);
    return bad("지원서 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }

  // 관리자 알림 — 반드시 await. Vercel 서버리스는 응답 반환 시점에 함수를 정지시킬 수 있어
  // fire-and-forget 으로 두면 발송 전에 잘린다(2026-07~08 리드 유실과 같은 원인).
  const NOTIFY_TO = process.env.SALES_NOTIFY_TO || process.env.GMAIL_FROM;
  if (!isTest && NOTIFY_TO && mailerConfigured()) {
    const cnt = await admin
      .from("event_applications")
      .select("id", { count: "exact", head: true })
      .eq("event_slug", event.slug)
      .eq("is_test", false);
    const no = cnt.count ?? null;

    const r = (label: string, value: string) =>
      `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`;
    const html = `<div style="font-family:Pretendard,'Apple SD Gothic Neo',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1f2a44;word-break:keep-all;max-width:560px">
      <h2 style="font-size:17px;margin:0 0 4px">🎓 새 참가 신청이 접수됐어요</h2>
      <p style="margin:0 0 14px;color:#6b7280">${esc(event.title)}${no ? ` · 누적 <b style="color:#1f2a44">${no}명</b>` : ""}</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${r("지원 직군", `<b>${esc(EVENT_JOB_LABEL[job] || job)}</b>`)}
        ${r("이름", esc(name))}
        ${r("연락처", esc(phoneRaw))}
        ${r("이메일", `<a href="mailto:${esc(email)}">${esc(email)}</a>`)}
        ${r("현재 상태", esc(APPLICANT_TYPE_LABEL[applicantType] || applicantType))}
        ${r("오프라인 Final", esc(FINAL_ATTEND_LABEL[finalAttend] || finalAttend))}
        ${r("알게 된 경로", `<b>${esc(evHowFoundText(howFound, howFoundDetail) || "-")}</b>`)}
        ${r("콘텐츠 활용 동의", consentContent ? "동의" : "<span style='color:#B23B2E'>미동의</span>")}
        ${r("현장 사진 동의", consentPhoto ? "동의" : "<span style='color:#B23B2E'>미동의</span>")}
        ${Object.keys(utm).length ? r("유입", esc(TRACKING_KEYS.filter((k) => utm[k]).map((k) => `${k}=${utm[k]}`).join(", "))) : ""}
      </table>
    </div>`;
    await sendMail({
      to: NOTIFY_TO,
      replyTo: email,
      subject: `[참가신청] ${EVENT_JOB_LABEL[job] || job} · ${name}${no ? ` (${no}번째)` : ""}`,
      html,
    }).catch((e) => console.error("event-apply: 알림 발송 실패(무시)", e));
  }

  return NextResponse.json({ ok: true });
}
