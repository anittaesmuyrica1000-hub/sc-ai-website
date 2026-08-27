import type { Metadata } from "next";
import "./update.css";
import { supabase, type Update } from "@/lib/supabase";
import UpdateIndex from "./UpdateIndex";

export const dynamic = "force-dynamic";

// 비공개(링크 전용) — 검색 색인 금지.
export const metadata: Metadata = {
  // 사이트명은 layout.tsx template("%s · AI면접")이 붙인다 — 여기 넣으면 두 번 붙는다
  title: "제품 업데이트",
  description: "슈퍼코더AI면접 제품의 새로운 기능과 개선 사항 안내.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/update" },
};

// 대문(index) — 블로그처럼 전체 업데이트를 카드 리스트 + 찾기로. 모든 기기 열람 가능.
export default async function UpdatePage() {
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
