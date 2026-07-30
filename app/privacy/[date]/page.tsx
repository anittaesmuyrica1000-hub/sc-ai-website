import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, getLegalVersions } from "@/lib/legal";
import LegalViewClient from "@/components/LegalViewClient";
import { buildPageMetadata } from "@/lib/pageSeo";

export const dynamic = "force-dynamic";

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
  const ver = versions.find((v) => v.effective_date === date);
  if (!ver) return notFound();
  return <LegalViewClient doc={doc} versions={versions} selectedVersion={ver} basePath="/privacy" />;
}
