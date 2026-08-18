import type { Metadata } from "next";
import "./globals.css";
import "./pretendard.css"; // Pretendard Variable dynamic subset — CSS는 번들, woff2 청크만 jsdelivr
import "./fontawesome.css"; // Font Awesome 6 Free 서브셋 — 사용 아이콘만, 폰트는 /fonts 자체 호스팅
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Chatbot from "@/components/Chatbot";
import Analytics from "@/components/Analytics";
// 쿠키 동의 배너는 2026-08-18 내림(옵트아웃 전환). 방문 규모가 커지면 아래 마운트만 되살리면 된다.
// import CookieBanner from "@/components/CookieBanner";
import UtmCapture from "@/components/UtmCapture";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

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
      "naver-site-verification": "1e951223dfcb033f79a5a7857b56709cf990c5f7",
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
    images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 면접으로 검증된 인재만 만나세요 · AI면접",
    description: "AI 면접이 자동 검증하고, 검증된 핵심 인재 리포트만 전달합니다.",
    images: ["/og-image.png?v=3"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" translate="no">
      <head>
        {/* 한국어 전용 사이트 — 브라우저 자동번역이 원문을 오역(예: '비용 절감'→'미안해요')하는 것을 방지 */}
        <meta name="google" content="notranslate" />
        {/* Pretendard woff2 청크(pretendard.css 참조)용 — CSS 자체는 번들에 포함되어 렌더 차단 외부 요청 없음 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Chatbot />
        <Analytics />
        <VercelAnalytics />
        {/* <CookieBanner /> — 2026-08-18 내림. 되살릴 땐 상단 import와 함께 주석 해제. */}
        <UtmCapture />
      </body>
    </html>
  );
}
