/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 프레임워크 정보(X-Powered-By: Next.js) 노출 제거 — 버전별 취약점 탐색 방지
  poweredByHeader: false,
  // 정적 호스팅 기반(블로그 커버는 Supabase Storage에 업로드)
  images: {
    // 호스트를 특정한다. 이전엔 hostname:"**"라 /_next/image가 사실상 공개 이미지 프록시였고,
    // 외부에서 임의 URL을 넣어 우리 계정의 Transformations를 소진시킬 수 있었다.
    // (2026-09-10: Vercel 무료 한도 5,000 Transformations 75% 경고 대응)
    remotePatterns: [
      { protocol: "https", hostname: "ymzlcghqamkynuvotzgh.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    // 품질도 한 가지로 고정 — q= 값마다 변환이 새로 카운트되기 때문.
    qualities: [75],
    // 실제 렌더 폭은 카드 560px·본문 히어로 712px·관련글 썸네일 64px뿐이다.
    // 기본값(8단계 · 최대 3840)은 쓰지 않는 폭까지 변환을 만들어내므로 4단계로 줄인다.
    // 2x 기준 최대 필요 폭은 1424px이라 1440으로 충분하다.
    deviceSizes: [640, 828, 1080, 1440],
    imageSizes: [64, 128],
    // 캐시가 만료되면 같은 이미지도 '새 변환'으로 다시 카운트된다. 24시간으로 두면
    // 변환 수가 최대 30배로 불어난다(원본 Supabase 응답이 no-cache라 이 값이 그대로 TTL이 됨).
    // 커버는 재업로드 시 새 파일명을 받으므로 최대치(31일)로 올려도 갱신 문제가 없다.
    minimumCacheTTL: 2678400,
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
