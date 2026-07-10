// 업데이트 카테고리 → 배지 색상 클래스. 미지정/기타는 기본색.
export function badgeClass(category?: string | null): string {
  const c = (category || "").trim();
  if (/신규|new|기능/i.test(c)) return "b-blue";     // 신규 기능
  if (/개선|improve|향상/i.test(c)) return "b-green"; // 개선
  if (/버그|fix|수정|오류/i.test(c)) return "b-amber"; // 버그 수정
  if (/공지|notice|안내/i.test(c)) return "b-gray";   // 공지
  return "b-blue";
}

// 어드민 카테고리 추천값
export const UPDATE_CATEGORIES = ["신규 기능", "개선", "버그 수정", "공지"];
