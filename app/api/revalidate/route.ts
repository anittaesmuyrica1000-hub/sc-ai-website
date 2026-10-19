import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// 어드민 저장 직후 공개 페이지의 ISR 캐시를 즉시 버리는 경로 (2026-10-19).
// 배경: 블로그·업데이트·약관 페이지가 force-dynamic이라 봇 요청마다 서버 렌더가 돌아
// Vercel Hobby Active CPU 한도(월 4h)를 넘겼다. 페이지는 revalidate(ISR)로 바꾸고,
// "글 수정이 바로 반영된다"는 기존 동작은 이 경로가 대신한다.
//
// 인증: Supabase 세션 토큰(Bearer) → auth.getUser 로 검증 → admins 테이블에 있는 이메일만 허용.
// 캐시 무효화 자체는 위험한 동작이 아니지만, 아무나 반복 호출하면 재렌더를 유발해 CPU를 쓰므로 막는다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAX_PATHS = 50;
// 사이트 경로만 허용(절대 URL·프로토콜 금지). 한글 slug 허용.
const PATH_RE = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/\-가-힣]*$/;

type Body = { all?: boolean; paths?: unknown };

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.json({ ok: false, error: "not configured" }, { status: 500 });

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  const email = userData?.user?.email;
  if (userErr || !email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // admins 는 authenticated self-select 정책 → 본인 행이 있으면 관리자
  const { data: admin } = await sb.from("admins").select("email").eq("email", email).maybeSingle();
  if (!admin) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { /* 본문 없음 → 전체 */ }

  const paths = Array.isArray(body.paths)
    ? Array.from(new Set(body.paths.filter((p): p is string => typeof p === "string" && PATH_RE.test(p)))).slice(0, MAX_PATHS)
    : [];

  if (body.all || paths.length === 0) {
    // 루트 레이아웃 기준 전체 무효화 — 다음 방문 때만 해당 페이지가 다시 렌더된다.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, all: true });
  }

  for (const p of paths) {
    revalidatePath(p);
    const enc = encodeURI(p);
    if (enc !== p) revalidatePath(enc); // 한글 slug 는 인코딩된 형태로도 캐시될 수 있다
  }
  return NextResponse.json({ ok: true, paths });
}
