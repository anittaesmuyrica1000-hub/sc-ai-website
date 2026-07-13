// 업데이트 카테고리 → 배지 색상 클래스. 미지정/기타는 기본색.
export function badgeClass(category?: string | null): string {
  const c = (category || "").trim();
  if (/신규|new|기능|출시|런칭/i.test(c)) return "b-blue";        // 신규 기능
  if (/개선|improve|향상|성능|업데이트/i.test(c)) return "b-green"; // 개선·성능
  if (/버그|fix|수정|오류|장애/i.test(c)) return "b-amber";        // 버그 수정
  if (/이벤트|event|프로모|혜택/i.test(c)) return "b-purple";      // 이벤트
  if (/공지|notice|안내|점검|정책|약관/i.test(c)) return "b-gray";  // 공지·안내
  return "b-blue";
}

// 카테고리가 '공지/안내류'인지 — 좌측 사이드바에서 '공지사항' 섹션으로 분류.
export function isNoticeCategory(category?: string | null): boolean {
  return /공지|안내|notice|점검|정책|약관/i.test(category || "");
}

// 어드민 카테고리 추천값(드롭다운)
export const UPDATE_CATEGORIES = [
  "신규 기능", "개선", "성능 개선", "버그 수정", "이벤트", "공지", "안내", "정책 변경",
];
