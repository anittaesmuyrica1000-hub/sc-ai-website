import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../update.css";
import { supabase, type Update } from "@/lib/supabase";
import UpdateShell from "../UpdateShell";
import ViewCounter from "@/components/ViewCounter";

export const dynamic = "force-dynamic";

async function getData(id: string): Promise<{ items: Update[]; active: Update | null }> {
  try {
    const res = await supabase
      .from("updates")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (res.error) throw res.error;
    const items = (res.data as Update[]) || [];
    const active = items.find((u) => u.id === id) || null;
    return { items, active };
  } catch (err) {
    console.error("update load failed:", err);
    return { items: [], active: null };
  }
}

// 비공개(링크 전용) — 검색 색인 금지.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { active } = await getData(id);
  if (!active) return { title: "업데이트를 찾을 수 없습니다", robots: { index: false, follow: false } };
  return {
    title: `${active.title} · 제품 업데이트`,
    description: active.excerpt || undefined,
    robots: { index: false, follow: false },
    alternates: { canonical: `/update/${active.id}` },
  };
}

export default async function UpdateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { items, active } = await getData(id);
  if (!active) notFound();
  return (
    <>
      <ViewCounter id={active.id} rpc="increment_update_views" />
      <UpdateShell items={items} active={active} />
    </>
  );
}
