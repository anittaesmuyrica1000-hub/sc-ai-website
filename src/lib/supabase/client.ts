import { createBrowserClient } from "@supabase/ssr";

/** 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트. publishable(anon) 키 사용. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
