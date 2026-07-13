import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "./update.css";
import { supabase, type Update } from "@/lib/supabase";
import UpdateIndex from "./UpdateIndex";

export const dynamic = "force-dynamic";

// 비공개(링크 전용) — 검색 색인 금지.
export const metadata: Metadata = {
  title: "제품 업데이트 · 슈퍼코더AI면접",
  description: "슈퍼코더AI면접 제품의 새로운 기능과 개선 사항 안내.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/update" },
};

// 대문(index) — 블로그처럼 전체 업데이트를 카드 리스트 + 찾기로. 모든 기기 열람 가능.
export default async function UpdatePage() {
  // 운영(main 사이트)에선 아직 숨김 — dev 프리뷰에서만 노출(준비 중). 운영 배포에선 404.
  if (process.env.VERCEL_ENV === "production") notFound();

  let items: Update[] = [];
  let error = false;
  try {
    const res = await supabase
      .from("updates")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (res.error) throw res.error;
    items = (res.data as Update[]) || [];
  } catch (err) {
    console.error("updates load failed:", err);
    error = true;
  }

  return <UpdateIndex items={items} error={error} />;
}
