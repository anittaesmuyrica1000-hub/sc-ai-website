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
