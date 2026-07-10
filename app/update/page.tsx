import type { Metadata } from "next";
import "./update.css";
import { supabase, type Update } from "@/lib/supabase";
import UpdateShell from "./UpdateShell";

export const dynamic = "force-dynamic";

// 비공개(링크 전용) — 검색 색인 금지.
export const metadata: Metadata = {
  title: "제품 업데이트 · AIVIEW",
  description: "AIVIEW 제품의 새로운 기능과 개선 사항 안내.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/update" },
};

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

  return <UpdateShell items={items} active={items[0] || null} error={error} />;
}
