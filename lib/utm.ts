// UTM 유입 추적 유틸(클라이언트 전용).
// 광고·뉴스레터 등 utm이 붙은 URL로 들어오면 어느 페이지로 랜딩했든 세션에 저장해 두고,
// /apply·/brochure 폼 제출 시 읽어 리드(signups·brochure_requests)에 함께 저장한다.
// 우선순위: 현재 URL의 utm > 세션에 저장된 utm(같은 탭에서 페이지 이동해도 유지).
import { UTM_KEYS } from "@/lib/supabase";

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORE_KEY = "sc_utm";

function fromSearch(search: string): Utm {
  const qp = new URLSearchParams(search);
  const u: Utm = {};
  for (const k of UTM_KEYS) {
    const v = (qp.get(k) || "").trim();
    if (v) u[k] = v.slice(0, 300);
  }
  return u;
}

// 현재 URL에 utm이 있으면 세션에 저장(최신 캠페인 우선). layout의 UtmCapture에서 호출.
export function captureUtm(): void {
  try {
    const u = fromSearch(window.location.search);
    if (Object.keys(u).length) sessionStorage.setItem(STORE_KEY, JSON.stringify(u));
  } catch {}
}

// 폼 제출 시 사용할 utm — 현재 URL 우선, 없으면 세션에 저장된 값.
export function getUtm(): Utm {
  try {
    const cur = fromSearch(window.location.search);
    if (Object.keys(cur).length) return cur;
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const u: Utm = {};
    for (const k of UTM_KEYS) {
      const v = parsed[k];
      if (typeof v === "string" && v) u[k] = v.slice(0, 300);
    }
    return u;
  } catch {
    return {};
  }
}
