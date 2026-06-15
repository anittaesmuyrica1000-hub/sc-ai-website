import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { type Post } from "@/lib/types";
import AdminClient from "./AdminClient";
import "./admin.css";

export const metadata: Metadata = {
  title: "블로그 관리",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminClient initialPosts={(data ?? []) as Post[]} userEmail={user?.email ?? ""} />;
}
