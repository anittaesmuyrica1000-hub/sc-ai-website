import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, getLegalVersions, versionToDoc } from "@/lib/legal";
import LegalViewClient from "@/components/LegalViewClient";
import { buildPageMetadata } from "@/lib/pageSeo";

export const dynamic = "force-dynamic";

const FALLBACK_METADATA: Metadata = {
  title: "서비스 이용약관(기업용) 이전 버전",
  description: "AI면접 서비스 기업용 이용약관 이전 버전입니다.",
  alternates: { canonical: "/terms" },
};

export function generateMetadata() {
  return buildPageMetadata("/terms", FALLBACK_METADATA);
}

export default async function TermsDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const [doc, versions] = await Promise.all([
    getLegalDoc("terms"),
    getLegalVersions("terms"),
  ]);
  const effectiveDoc = doc ?? (versions.length > 0 ? versionToDoc(versions[0]) : null);
  if (!effectiveDoc) return notFound();
  if (effectiveDoc.effective_date === date) {
    return <LegalViewClient doc={effectiveDoc} versions={versions} basePath="/terms" />;
  }
  const ver = versions.find((v) => v.effective_date === date);
  if (!ver) return notFound();
  return <LegalViewClient doc={effectiveDoc} versions={versions} selectedVersion={ver} basePath="/terms" />;
}
