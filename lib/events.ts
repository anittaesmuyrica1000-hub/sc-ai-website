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
  /** 신청 폼 URL. 미확정이면 상세 페이지 유의사항으로 보낸다 */
  applyUrl: string;
};

export const EVENTS: EventItem[] = [
  {
    slug: "ai-mock-challenge-2026",
    title: "2026 슈퍼코더 AI 모의채용 챌린지",
    excerpt: "가상기업 '슈퍼전자'에 지원해 실제 채용 전형을 그대로 경험합니다. 참가비 무료, 전공·학년 제한 없음.",
    period: "모집 2026.10.06 ~ 11.01",
    applyStart: "2026-10-06",
    applyEnd: "2026-11-01",
    applyFrom: "2026년 10월 6일(화)",
    applyTo: "2026년 11월 1일(일) 23:59",
    interview: "2026년 11월 4일(수) ~ 11월 8일(일)",
    announce: "2026년 11월 11일(수)",
    final: "2026년 11월 20일(금), 서울",
    contact: "이벤트 담당자 연락처 준비 중", // TODO(10/02 확정)
    // TODO(10/02 확정): 신청 폼이 정해지면 여기만 바꾼다. 자체 폼으로 갈 경우
    // 리드 저장은 반드시 서버 라우트를 거친다(RLS로 클라이언트 insert 차단).
    applyUrl: "#apply-notice",
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
