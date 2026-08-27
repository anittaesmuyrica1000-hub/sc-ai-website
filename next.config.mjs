/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 프레임워크 정보(X-Powered-By: Next.js) 노출 제거 — 버전별 취약점 탐색 방지
  poweredByHeader: false,
  // 정적 호스팅 기반(이미지 외부 도메인 cover_url 허용)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // 블로그 커버는 발행 후 거의 안 바뀌고(재업로드 시 새 파일명 발급) 원본 캐시도 1시간뿐이라,
    // Vercel 엣지 캐시를 24시간으로 늘려 Supabase Storage 재요청(Cached Egress)을 줄인다.
    // (2026-08-24: Supabase Cached Egress 무료 한도 초과 대응 — next/image 전환 후속 조치)
    minimumCacheTTL: 86400,
  },
  // 보안 헤더 (SEO 진단 2026-08-07: 클릭재킹·MIME 스니핑·리퍼러 노출 방지)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // 자체 호스팅 폰트(2026-08-27 jsdelivr에서 이전) — public/ 기본값은
      // max-age=0·must-revalidate라 그대로 두면 재방문마다 재검증 요청이 붙어
      // CDN에 있을 때보다 오히려 느려진다. 파일명에 버전이 박혀 있어 immutable이 안전하다.
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // 구 정적 사이트의 .html URL을 새 라우트로 영구 리다이렉트 (SEO·기존 인바운드 링크 보존)
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/apply.html", destination: "/apply", permanent: true },
      { source: "/blog.html", destination: "/blog", permanent: true },
      { source: "/post.html", destination: "/blog", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/terms.html", destination: "/terms", permanent: true },
      { source: "/terms-applicant.html", destination: "/terms-applicant", permanent: true },
      // 구 사이트의 죽은 경로(구글 색인·외부 링크로 유입돼 404) → 홈으로 흡수 (GA 404 추적 결과)
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/", permanent: true },
      { source: "/customer", destination: "/", permanent: true },
      { source: "/guideline", destination: "/", permanent: true },
      // Search Console 404 정리(2026-07-14): 구 사이트 잔재 경로를 대응 페이지로 흡수.
      // 대응 페이지가 있으면 그쪽으로, 없으면 홈(/)으로. (?lang=en_us 등 쿼리 붙은 변형도 경로만 매칭돼 함께 흡수)
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/promotion-ai-recruiter", destination: "/apply", permanent: true },
      { source: "/download-jd", destination: "/apply", permanent: true },
      { source: "/news", destination: "/blog", permanent: true },
      { source: "/contact", destination: "/apply", permanent: true },
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/blogs/:path*", destination: "/blog", permanent: true },
      { source: "/kr", destination: "/", permanent: true },
      { source: "/kr/:path*", destination: "/", permanent: true },
      { source: "/jobs/:path*", destination: "/", permanent: true },
      { source: "/company", destination: "/", permanent: true },
      { source: "/talent", destination: "/", permanent: true },
      { source: "/talent-terms", destination: "/", permanent: true },
      { source: "/testimonial", destination: "/", permanent: true },
      { source: "/global-hiring", destination: "/", permanent: true },
      { source: "/2-week-trial", destination: "/apply", permanent: true },
      { source: "/contact-us", destination: "/apply", permanent: true },
      { source: "/download", destination: "/brochure", permanent: true },
      { source: "/download-brochure", destination: "/brochure", permanent: true },
      { source: "/404", destination: "/", permanent: true },
      { source: "/ai-interviewer", destination: "/", permanent: true },
      { source: "/events-:slug", destination: "/", permanent: true },
      { source: "/events/:path*", destination: "/", permanent: true },
      { source: "/co/:path*", destination: "/", permanent: true },
      // Search Console 404 정리(2026-08-27): 3개월 실적 CSV의 색인 페이지 92개를 전수 검사해
      // 404로 남아 있던 8개를 흡수한다(3개월 노출 660·클릭 6이 404를 보고 있었다).
      // 옛 사이트의 legal 문서는 이름에 대상이 박혀 있어 현재 문서와 1:1로 대응된다 —
      // candidates=지원자(/terms-applicant), customers=고객사(/terms).
      { source: "/legal/privacy-policy-ai-interviewer", destination: "/privacy", permanent: true },
      { source: "/legal/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/legal/terms-of-service", destination: "/terms", permanent: true },
      { source: "/legal/terms-of-service-ai-interviewer-customers", destination: "/terms", permanent: true },
      { source: "/legal/terms-of-service-ai-interviewer-candidates", destination: "/terms-applicant", permanent: true },
      // /promotion-ai-recruiter → /apply 와 같은 계열의 옛 프로모션 페이지
      { source: "/promotion-ai-interviewer", destination: "/apply", permanent: true },
      { source: "/announcements", destination: "/blog", permanent: true },
      // 옛 빌더가 쓰던 형식의 글 ID. 대응 글이 없어 목록으로 보낸다
      { source: "/blog/1737519639648x358002299084996600", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
