import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 소개서 다운로드 추적 리다이렉트 — 메일의 "자료 다운로드" 버튼이 이 엔드포인트를 거친다.
// 리드별 download_token으로 누가·언제 받았는지 기록(downloaded_at 최초 1회, download_count 누적)한 뒤
// 현재 소개서 파일의 단기 서명 URL로 리다이렉트한다. 신청 후 7일이 지나면 만료 처리(기존 안내 문구와 동일).

export const runtime = "nodejs";

const SITE_URL = "https://www.supercoder.co";
const LINK_TTL = 60 * 10; // 리다이렉트용 서명 URL 10분(버튼 클릭 시마다 새로 발급)
const VALID_DAYS = 7;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") || "";
  const fallback = NextResponse.redirect(`${SITE_URL}/brochure`, 302);
  if (!uuidRe.test(token)) return fallback;

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("brochure-download: Supabase 서버 환경변수 누락");
    return fallback;
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data: lead } = await admin
    .from("brochure_requests")
    .select("id, created_at, downloaded_at, download_count")
    .eq("download_token", token)
    .maybeSingle();
  if (!lead) return fallback;

  // 신청 후 7일 경과 → 만료. 재신청 페이지로 안내.
  if (Date.now() - new Date(lead.created_at).getTime() > VALID_DAYS * 24 * 60 * 60 * 1000) {
    return NextResponse.redirect(`${SITE_URL}/brochure?expired=1`, 302);
  }

  const { data: cur } = await admin
    .from("brochure_files")
    .select("path")
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cur?.path) return fallback;

  const { data: signed } = await admin.storage.from("brochures").createSignedUrl(cur.path, LINK_TTL);
  if (!signed?.signedUrl) return fallback;

  // 클릭 기록(베스트 에포트) — 실패해도 다운로드는 진행
  const { error: upErr } = await admin
    .from("brochure_requests")
    .update({
      downloaded_at: lead.downloaded_at ?? new Date().toISOString(),
      download_count: (lead.download_count ?? 0) + 1,
    })
    .eq("id", lead.id);
  if (upErr) console.error("brochure-download: 클릭 기록 실패(무시)", upErr);

  return NextResponse.redirect(signed.signedUrl, 302);
}
