import { createClient } from "@supabase/supabase-js";

// 공개(publishable) 키 — RLS로 보호되므로 클라이언트 노출 안전.
// 값은 환경변수(.env.local / Vercel)에서 주입한다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // 빌드/런타임에서 누락 시 빠르게 인지 (배포 환경변수 설정 누락 방지)
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 가 설정되지 않았습니다.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 블로그 포스트 타입
export type Post = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  cover_url?: string | null;
  content: string;
  author?: string | null;
  published: boolean;
};
