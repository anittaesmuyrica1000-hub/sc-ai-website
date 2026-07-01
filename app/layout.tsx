import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Chatbot from "@/components/Chatbot";
import Analytics from "@/components/Analytics";

const SITE_URL = "https://www.supercoder.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AI면접 · AI 면접으로 검증된 인재만 | 채용 자동화 SaaS",
    template: "%s · AI면접",
  },
  description:
    "AI 면접이 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달합니다. 가짜 이력서·과장 스펙을 걸러내는 채용 검증 솔루션 AI면접.",
  applicationName: "AI면접",
  verification: {
    google: "cENYN-zUA2ecZGbCMZ8HIaWgnx5AfBaN2-XPVHJhaaQ",
    other: {
      "naver-site-verification": "d889488a4b87a1c71896d00766be357b830f430f",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "AI면접",
    locale: "ko_KR",
    url: SITE_URL,
    title: "AI 면접으로 검증된 인재만 만나세요 · AI면접",
    description: "AI 면접이 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달합니다.",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 면접으로 검증된 인재만 만나세요 · AI면접",
    description: "AI 면접이 자동 검증하고, 검증된 핵심 인재 리포트만 전달합니다.",
    images: ["/og-image.png?v=2"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Chatbot />
        <Analytics />
      </body>
    </html>
  );
}
