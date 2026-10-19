import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, getLegalVersions } from "@/lib/legal";
import LegalViewClient from "@/components/LegalViewClient";
import { buildPageMetadata } from "@/lib/pageSeo";

export const revalidate = 600; // ISR 10분 캐시 — 어드민 저장 시 /api/revalidate 가 즉시 갱신. force-dynamic 은 봇 요청마다 서버 렌더가 돌아 Vercel 무료 CPU 한도를 넘겼다(2026-10-19)

// 동적 세그먼트는 generateStaticParams 가 없으면 revalidate 를 적어도 매 요청 렌더(SSR)로 취급된다.
// 빈 배열을 돌려주면 빌드 때는 아무것도 굽지 않고, 첫 요청 때 렌더한 결과를 revalidate 주기로 캐시한다(on-demand ISR).
export function generateStaticParams() { return []; }

const FALLBACK_METADATA: Metadata = {
  title: "개인정보처리방침 이전 버전",
  description: "AI면접 개인정보처리방침 이전 버전입니다.",
  alternates: { canonical: "/privacy" },
};

export function generateMetadata() {
  return buildPageMetadata("/privacy", FALLBACK_METADATA);
}

export default async function PrivacyDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const [doc, versions] = await Promise.all([
    getLegalDoc("privacy"),
    getLegalVersions("privacy"),
  ]);
  if (!doc) return notFound();
  // 최신 버전 날짜면 selectedVersion 없이 최신 버전 표시
  if (doc.effective_date === date) {
    return <LegalViewClient doc={doc} versions={versions} basePath="/privacy" />;
  }
  const ver = versions.find((v) => v.effective_date === date);
  if (!ver) return notFound();
  return <LegalViewClient doc={doc} versions={versions} selectedVersion={ver} basePath="/privacy" />;
}
