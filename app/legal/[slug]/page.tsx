import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLegalDoc, stripHtml } from "@/lib/legal";
import { RESERVED_LEGAL_SLUGS } from "@/lib/supabase";
import LegalView from "@/components/LegalView";

export const dynamic = "force-dynamic";

// admin에서 추가한 신규 약관의 공개 경로. privacy/terms/terms-applicant는
// 각자의 루트 경로를 쓰므로 여기로 들어오면 그쪽으로 리다이렉트한다.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getLegalDoc(slug);
  if (!doc) return { title: "약관" };
  return {
    title: stripHtml(doc.title),
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVED_LEGAL_SLUGS[slug]) redirect(RESERVED_LEGAL_SLUGS[slug]);
  const doc = await getLegalDoc(slug);
  if (!doc) notFound();
  return <LegalView doc={doc} />;
}
