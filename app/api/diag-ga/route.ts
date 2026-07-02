import { NextRequest } from "next/server";

// [임시 진단] 코드가 실제로 사용하는 GA4 속성 ID와 서비스계정 이메일을 확인한다.
// 비공개 키 등 시크릿은 절대 노출하지 않는다(존재 여부만). 확인 후 이 파일은 삭제한다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const propertyId = process.env.GA_PROPERTY_ID || "543685790(default)";
  const saEmail = process.env.GMAIL_SA_CLIENT_EMAIL || "(unset)";
  const hasKey = !!process.env.GMAIL_SA_PRIVATE_KEY;
  const reportTo = process.env.ANALYTICS_REPORT_TO || "juhee.kim@supercoder.co(default)";
  return Response.json({ ok: true, propertyId, saEmail, hasPrivateKey: hasKey, reportTo });
}
