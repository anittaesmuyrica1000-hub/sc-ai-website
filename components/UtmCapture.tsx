"use client";

import { useEffect } from "react";
import { captureUtm } from "@/lib/utm";

// 모든 페이지 진입 시 URL의 utm·클릭 ID(gclid 등)·referrer를 localStorage에 저장한다(layout 마운트, 렌더 없음).
// 랜딩(/)으로 유입돼도 이후 /apply·/brochure 폼 제출 시 유입 경로가 리드에 남는다(30일 유지).
export default function UtmCapture() {
  useEffect(() => {
    captureUtm();
  }, []);
  return null;
}
