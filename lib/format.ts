// 공유 포맷 유틸 — 기존 blog-data.js의 esc/fmtDate 대체.
// React는 기본적으로 텍스트를 이스케이프하므로 esc는 dangerouslySetInnerHTML 경로에서만 사용.

export function esc(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 2026. 6. 15. 형식 (한국어 로캘)
export function fmtDate(iso?: string | null): string {
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
