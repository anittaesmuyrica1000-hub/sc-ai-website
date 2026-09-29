// 이벤트 데이터.
//
// 블로그(posts)와 달리 Supabase 테이블을 쓰지 않는다. DB는 dev·운영이 공유라
// 새 테이블·RLS를 만드는 건 별도 결정 사항이고, 이벤트는 연 몇 건 수준이라
// 코드에 두고 배포로 관리하는 편이 단순하다. 건수가 늘면 그때 테이블로 옮긴다.

export type EventStatus = "upcoming" | "open" | "closed";

export type EventItem = {
  slug: string;
  title: string;
  /** 목록 카드 한 줄 요약 */
  excerpt: string;
  /** 목록 카드 아래 일정 한 줄 */
  period: string;
  /** 모집 시작·마감 (ISO). 상태 계산에 쓴다 */
  applyStart: string;
  applyEnd: string;
  /** 상세 페이지 표기용 원문 문자열 */
  applyFrom: string;
  applyTo: string;
  interview: string;
  announce: string;
  final: string;
  contact: string;
  /**
   * 히어로 배경 이미지. 없으면 파란 그라데이션을 그대로 쓴다.
   * 데스크톱 2560 × 920 (표시 1280×460 @2x), WebP 우선·400KB 이하.
   * 글자가 왼쪽에 얹히므로 이미지의 주요 요소는 오른쪽에 두고, 이미지 안에 글자를 넣지 않는다.
   */
  cover?: string;
  /**
   * 모바일용 세로 비율 이미지. 없으면 cover 를 그대로 쓴다(좌우가 크게 잘린다).
   * 1080 × 760 (표시 540×380 @2x), 250KB 이하.
   */
  coverMobile?: string;
  /** 참가 신청 경로. 자체 폼은 /event/<slug>/apply (app/event/[slug]/apply) */
  applyUrl: string;
};

export const EVENTS: EventItem[] = [
  {
    slug: "ai-mock-challenge-2026",
    // 행사명은 기획안(2026-슈퍼전자-AI면접챌린지-기획안.pptx) 표기를 그대로 쓴다.
    // 포스터·채용공고문·보도자료·대학 게시물과 같은 이름이어야 검색에서 한 건으로 모인다.
    title: "2026 슈퍼전자 AI 면접 챌린지",
    excerpt:
      "가상기업 '슈퍼전자'에 지원해 지원서부터 2차 면접까지 채용 전형을 그대로 겪어 봅니다. 참가비 무료, 전공·학년 제한 없음.",
    period: "모집 2026.10.06 ~ 11.01",
    applyStart: "2026-10-06",
    applyEnd: "2026-11-01",
    applyFrom: "2026년 10월 6일(화)",
    applyTo: "2026년 11월 1일(일) 23:59",
    interview: "2026년 11월 4일(수) ~ 11월 8일(일)",
    announce: "2026년 11월 11일(수)",
    final: "2026년 11월 20일(금), 서울",
    cover: "/event-hero.webp",
    coverMobile: "/event-hero-m.webp",
    contact: "support@supercoder.co",
    applyUrl: "/event/ai-mock-challenge-2026/apply",
  },
];

/**
 * 한국 시간 기준 오늘(YYYY-MM-DD).
 * 모집 시작·마감은 전부 한국 시간 기준으로 공지한다(마감 11/1 23:59).
 * 서버는 UTC라 toISOString()을 그대로 쓰면 한국 시간 00:00~08:59 구간에
 * 하루 전 날짜가 나와서 마감일이 하루 일찍 닫힌다.
 */
function kstToday(now: Date): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 오늘 기준 모집 상태. 목록 필터와 카드 뱃지가 같은 값을 쓴다 */
export function statusOf(e: EventItem, today = new Date()): EventStatus {
  const d = kstToday(today);
  if (d < e.applyStart) return "upcoming";
  if (d > e.applyEnd) return "closed";
  return "open";
}

/**
 * 공고 카드에 붙는 D-day 라벨.
 * 모집 전이면 시작까지(OPEN D-n), 모집 중이면 마감까지(D-n), 지나면 마감.
 * 날짜만 비교하므로 시각과 무관하게 같은 날 안에서는 값이 바뀌지 않는다.
 */
export function ddayLabel(e: EventItem, today = new Date()): string {
  const status = statusOf(e, today);
  if (status === "closed") return "마감";
  const from = Date.parse(`${kstToday(today)}T00:00:00Z`);
  const to = Date.parse(`${status === "upcoming" ? e.applyStart : e.applyEnd}T00:00:00Z`);
  const days = Math.round((to - from) / 86400000);
  if (days <= 0) return "D-DAY";
  return status === "upcoming" ? `OPEN D-${days}` : `D-${days}`;
}

/**
 * 사이드 패널의 일정 표기에서 연도를 뺀다.
 * 행사명("2026 슈퍼전자 AI 면접 챌린지")과 히어로에 이미 연도가 있어
 * 항목마다 "2026년"을 반복하면 다섯 줄이 같은 말로 시작해 날짜가 눈에 안 들어온다.
 * 본문 문장과 지원 폼 안내는 연도를 그대로 쓴다 — 거기서는 문장 하나가 독립적으로 읽혀야 한다.
 */
export function withoutYear(s: string): string {
  return s.replace(/\d{4}년\s*/g, "");
}

/**
 * 접수 기간 한 줄 표기 — "2026.10.06 ~ 11.01".
 * 연도는 시작일에 한 번만 붙인다. 같은 해 안에서 끝나는 행사라 마감일에까지
 * 연도를 반복하면 읽는 사람이 두 연도를 비교하게 된다.
 * 해를 넘기는 행사가 생기면 끝 연도가 다를 때만 붙이도록 여기만 고치면 된다.
 */
export function applyRange(e: EventItem): string {
  const from = e.applyStart.replace(/-/g, ".");
  const to = e.applyEnd.replace(/-/g, ".").replace(/^\d{4}\./, "");
  return `${from} ~ ${to}`;
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "모집 마감",
};

export function findEvent(slug: string): EventItem | undefined {
  return EVENTS.find((e) => e.slug === slug);
}
