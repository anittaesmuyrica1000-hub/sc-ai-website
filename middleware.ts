import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Vercel 배포 도메인(*.vercel.app) 접속 시 검색엔진 색인 차단.
// 운영 도메인(www.supercoder.co)만 Google에 노출되어야 하므로,
// Vercel 자체 URL로 접근한 요청에 X-Robots-Tag: noindex 지시문을 추가한다.
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.endsWith(".vercel.app")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};
