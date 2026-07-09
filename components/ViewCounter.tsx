"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// 블로그 글 조회수 +1 — 상세 페이지 로드 시 브라우저에서 1회 호출.
// increment_post_views RPC(SECURITY DEFINER)로 anon도 views만 안전하게 증가.
// 마이그레이션(add-post-views.sql) 전이거나 실패해도 조용히 무시 → 페이지엔 영향 없음.
// 같은 글 재방문 시 하루 1회만 세도록 sessionStorage로 중복 억제(간이).
export default function ViewCounter({ id }: { id: string }) {
  useEffect(() => {
    if (!id) return;
    const key = `viewed:${id}`;
    try {
      if (sessionStorage.getItem(key)) return; // 이 세션에서 이미 카운트함
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage 불가 환경은 그냥 진행 */
    }
    supabase.rpc("increment_post_views", { pid: id }).then(({ error }) => {
      if (error) console.debug("view count skipped:", error.message);
    });
  }, [id]);
  return null;
}
