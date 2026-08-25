"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// 전 페이지 서버측 조회수 +1 — 경로가 바뀔 때마다 1회 호출(클라이언트 라우팅 포함).
// 쿠키·개인식별자를 쓰지 않고 경로별 카운터만 올리므로 쿠키 동의와 무관하게 집계된다.
// 광고 차단·조기 이탈로 GA4가 놓치는 조회도 남으므로, 실제 방문 규모는 이 값으로 본다.
// (단 GA4 조회수와 직접 나눠 포착률로 쓰면 안 된다 — lib/pageViews.ts 주석 참고.)
// increment_page_view RPC(SECURITY DEFINER)가 경로 형식 검증과 /admin·/api 제외를 담당한다.
// 마이그레이션(add-page-views.sql) 전이거나 실패해도 조용히 무시 → 화면엔 영향 없음.
export default function PageViewCounter() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Vercel preview 배포는 집계 제외 (운영 데이터 오염 방지 — Analytics.tsx와 동일 기준)
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") return;
    // 관리자 화면은 내부 트래픽이라 세지 않는다(RPC에서도 한 번 더 막는다)
    if (pathname.startsWith("/admin")) return;

    // 같은 세션에서 같은 경로는 1회만 — 새로고침 연타로 부풀지 않도록(블로그 ViewCounter와 동일 방식)
    const key = `pv:${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage 불가 환경은 그냥 진행 */
    }

    // 배너 제거(2026-08-21) 이후 분석 쿠키는 전 방문자에게 적용되므로 항상 granted다.
    // 차원 자체는 남겨 둔다 — 배너 시절 기록(none/denied)과 이어서 보면 집계가 정상화됐는지 확인할 수 있다.
    const consent: "none" | "denied" | "granted" = "granted";

    supabase.rpc("increment_page_view", { p_path: pathname, p_consent: consent }).then(({ error }) => {
      if (error) console.debug("page view skipped:", error.message);
    });
  }, [pathname]);

  return null;
}
