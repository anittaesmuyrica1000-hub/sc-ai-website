import type { Metadata } from "next";
import "./brochure.css";
import BrochureForm from "./BrochureForm";
import { buildPageMetadata } from "@/lib/pageSeo";

export const revalidate = 120;

const FALLBACK_METADATA: Metadata = {
  title: "서비스 소개서 신청 · AI 면접",
  description:
    "AI 면접 서비스 소개서를 신청하세요. 정보를 남기면 입력한 회사 이메일로 소개서를 바로 보내드립니다.",
  alternates: { canonical: "/brochure" },
  openGraph: {
    title: "AI 면접 서비스 소개서 신청",
    description: "정보를 남기면 회사 이메일로 AI 면접 서비스 소개서를 바로 받아보실 수 있습니다.",
    url: "/brochure",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
  },
};
export function generateMetadata() {
  return buildPageMetadata("/brochure", FALLBACK_METADATA);
}

export default function BrochurePage() {
  return (
    <main className="brochure-page">
      <div className="brochure-inner">
        <div className="brochure-hero">
          <p className="eyebrow">SERVICE BROCHURE</p>
          <h1>AI 면접 서비스 소개서</h1>
          <p>정보를 남겨주시면 입력하신 <b>회사 이메일</b>로 소개서를 바로 보내드립니다.</p>
        </div>
        <BrochureForm />
      </div>
    </main>
  );
}
