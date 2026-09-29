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
    desc: "신제품을 누구에게 무엇으로 팔 것인지 정하고, 출시 캠페인을 기획해 결과를 확인합니다.",
    // 공고 상세(/event/[slug]/jobs/[job])의 여는 문장. 무슨 일인지보다 왜 이 자리를 뽑는지를 먼저 쓴다
    intro:
      "슈퍼전자는 2026년 하반기에 AI 서버용 고대역폭 메모리 신제품 양산을 시작합니다. 이 제품을 어떤 고객사에 무엇으로 설명할지 정하고, 출시에 맞춰 알릴 자리를 만들 사람을 찾습니다.",
    duties: [
      "신제품을 살 만한 고객사가 누구인지, 그들이 부품을 고를 때 무엇을 먼저 보는지 조사합니다",
      "조사한 내용을 바탕으로 어떤 고객에게 무엇을 앞세워 말할지 정합니다",
      "출시 시점에 맞춰 기술 자료와 전시회, 영업팀이 쓸 설명 자료를 기획하고 만듭니다",
      "출시가 끝나면 무엇이 통했고 무엇이 통하지 않았는지 정리해 다음 제품에 넘깁니다",
    ],
    /* ⚠️ 1차 면접 채점 틀의 '직무 역량' 세부 기준을 지원자 언어로 옮긴 것이다.
       공고에서 본 것을 면접에서 그대로 묻는 구조라 한쪽만 고치면 안 된다.
       마케팅 기준: 데이터 해석 / 타깃 설정 / 출시 캠페인과 성과지표 설계 */
    evaluates: [
      "숫자를 보고 무엇을 할지까지 정해 본 경험. 동아리 모집 조회수나 설문 응답률처럼 작은 데이터라도 괜찮습니다",
      "모두가 아니라 특정한 누구를 정하고, 왜 그 사람인지 설명해 본 경험",
      "자기가 한 일이 잘됐는지 아닌지를 무엇으로 판단했는지 말할 수 있는 것",
    ],
    // 반도체 지식을 묻지 않는다는 문장을 직군 카피 안에 둔다 — 공고를 읽고 물러서는 일이 없도록
    notFor: "반도체 지식은 묻지 않습니다. 전공과 학년, 어학 점수, 자격증, 수상 경력도 보지 않습니다.",
    // 공고 카드의 짧은 칩. duties 를 그대로 쓰면 카드에서 줄이 넘쳐 가독성이 떨어진다
    tags: ["시장·고객 분석", "타깃 설정", "캠페인 기획"],
  },
  {
    v: "dev",
    // 기획안 slide 13 의 모델 직무는 "애플리케이션 개발"이지만, 공고 이름은 "소프트웨어 개발"로 쓴다.
    // 애플리케이션은 앱 개발로 좁게 읽혀서 웹·서버 지원자가 걸러진다 — 실제 범위(앱·프론트·백엔드)와도 어긋난다.
    // DB에 저장되는 값(v="dev")은 그대로라 기존 데이터에 영향이 없다.
    l: "소프트웨어 개발",
    team: "소프트웨어개발팀",
    desc: "고객사가 쓰는 웹 서비스의 화면과 서버 기능을 만들고, 동작하지 않는 원인을 찾아 고칩니다.",
    intro:
      "슈퍼전자는 고객사가 제품 사양을 찾아보고 문의를 남기는 웹 서비스를 직접 만들어 운영합니다. 화면부터 서버까지 한 팀이 맡고 있어, 신입도 자기가 만든 기능이 어디서 어떻게 쓰이는지 끝까지 봅니다.",
    duties: [
      "고객사가 제품 사양을 조회하고 문의를 남기는 화면을 만듭니다",
      "그 화면이 불러오는 서버 기능과 데이터를 함께 다룹니다",
      "동작하지 않는다는 문의가 들어오면 원인을 찾아 고칩니다",
      "쓰는 사람이 막히는 지점을 찾아 화면과 흐름을 바꿉니다",
    ],
    // 개발 기준: 요구사항을 설계로 옮기는 과정 / 디버깅 사례 / 사용자 경험 개선 경험
    evaluates: [
      "무엇을 만들어 달라는 말을 듣고, 어떻게 만들지 스스로 정해 본 경험",
      "안 되는 원인을 끝까지 찾아본 경험. 무엇을 의심했고 어떻게 범위를 좁혔는지 말할 수 있으면 됩니다",
      "쓰는 사람이 불편해하는 것을 보고 고쳐 본 경험",
    ],
    notFor: "언어와 프레임워크는 제한하지 않습니다. 전공과 학년, 어학 점수, 자격증, 수상 경력도 보지 않습니다.",
    tags: ["프론트엔드", "백엔드", "디버깅"],
  },
] as const;

export type EventJob = (typeof EVENT_JOBS)[number]["v"];

/* ── 대외 고정 문구·공용 표 ──────────────────────────────
   행사 안내 · 공고 상세 · 지원 폼이 같은 값을 쓴다. 일정이 바뀔 때 고칠 곳을 하나로 둔다. */

// 가상기업 고지 — 포스터·이벤트 페이지·보도자료와 같은 문장(기획안 slide 4 고정 문구).
// 줄이거나 바꾸지 않는다.
export const FICTION_NOTICE =
  "슈퍼전자는 본 행사를 위한 가상 기업입니다. 실제 채용 절차나 입사 자격과 관계가 없으며, 본 행사 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.";

/** 전형 4단계 — [단계, 내용, 일정] */
export const EVENT_STEPS = [
  ["지원서 접수", "마케팅·개발 중 한 직군을 골라 지원서를 냅니다", "10.06 ~ 11.01"],
  ["1차 AI 면접", "온라인으로 진행하며, 응시 기간 안에서 원하는 시간을 골라 응시합니다", "11.04 ~ 11.08"],
  ["Finalist 발표", "면접 결과를 검토해 3인을 선발하고 개별 안내드립니다", "11.11"],
  ["2차 인재상 면접", "오프라인으로 진행하며, 인재상 면접과 참가자 인터뷰, 시상식에 참여합니다", "11.20"],
] as const;

/** 인재상 4 — 2차 오프라인 면접의 평가 축. [영문, 한글, 정의] */
export const EVENT_VALUES = [
  ["Challenge", "도전", "해보지 않은 방식을 먼저 시도한다"],
  ["Ownership", "주도", "맡은 일의 결과까지 책임진다"],
  ["Collaboration", "협업", "다른 직군의 언어로 말한다"],
  ["Growth", "성장", "어제의 자기 방식을 의심한다"],
] as const;

/** 회사 소개문 — 브랜드북 §1-B. 공고·페이지 공통 */
export const COMPANY_INTRO =
  "슈퍼전자는 2018년에 시작한 반도체 회사입니다. 메모리 반도체와 이미지 센서를 만들어 스마트폰, 자동차, 데이터센터에 공급합니다. 회사가 만드는 것이 부품이라 이름이 제품 겉에 드러나지 않지만, 그 안에서 데이터가 얼마나 빨리 오가는지는 슈퍼전자가 정합니다.";

/** 공고 상세(/event/[slug]/jobs/[job])를 가진 행사. 본문이 이 행사 전용이라 다른 행사에는 없다 */
export const JOB_DETAIL_EVENT = "ai-mock-challenge-2026";

export function findJob(v: string) {
  return EVENT_JOBS.find((j) => j.v === v);
}

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
