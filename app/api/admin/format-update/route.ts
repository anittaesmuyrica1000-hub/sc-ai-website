import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { UPDATE_FORMAT_SYSTEM, tidyUpdateHtml } from "@/lib/updateFormat";

// 업데이트 본문 서식 변환 — 대표가 자유 형식으로 쓴 원고를 기존 회차와 같은 골격의 HTML로 재구성한다.
// 어드민 '표준 서식으로 변환' 버튼에서만 호출한다. Claude API를 대신 호출해 주는 경로이므로
// 관리자 인증을 반드시 확인한다(누구나 부를 수 있으면 API 키를 공짜로 쓰게 하는 셈).
export const runtime = "nodejs";
export const maxDuration = 300; // 재구성은 수십 초 걸릴 수 있다

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MAX_INPUT = 40_000; // 원고 길이 상한(글자) — 사고성 대용량 호출 방지

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail("ANTHROPIC_API_KEY가 설정되지 않았습니다. 환경변수를 등록해 주세요.", 503);
  }

  // 1) 관리자 확인 — Supabase 세션 토큰으로 사용자를 조회하고 admins 목록에 있는지 본다.
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return fail("로그인이 필요합니다.", 401);

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  const email = userData?.user?.email;
  if (userErr || !email) return fail("로그인이 만료되었습니다. 다시 로그인해 주세요.", 401);

  const { data: admin, error: adminErr } = await sb.from("admins").select("email").eq("email", email).maybeSingle();
  if (adminErr || !admin) return fail("관리자 권한이 없습니다.", 403);

  // 2) 원고 확인
  let body: { text?: unknown };
  try { body = await req.json(); } catch { return fail("요청 형식이 올바르지 않습니다.", 400); }
  const text = String(body.text ?? "").trim();
  if (!text) return fail("변환할 원고가 비어 있습니다.", 400);
  if (text.length > MAX_INPUT) return fail(`원고가 너무 깁니다(${text.length}자). ${MAX_INPUT}자 이하로 나눠 주세요.`, 413);

  // 3) 재구성 — 출력이 길고 adaptive thinking을 쓰므로 스트리밍으로 받아 HTTP 타임아웃을 피한다.
  try {
    const anthropic = new Anthropic();
    const stream = anthropic.messages.stream({
      model: "claude-opus-5",
      max_tokens: 32000,
      system: UPDATE_FORMAT_SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      messages: [
        { role: "user", content: `아래는 이번 회차 제품 업데이트 원고입니다. 표준 서식의 HTML로 재구성해 주세요.\n\n---\n${text}\n---` },
      ],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return fail("모델이 이 원고의 변환을 거부했습니다. 내용을 확인해 주세요.", 422);
    }
    const html = tidyUpdateHtml(
      message.content.filter((b) => b.type === "text").map((b) => b.text).join("")
    );
    if (!html) return fail("변환 결과가 비어 있습니다. 다시 시도해 주세요.", 502);

    return NextResponse.json({ ok: true, html });
  } catch (err) {
    console.error("format-update failed:", err);
    if (err instanceof Anthropic.RateLimitError) return fail("요청이 몰렸습니다. 잠시 후 다시 시도해 주세요.", 429);
    if (err instanceof Anthropic.AuthenticationError) return fail("ANTHROPIC_API_KEY가 올바르지 않습니다.", 500);
    if (err instanceof Anthropic.APIError) return fail(`변환 중 오류가 발생했습니다(${err.status}).`, 502);
    return fail("변환 중 오류가 발생했습니다.", 500);
  }
}
