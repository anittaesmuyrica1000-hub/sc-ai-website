export type Post = {
  id: string;
  created_at: string;
  updated_at: string | null;
  title: string;
  category: string | null;
  excerpt: string | null;
  cover_url: string | null;
  content: string;
  author: string | null;
  published: boolean;
};

/** 본문 길이로 읽는 시간(분) 추정 — 한국어 ~500자/분 기준, 최소 1분 */
export function readingTime(content: string): number {
  const len = (content || "").replace(/\s/g, "").length;
  return Math.max(1, Math.round(len / 500));
}

/** 2026년 6월 15일 형식 */
export function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
