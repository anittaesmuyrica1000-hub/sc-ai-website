// 이벤트 참가 신청 폼(/event/[slug]/apply)의 선택지·검증 — 단일 출처(SSOT).
// 클라이언트 폼(EventApplyForm)과 서버 라우트(/api/event-apply)가 같은 규칙을 쓴다.
//
// ⚠️ 리드 폼(lib/leadForm.ts)과 **이메일 규칙이 반대다.**
//    도입문의·소개서는 "회사 이메일만"(isBusinessEmail)이지만, 여기 지원자는 대학생·취업준비생이라
//    naver·gmail 이 정상이다. isBusinessEmail / validateLead 를 그대로 가져다 쓰면
//    정상 지원자가 전부 막힌다. 형식 + 일회용 메일만 본다.
//
// 전화번호 검증(isValidPhone)과 정규화(normalizePhone)는 리드 폼과 같은 규칙을 쓴다 —
// 쿠폰이 이 번호로 나가므로(기획안 slide 10) 더미 번호를 걸러야 한다.
import { emailRe, isValidPhone, normalizePhone } from "./leadForm";

export { isValidPhone, normalizePhone };

/* ── 지원 직군 ───────────────────────────────────────────
   기획안 slide 12: "지원 시 한 직군만 선택". slide 13 의 모델 직무 2종.
   ⚠️ 설계 근거가 된 실존 기업명(삼성전자 DX)은 어디에도 노출하지 않는다(slide 13). */
export const EVENT_JOBS = [
  {
    v: "marketing",
    l: "제품마케팅",
    team: "제품마케팅팀",
    desc: "시장·고객을 분석해 누구에게 무엇으로 팔 것인지 정하고, 출시 캠페인을 기획해 성과를 확인합니다.",
    // 평가 역량 — 공고 상세와 본문에 문장으로 쓴다
    skills: ["데이터 해석", "타깃 설정", "출시 캠페인과 성과지표 설계"],
    // 공고 카드의 짧은 칩. skills 를 그대로 쓰면 카드에서 줄이 넘쳐 가독성이 떨어진다
    tags: ["시장·고객 분석", "타깃 설정", "캠페인 기획"],
  },
  {
    v: "dev",
    // 기획안 slide 13 의 모델 직무는 "애플리케이션 개발"이지만, 공고 이름은 "소프트웨어 개발"로 쓴다.
    // 애플리케이션은 앱 개발로 좁게 읽혀서 웹·서버 지원자가 걸러진다 — 실제 범위(앱·프론트·백엔드)와도 어긋난다.
    // DB에 저장되는 값(v="dev")은 그대로라 기존 데이터에 영향이 없다.
    l: "소프트웨어 개발",
    team: "소프트웨어개발팀",
    desc: "고객사와 사내에서 쓰는 웹·앱 서비스의 화면과 서버 기능을 만들고, 동작하지 않는 원인을 찾아 고칩니다.",
    skills: ["요구사항을 설계로 옮기는 과정", "디버깅 사례", "사용자 경험 개선 경험"],
    tags: ["프론트엔드", "백엔드", "디버깅"],
  },
] as const;

export type EventJob = (typeof EVENT_JOBS)[number]["v"];

export const EVENT_JOB_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_JOBS.map((j) => [j.v, j.l])
);

export function isValidJob(v: string): boolean {
  return EVENT_JOBS.some((j) => j.v === v);
}

/* ── 참가 대상 구분 ──────────────────────────────────────
   학년·전공·졸업 시기는 보지 않는다(slide 12). 참가 자격 확인에 필요한 최소 구분만 받는다.
   학교명은 받지 않는다 — 평가에 쓰지 않는 정보라 수집 근거가 없다. */
export const APPLICANT_TYPES = [
  { v: "undergrad", l: "대학 재학·휴학" },
  { v: "grad", l: "대학원 재학·휴학" },
  { v: "graduated", l: "졸업 (취업 준비 중)" },
  { v: "etc", l: "그 외" },
] as const;

export const APPLICANT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  APPLICANT_TYPES.map((o) => [o.v, o.l])
);

export function isValidApplicantType(v: string): boolean {
  return APPLICANT_TYPES.some((o) => o.v === v);
}

/* ── 오프라인 Final 참석 가능 여부 ────────────────────────
   Finalist 3인 선발 시 노쇼 예비 인원을 함께 고르기 위해 미리 받는다(slide 18 리스크 항목).
   이벤트 페이지 FAQ 가 "지원서에서 참석 가능 여부를 미리 확인합니다"로 약속한 항목이다. */
export const FINAL_ATTEND_OPTIONS = [
  { v: "yes", l: "참석할 수 있습니다" },
  { v: "undecided", l: "아직 모르겠습니다" },
  { v: "no", l: "참석이 어렵습니다 (1차 AI 면접까지만 참여)" },
] as const;

export const FINAL_ATTEND_LABEL: Record<string, string> = Object.fromEntries(
  FINAL_ATTEND_OPTIONS.map((o) => [o.v, o.l])
);

export function isValidFinalAttend(v: string): boolean {
  return FINAL_ATTEND_OPTIONS.some((o) => o.v === v);
}

/* ── 유입 경로 ───────────────────────────────────────────
   기획안 slide 9 의 모집 채널과 같은 구성. UTM 이 안 붙는 유입(카톡·구두 전달·인앱브라우저)을
   메워서 "어느 채널이 실제로 지원까지 데려왔는지"를 본다. */
export const EV_HOW_FOUND_OPTIONS = [
  { v: "article", l: "기사" },
  { v: "univ", l: "학교 공지 (경력개발센터·취업지원센터)" },
  { v: "platform", l: "대외활동 플랫폼 (링커리어·캠퍼스픽·씽굿·위비티)" },
  { v: "community", l: "커뮤니티 (취업카페·개발자 커뮤니티)" },
  { v: "sns", l: "SNS" },
  { v: "search", l: "검색" },
  { v: "referral", l: "지인 추천" },
  { v: "etc", l: "기타" },
] as const;

export const EV_HOW_FOUND_ETC = "etc";

export const EV_HOW_FOUND_LABEL: Record<string, string> = Object.fromEntries(
  EV_HOW_FOUND_OPTIONS.map((o) => [o.v, o.l])
);

export function isValidEvHowFound(v: string): boolean {
  return EV_HOW_FOUND_OPTIONS.some((o) => o.v === v);
}

export function evHowFoundText(how?: string | null, detail?: string | null): string | null {
  if (!how) return null;
  const label = EV_HOW_FOUND_LABEL[how] || how;
  return how === EV_HOW_FOUND_ETC && detail ? `기타 · ${detail}` : label;
}

/* ── 이메일 ──────────────────────────────────────────────
   개인 메일을 허용한다. 막는 건 형식 오류와 일회용(temp mail)뿐 —
   일회용 메일은 11/2~3 면접 링크 발송이 그대로 유실되기 때문에 막는다.
   전체 일회용 목록 대조는 서버(lib/leadGuard.isDisposableEmail)가 한 번 더 한다. */
const TEMP_MAIL_HINTS = [
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "sharklasers.com",
  "temp-mail.org", "tempmail.com", "yopmail.com", "throwawaymail.com",
  "trashmail.com", "maildrop.cc", "getnada.com", "dispostable.com",
];

export function eventEmailError(v: string): "empty" | "format" | "temp" | null {
  const s = v.trim();
  if (!s) return "empty";
  if (!emailRe.test(s)) return "format";
  const domain = s.toLowerCase().split("@")[1] || "";
  if (TEMP_MAIL_HINTS.some((d) => domain === d || domain.endsWith(`.${d}`))) return "temp";
  return null;
}

export const EVENT_EMAIL_ERROR_MSG: Record<"empty" | "format" | "temp", string> = {
  empty: "이메일을 입력해 주세요.",
  format: "올바른 이메일 형식으로 입력해 주세요.",
  temp: "일회용 메일로는 면접 링크를 받을 수 없습니다. 실제로 쓰는 메일을 입력해 주세요.",
};

/** 이름 — 한글·영문·공백만. 쿠폰·상장 표기에 쓰므로 실명을 받는다. */
export function isValidName(v: string): boolean {
  const s = v.trim();
  return s.length >= 2 && s.length <= 40 && /^[가-힣a-zA-Z][가-힣a-zA-Z\s.·-]*$/.test(s);
}
