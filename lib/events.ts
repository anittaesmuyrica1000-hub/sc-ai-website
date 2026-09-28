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
  /** 커버 이미지가 없으면 블로그와 같은 그라데이션 플레이스홀더를 쓴다 */
  cover?: string;
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
      "가상기업 '슈퍼전자'에 지원해 지원서부터 최종 면접까지 채용 전형을 그대로 겪어 봅니다. 참가비 무료, 전공·학년 제한 없음.",
    period: "모집 2026.10.06 ~ 11.01",
    applyStart: "2026-10-06",
    applyEnd: "2026-11-01",
    applyFrom: "2026년 10월 6일(화)",
    applyTo: "2026년 11월 1일(일) 23:59",
    interview: "2026년 11월 4일(수) ~ 11월 8일(일)",
    announce: "2026년 11월 11일(수)",
    final: "2026년 11월 20일(금), 서울",
    contact: "이벤트 담당자 연락처 준비 중", // TODO(10/06 OPEN 전 필수): 문의 채널 확정 후 교체
    applyUrl: "/event/ai-mock-challenge-2026/apply",
  },
];

/** 오늘 기준 모집 상태. 목록 필터와 카드 뱃지가 같은 값을 쓴다 */
export function statusOf(e: EventItem, today = new Date()): EventStatus {
  const d = today.toISOString().slice(0, 10);
  if (d < e.applyStart) return "upcoming";
  if (d > e.applyEnd) return "closed";
  return "open";
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: "모집 예정",
  open: "모집 중",
  closed: "모집 마감",
};

export function findEvent(slug: string): EventItem | undefined {
  return EVENTS.find((e) => e.slug === slug);
}
