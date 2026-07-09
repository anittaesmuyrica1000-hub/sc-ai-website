import { createClient } from "@supabase/supabase-js";

// 서버 전용: Supabase service_role 키로 "실제 리드"를 집계한다(RLS 우회).
// 사내 이메일(@supercoder.co) 제출은 내부 테스트로 보고 제외한다.
// service_role 키는 절대 클라이언트/깃에 노출 금지 — Vercel 환경변수(SUPABASE_SERVICE_ROLE_KEY)에만.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type RealLeads = { apply: number; brochure: number; total: number; available: boolean };

// 어제(KST 00:00~24:00) 실제 리드 수 — 사내(@supercoder.co) 제외.
export async function getRealLeadsYesterday(): Promise<RealLeads> {
  if (!SUPABASE_URL || !SERVICE_KEY) return { apply: 0, brochure: 0, total: 0, available: false };
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 어제 날짜(KST) 경계를 오프셋 포함 ISO로 구성
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  kst.setDate(kst.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const day = `${kst.getFullYear()}-${p(kst.getMonth() + 1)}-${p(kst.getDate())}`;
  const start = `${day}T00:00:00+09:00`;
  const end = `${day}T23:59:59.999+09:00`;

  const countReal = async (table: "signups" | "brochure_requests"): Promise<number> => {
    const res = await admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", start)
      .lte("created_at", end)
      .not("email", "ilike", "%@supercoder.co");
    if (res.error) {
      console.warn(`real leads count failed (${table}):`, res.error.message);
      return 0;
    }
    return res.count ?? 0;
  };

  const [apply, brochure] = await Promise.all([countReal("signups"), countReal("brochure_requests")]);
  return { apply, brochure, total: apply + brochure, available: true };
}
