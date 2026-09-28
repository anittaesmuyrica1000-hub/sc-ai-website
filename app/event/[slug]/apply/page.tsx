import type { Metadata } from "next";
import { notFound } from "next/navigation";
// 폼 카드·입력·동의·완료 화면은 도입문의 폼과 같은 것을 쓴다(.apply-card · .field · .agree …).
import "../../../apply/apply.css";
import "./career.css";
import CareerApply from "./CareerApply";
import { findEvent, statusOf } from "@/lib/events";
import { buildPageMetadata } from "@/lib/pageSeo";

// 모집 상태(모집 예정 → 모집 중 → 모집 마감)를 요청 시 계산한다.
// ⚠️ generateStaticParams 를 두면 안 된다 — 빌드 시점 상태가 HTML에 박혀서
//    10/6 이 와도 재배포 전까지 "아직 접수 전입니다"가 그대로 남는다.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = findEvent(slug);
  if (!e) return { title: "이벤트를 찾을 수 없습니다" };

  // 지원 폼은 검색에 걸릴 이유가 없다. 행사 정보는 상세 페이지가 다 담고 있고,
  // 폼만 있는 화면이 검색 결과로 뜨면 맥락 없이 들어와 그대로 이탈한다 → noindex + canonical 은 상세로.
  const fallback: Metadata = {
    title: `${e.title} 지원하기`,
    description: `${e.title} 참가 신청. 제품마케팅·애플리케이션 개발 중 한 직군을 선택해 지원합니다.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/event/${e.slug}` },
    openGraph: {
      title: `${e.title} 지원하기`,
      description: e.excerpt,
      url: `/event/${e.slug}/apply`,
      images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
    },
  };
  return buildPageMetadata(`/event/${e.slug}/apply`, fallback);
}

export default async function EventApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = findEvent(slug);
  // 본문(채용공고 화면)은 이 행사 전용이다. 다른 이벤트가 생기면 그때 분기한다.
  if (!e || e.slug !== "ai-mock-challenge-2026") notFound();

  return <CareerApply event={e} status={statusOf(e)} />;
}
