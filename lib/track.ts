// 클라이언트 전용 GA4 이벤트 전송 헬퍼.
// gtag은 components/Analytics.tsx가 site_settings의 측정 ID로 주입한다.
// 측정 ID 미설정(gtag 없음)이면 조용히 무시하므로, 폼 로직에 영향을 주지 않는다.

type Gtag = (command: "event", eventName: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

// GA4 이벤트 전송(리드/전환 등). 실패해도 예외를 던지지 않는다.
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    /* gtag 미주입 또는 차단됨 — 무시 */
  }
}
