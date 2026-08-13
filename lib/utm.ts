// 유입 추적 유틸(클라이언트 전용).
// 광고·뉴스레터 등 utm/클릭 ID(gclid·fbclid)가 붙은 URL로 들어오면 어느 페이지로 랜딩했든
// localStorage에 저장해 두고(30일 유지 — 재방문·새 탭에서도 유지),
// /apply·/brochure 폼 제출 시 읽어 리드(signups·brochure_requests)에 함께 저장한다.
// utm·클릭 ID가 없는 유입은 외부 referrer 호스트명이라도 저장해 유입 출처를 남긴다.
// 우선순위: 현재 URL의 파라미터(최신 캠페인) > 저장된 값(만료 전) > 외부 referrer.
import { TRACKING_KEYS } from "@/lib/supabase";

export type Utm = Partial<Record<(typeof TRACKING_KEYS)[number], string>>;

const STORE_KEY = "sc_utm";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

// URL 쿼리에서 utm_*·gclid·fbclid만 추출(referrer는 URL 파라미터가 아니므로 제외)
function fromSearch(search: string): Utm {
  const qp = new URLSearchParams(search);
  const u: Utm = {};
  for (const k of TRACKING_KEYS) {
    if (k === "referrer") continue;
    const v = (qp.get(k) || "").trim();
    if (v) u[k] = v.slice(0, 300);
  }
  return u;
}

// 외부 사이트에서 넘어온 경우 referrer 호스트명(자기 도메인 이동·직접 방문이면 undefined)
function externalReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    return host && host !== window.location.hostname ? host.slice(0, 300) : undefined;
  } catch {
    return undefined;
  }
}

function sanitize(parsed: Record<string, unknown>): Utm {
  const u: Utm = {};
  for (const k of TRACKING_KEYS) {
    const v = parsed[k];
    if (typeof v === "string" && v) u[k] = v.slice(0, 300);
  }
  return u;
}

// 저장된 유입 정보 읽기(만료 시 제거). 구버전(sessionStorage 저장)도 함께 읽어 이전을 돕는다.
function loadStored(): Utm {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { u?: Record<string, unknown>; ts?: number };
      if (typeof parsed.ts === "number" && Date.now() - parsed.ts < TTL_MS && parsed.u) {
        const u = sanitize(parsed.u);
        if (Object.keys(u).length) return u;
      }
      localStorage.removeItem(STORE_KEY);
    }
    // 레거시: 예전 버전이 sessionStorage에 저장한 값(같은 탭 세션이면 아직 살아있음)
    const legacy = sessionStorage.getItem(STORE_KEY);
    if (legacy) {
      const u = sanitize(JSON.parse(legacy) as Record<string, unknown>);
      if (Object.keys(u).length) {
        save(u);
        sessionStorage.removeItem(STORE_KEY);
        return u;
      }
    }
  } catch {}
  return {};
}

function save(u: Utm): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ u, ts: Date.now() }));
  } catch {}
}

// 페이지 진입 시 유입 정보 저장(최신 캠페인 우선). layout의 UtmCapture에서 호출.
export function captureUtm(): void {
  try {
    const params = fromSearch(window.location.search);
    const ref = externalReferrer();
    if (Object.keys(params).length) {
      // utm/클릭 ID가 붙은 새 유입 — 이번 유입의 referrer와 함께 덮어쓴다(last-touch)
      save(ref ? { ...params, referrer: ref } : params);
      return;
    }
    // 파라미터 없는 유입 — 저장된 캠페인 정보가 있으면 유지, 없고 외부 유입이면 referrer만 기록
    const stored = loadStored();
    if (!Object.keys(stored).length && ref) save({ referrer: ref });
  } catch {}
}

// 폼 제출 시 사용할 유입 정보 — 현재 URL 우선, 없으면 저장된 값.
export function getUtm(): Utm {
  try {
    const cur = fromSearch(window.location.search);
    const stored = loadStored();
    if (Object.keys(cur).length) {
      const ref = externalReferrer() || stored.referrer;
      return ref ? { ...cur, referrer: ref } : cur;
    }
    return stored;
  } catch {
    return {};
  }
}
