import type { Metadata } from "next";
import "./globals.css";
import "./pretendard.css"; // Pretendard Variable dynamic subset — CSS는 번들, woff2 청크만 jsdelivr
import "./fontawesome.css"; // Font Awesome 6 Free 서브셋 — 사용 아이콘만, 폰트는 /fonts 자체 호스팅
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Chatbot from "@/components/Chatbot";
import Analytics from "@/components/Analytics";
import UtmCapture from "@/components/UtmCapture";
import PageViewCounter from "@/components/PageViewCounter";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { getSiteTags, gtmBootstrapJs, gtagConfigJs } from "@/lib/siteTags";
import { CONSENT_DEFAULT_JS } from "@/lib/consent";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Google 태그는 서버에서 <head>에 직접 심는다 — 하이드레이션·Supabase 왕복을 기다리면
  // GA4 첫 히트가 4초 뒤에나 나가 조기 이탈 방문자가 통째로 누락된다(lib/siteTags.ts 주석 참고).
  const tags = await getSiteTags();
  const useGoogleTags = !!(tags.gaId || tags.gtmId);

  return (
    <html lang="ko" translate="no">
      <head>
        {/* 한국어 전용 사이트 — 브라우저 자동번역이 원문을 오역(예: '비용 절감'→'미안해요')하는 것을 방지 */}
        <meta name="google" content="notranslate" />
        {/* Pretendard woff2 청크는 2026-08-27부터 자체 호스팅(public/fonts/pretendard/) —
            같은 오리진이라 페이지 연결을 그대로 쓰고, jsdelivr preconnect는 더 이상 필요 없다. */}
        {useGoogleTags && (
          <>
            {/* 태그 호스트에 미리 붙어 gtag.js 다운로드 지연을 줄인다 */}
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            {/* 동의 기본값은 gtm.js·gtag('config')보다 반드시 먼저 dataLayer에 들어가야 한다 */}
            <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_JS }} />
          </>
        )}
        {tags.gtmId && (
          <script dangerouslySetInnerHTML={{ __html: gtmBootstrapJs(tags.gtmId) }} />
        )}
        {tags.gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${tags.gaId}`} />
            <script dangerouslySetInnerHTML={{ __html: gtagConfigJs(tags.gaId) }} />
          </>
        )}
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Chatbot />
        {/* 어드민이 ID 대신 전체 스니펫을 붙여넣은 경우에만 클라이언트에서 주입한다 */}
        <Analytics gaRaw={tags.gaRaw} gtmRaw={tags.gtmRaw} consentInjected={useGoogleTags} />
        <VercelAnalytics />
        <UtmCapture />
        <PageViewCounter />
      </body>
    </html>
  );
}
