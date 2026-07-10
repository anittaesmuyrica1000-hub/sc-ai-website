// 블로그 글 SEO 키워드/해시태그 규칙 기반 추천.
// 제목·본문·카테고리에서 핵심어를 뽑고 슈퍼코더AI면접 도메인 키워드 사전과 조합해 후보를 만든다.
// AI/외부 API 없이 클라이언트에서 즉시 동작(비용 0).

// 슈퍼코더AI면접(AI 면접·채용 SaaS) 도메인 키워드 사전 — 본문에 등장하면 우선 추천.
export const DOMAIN_KEYWORDS = [
  "AI면접", "AI 면접", "채용", "채용트렌드", "역량검증", "HR테크", "채용효율화",
  "지원자경험", "구조화면접", "채용리포트", "인재검증", "면접자동화", "채용담당자",
  "서류전형", "컬처핏", "온라인면접", "채용브랜딩", "스타트업채용", "개발자채용",
  "면접질문", "합격률", "채용비용", "채용기간", "면접관", "공정채용", "블라인드채용",
];

// 추천에서 거를 흔한 한국어 불용어/일반어.
const STOPWORDS = new Set([
  "그리고", "하지만", "그래서", "또한", "또는", "그러나", "때문", "통해", "위해", "대한",
  "그것", "이것", "저것", "우리", "너무", "정말", "에서", "에게", "까지", "부터", "으로",
  "있다", "없다", "합니다", "입니다", "했습니다", "하는", "되는", "같은", "많은", "다양한",
  "경우", "내용", "방법", "사용", "여러", "모든", "이런", "저런", "그런", "현재", "최근",
  "관련", "기타", "여기", "거기", "지금", "오늘", "내일", "어제", "이번", "다음", "통한",
]);

export type RecoInput = { title?: string | null; content?: string | null; category?: string | null };

// 추천 태그 목록(접두 # 없이 원문 키워드) 반환. 최대 max개.
export function recommendTags(input: RecoInput, max = 12): string[] {
  const plain = String(input.content || "").replace(/<[^>]+>/g, " ");
  const hay = `${input.category || ""} ${input.title || ""} ${plain}`;
  const compact = hay.replace(/\s+/g, "");

  const result: string[] = [];
  const push = (w?: string | null) => {
    const t = (w || "").trim();
    if (t && t.length >= 2 && !result.includes(t)) result.push(t);
  };

  // 1) 카테고리 우선
  push(input.category);
  // 2) 도메인 사전 중 본문에 등장하는 키워드
  for (const k of DOMAIN_KEYWORDS) {
    if (compact.includes(k.replace(/\s+/g, ""))) push(k);
  }
  // 3) 빈도 상위 토큰(한글 2자 이상 / 영문 3자 이상)
  const freq = new Map<string, number>();
  const tokens = hay.match(/[가-힣]{2,}|[A-Za-z][A-Za-z0-9]{2,}/g) || [];
  for (const w of tokens) {
    if (STOPWORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map((e) => e[0]);
  for (const w of sorted) {
    if (result.length >= max) break;
    push(w);
  }
  // 4) 글이 비어 추천이 적으면 도메인 사전으로 최소 보장
  if (result.length < 4) {
    for (const k of DOMAIN_KEYWORDS) {
      if (result.length >= 6) break;
      push(k);
    }
  }
  return result.slice(0, max);
}
