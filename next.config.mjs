/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 정적 호스팅 기반(이미지 외부 도메인 cover_url 허용)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
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
    ];
  },
};

export default nextConfig;
