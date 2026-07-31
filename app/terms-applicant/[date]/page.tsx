import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalDoc, getLegalVersions } from "@/lib/legal";
import LegalViewClient from "@/components/LegalViewClient";
import { buildPageMetadata } from "@/lib/pageSeo";

export const dynamic = "force-dynamic";

const FALLBACK_METADATA: Metadata = {
  title: "서비스 이용약관(지원자용) 이전 버전",
  description: "AI면접 서비스 지원자용 이용약관 이전 버전입니다.",
  alternates: { canonical: "/terms-applicant" },
};

export function generateMetadata() {
  return buildPageMetadata("/terms-applicant", FALLBACK_METADATA);
}

export default async function TermsApplicantDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const [doc, versions] = await Promise.all([
    getLegalDoc("terms-applicant"),
    getLegalVersions("terms-applicant"),
  ]);
  if (!doc) return notFound();
  if (doc.effective_date === date) {
    return <LegalViewClient doc={doc} versions={versions} basePath="/terms-applicant" />;
  }
  const ver = versions.find((v) => v.effective_date === date);
  if (!ver) return notFound();
  return <LegalViewClient doc={doc} versions={versions} selectedVersion={ver} basePath="/terms-applicant" />;
}
