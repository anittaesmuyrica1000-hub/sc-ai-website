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
    /* 주요업무·이런 분을 찾습니다는 명사형으로 끝낸다 — 실제 채용공고의 목록 문체다.
       '~합니다'로 끝내면 네 줄이 같은 어미로 반복되어 훑어 읽기 어렵다. */
    /* 팀 소개 — 실제 채용 공고에서 가장 구체적인 부분(누구와 일하나, 첫 석 달에 무엇을 하나).
       팀 규모·입사 후 과정은 2026-09-29에 정한 설정이다(브랜드북 §3-B). 면접 질문과 어긋나지 않게 거기서 함께 고친다 */
    teamIntro: [
      "제품마케팅팀은 여덟 명입니다. 영업팀, 제품개발팀과 매주 한 번 모여 고객사 반응을 나눕니다.",
      "이 제품을 사는 사람은 고객사의 구매 담당자와 설계 엔지니어입니다. 그래서 광고보다 자료와 설명이 정확한지를 먼저 봅니다.",
      "신입은 첫 석 달 동안 선배와 짝을 이뤄 고객사 한 곳을 맡습니다. 조사부터 제안 자료까지 한 바퀴를 직접 돌아 봅니다.",
    ],
    /* 주요업무는 일반 제품/서비스 마케팅의 말로 쓴다(2026-09-30). 전시 자료·영업 설명 자료 같은
       B2B 기술 마케팅 용어는 모델 직무와 결이 다르고, 지원자 대부분이 겪어 본 적 없는 일이다.
       타깃 설정 · 포지셔닝 · 출시 캠페인 · 성과 정리 — 아래 evaluates 세 줄과 짝이 맞는다 */
    duties: [
      "신제품을 누가 살지 조사하고 핵심 타깃 설정",
      "경쟁 제품과 비교해 무엇을 앞세울지 정하는 포지셔닝",
      "출시 일정에 맞춘 캠페인 기획과 실행 (메시지·채널·콘텐츠)",
      "캠페인 결과를 숫자로 정리하고 다음 출시에 반영",
    ],
    /* ⚠️ 1차 면접 채점 틀의 '직무 역량' 세부 기준을 지원자 언어로 옮긴 것이다.
       공고에서 본 것을 면접에서 그대로 묻는 구조라 한쪽만 고치면 안 된다.
       마케팅 기준: 데이터 해석 / 타깃 설정 / 출시 캠페인과 성과지표 설계 */
    evaluates: [
      "숫자를 보고 무엇을 할지까지 정해 본 경험 (동아리 모집 조회수, 설문 응답률처럼 작은 데이터도 괜찮습니다)",
      "모두가 아니라 특정한 누구를 정하고, 왜 그 사람인지 설명해 본 경험",
      "자기가 한 일이 잘됐는지를 무엇으로 판단했는지 설명해 본 경험",
    ],
    // 자격요건 아래 안심 문구. 반도체 회사 공고를 읽고 물러서는 일이 없도록 직군 카피 안에 둔다.
    // 전공·학년은 자격요건 목록에 이미 있어 여기서는 빼고, 목록에 없는 것만 말한다
    notFor:
      "반도체 지식은 없어도 됩니다. 제품을 설명하는 데 필요한 내용은 입사 후 제품개발팀과 함께 배웁니다. 어학 점수, 자격증, 수상 경력도 보지 않습니다.",
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
    teamIntro: [
      "소프트웨어개발팀 여섯 명이 이 서비스를 만들고 운영합니다. 쓰는 사람은 고객사의 설계 엔지니어와 구매 담당자입니다. 원하는 부품 사양을 빨리 찾지 못하면 문의가 영업팀으로 몰리고, 그만큼 계약이 늦어집니다.",
      "신입은 첫 달에 서비스 전체 구조를 익힙니다. 둘째 달부터는 작은 기능 하나를 맡아 영업팀과 직접 이야기하며 만들어 봅니다.",
    ],
    duties: [
      "고객사가 제품 사양을 조회하고 문의를 남기는 화면 개발",
      "그 화면이 불러오는 서버 기능과 데이터 처리",
      "문의 접수부터 담당 영업자 배정까지 이어지는 흐름 개발",
      "동작하지 않는다는 문의가 들어왔을 때 원인 파악과 수정",
      "쓰는 사람이 막히는 지점을 찾아 화면과 흐름 개선",
    ],
    // 개발 기준: 요구사항을 설계로 옮기는 과정 / 디버깅 사례 / 사용자 경험 개선 경험
    evaluates: [
      "무엇을 만들어 달라는 말을 듣고, 어떻게 만들지 스스로 정해 본 경험",
      "안 되는 원인을 끝까지 찾아본 경험 (무엇을 의심했고 어떻게 범위를 좁혔는지 말할 수 있으면 됩니다)",
      "쓰는 사람이 불편해하는 것을 보고 고쳐 본 경험",
    ],
    notFor:
      "사용 언어와 프레임워크는 제한하지 않습니다. 반도체 지식도 필요하지 않고, 어학 점수·자격증·수상 경력도 보지 않습니다.",
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
/* 전형 절차. [원 안에 들어갈 단계 이름, 설명, 기간]
   2026-10-02 회의: 마지막 단계를 '2차 인재상 AI 면접'에서 '오프라인 AI 역량 검사'로 바꿨다.
   면접이 아니라 검사라 '2차 ○○ 면접' 짝을 맞추지 않고 이름 그대로 쓴다. 이 표기는 사이트 전체가 같이 쓴다.
   ⚠️ 이름의 \n 은 의도한 줄바꿈이다. 원 안은 두 줄인데 브라우저에 맡기면
      "1차 직무 AI / 면접" 처럼 엉뚱한 데서 끊긴다(.ev-flow__dot 이 pre-line 으로 받는다). */
/* 2026-10-06: 2단계 이름에 '온라인'을 붙였다 — 4단계가 '오프라인 AI 역량 검사'라
   단계 이름만 훑는 사람에게 온라인·오프라인 구분이 바로 보여야 한다.
   설명에 있던 "온라인으로"·"오프라인으로"는 이름과 겹쳐서 뺐다. */
export const EVENT_STEPS = [
  ["지원서\n접수", "제품마케팅·소프트웨어 개발 중 한 직군을 골라 지원서를 냅니다", "10.08 ~ 11.01"],
  ["온라인 1차\n직무 AI 면접", "응시 기간 안에서 원하는 시간을 골라 응시합니다", "11.06 ~ 11.08"],
  ["Finalist\n발표", "면접 결과를 검토해 직군별로 1인씩, 2인을 선발하고 개별 안내드립니다", "11.11"],
  ["오프라인\nAI 역량 검사", "검사 뒤 시상식과 참가자 인터뷰가 이어집니다", "11.14"],
] as const;

/* 인재상 4 — 슈퍼전자 소개의 일부. [영문, 한글, 한 줄 정의, 이런 사람]
   출처는 브랜드북 §2. 원래 2차 인재상 AI 면접의 평가 축이었으나, 2026-10-02 2차 전형이
   오프라인 AI 역량 검사로 바뀌어 지금은 채점 기준이 아니라 회사가 어떤 사람을 찾는지 보여 주는 자리다.
   '이런 사람' 두 줄은 브랜드북의 행동 서술에서 골랐다.
   ⚠️ 브랜드북의 '면접에서 확인하는 것'(예: 실패를 말할 때 주어가 누구인가)은 싣지 않는다.
      면접 설계에 다시 쓸 수 있는 지점이라 공개하지 않는다. */
export const EVENT_VALUES = [
  [
    "Challenge", "도전", "해보지 않은 방식을 먼저 시도한다",
    ["정해진 방법이 없을 때 멈추지 않고 방법을 만들어 봅니다", "안 될 수도 있다는 걸 알면서 해 보고, 왜 안 됐는지 설명합니다"],
  ],
  [
    "Ownership", "주도", "맡은 일의 결과까지 책임진다",
    ["자기 역할이 끝나는 곳에서 한 걸음 더 갑니다", "결과가 나빴을 때 남 탓 대신 자기 말로 설명합니다"],
  ],
  [
    "Collaboration", "협업", "다른 직군의 언어로 말한다",
    ["배경이 다른 사람에게 자기 일을 알아듣게 설명합니다", "의견이 갈리면 이기려 하기보다 결정을 끌어냅니다"],
  ],
  [
    "Growth", "성장", "어제의 자기 방식을 의심한다",
    ["피드백을 받으면 실제로 방식을 바꿉니다", "필요한 것은 누가 시키지 않아도 배웁니다"],
  ],
] as const;

/** 회사 소개 — 브랜드북 §1-B. 행사 안내의 '슈퍼전자 소개' 가 쓴다.
    지원자가 여기서 알아야 할 것은 '가상 반도체 회사'라는 것과 아래 인재상 4가지뿐이다(2026-09-30).
    설립·인원·본사·사업은 COMPANY_FACTS 카드가 말하므로 문단에서 되풀이하지 않고,
    신제품 양산 이야기는 한 문장으로 줄였다. 제품 설명은 공고 상세(EVENT_JOBS.intro)가 맡는다. */
export const COMPANY_PROFILE = [
  "슈퍼전자는 이 행사를 위해 만든 가상의 반도체 회사입니다. 2026년 하반기 AI 서버용 메모리 신제품 양산을 앞두고 신입사원을 뽑습니다.",
] as const;

/** 회사 개요 — 브랜드북 §1-A */
export const COMPANY_FACTS = [
  ["설립", "2018년"],
  ["임직원", "1,200명"],
  ["본사", "서울"],
  // 용어 안의 공백은 줄바꿈 없는 공백(\u00a0)이다. 칸이 좁아 두 줄이 되는데, 그냥 공백이면
  // '메모리 반도체 · 이미지 / 센서' 처럼 용어 한가운데서 끊긴다. '·' 앞뒤에서만 끊기게 한다.
  ["사업", "메모리\u00a0반도체 · 이미지\u00a0센서"],
] as const;

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
   Finalist 2인 선발 시 노쇼 예비 인원을 함께 고르기 위해 미리 받는다(slide 18 리스크 항목).
   이벤트 페이지 FAQ 가 "지원서에서 참석 가능 여부를 미리 확인합니다"로 약속한 항목이다. */
export const FINAL_ATTEND_OPTIONS = [
  { v: "yes", l: "참석할 수 있습니다" },
  { v: "undecided", l: "아직 모르겠습니다" },
  { v: "no", l: "참석이 어렵습니다 (1차 직무 AI 면접까지만 참여)" },
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
