import { supabase } from "@/lib/supabase";

// 어드민 저장 직후 공개 페이지 캐시(ISR)를 즉시 버린다. (/api/revalidate 참고)
// paths 를 주면 그 경로만, 없으면 전체. 실패해도 revalidate 주기(최대 10분) 뒤엔 자동 갱신되므로 조용히 넘어간다.
export async function revalidateSite(paths?: string[]): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(paths && paths.length ? { paths } : { all: true }),
      keepalive: true,
    });
  } catch (err) {
    console.warn("[revalidate] skipped:", err);
  }
}
