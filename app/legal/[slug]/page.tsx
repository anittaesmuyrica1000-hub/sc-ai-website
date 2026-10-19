import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLegalDoc, stripHtml } from "@/lib/legal";
import { RESERVED_LEGAL_SLUGS } from "@/lib/supabase";
import LegalView from "@/components/LegalView";

export const revalidate = 600; // ISR 10분 캐시 — 어드민 저장 시 /api/revalidate 가 즉시 갱신. force-dynamic 은 봇 요청마다 서버 렌더가 돌아 Vercel 무료 CPU 한도를 넘겼다(2026-10-19)

// 동적 세그먼트는 generateStaticParams 가 없으면 revalidate 를 적어도 매 요청 렌더(SSR)로 취급된다.
// 빈 배열을 돌려주면 빌드 때는 아무것도 굽지 않고, 첫 요청 때 렌더한 결과를 revalidate 주기로 캐시한다(on-demand ISR).
export function generateStaticParams() { return []; }

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
