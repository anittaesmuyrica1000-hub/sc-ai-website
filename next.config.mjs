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
    ];
  },
};

export default nextConfig;
