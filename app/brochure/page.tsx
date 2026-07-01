import type { Metadata } from "next";
import "./brochure.css";
import BrochureForm from "./BrochureForm";
import BrochurePreview from "./BrochurePreview";
import { buildPageMetadata } from "@/lib/pageSeo";

export const revalidate = 120;

const FALLBACK_METADATA: Metadata = {
  title: "서비스 소개서 신청 · AI 면접",
  description:
    "AI 면접 서비스 소개서를 신청하세요. 역량 모델링·AI 면접·분석 리포트부터 측정 가능한 ROI·도입 사례까지, 입력한 회사 이메일로 바로 보내드립니다.",
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
    <section className="brochure">
      <div className="wrap">
        <div className="brochure-top">
          <div className="tagchip"><i className="fa-solid fa-file-lines"></i> 서비스 소개서</div>
          <h1>AI 면접 서비스 소개서 받기</h1>
          <p className="brochure-sub">역량 모델링·AI 면접·분석 리포트부터 측정 가능한 ROI·도입 사례까지 — 슈퍼코더가 채용을 데이터로 바꾸는 방식을 한 부에 담았습니다. 정보를 남기면 입력하신 <b>회사 이메일</b>로 바로 보내드립니다.</p>
        </div>
        <div className="brochure-grid">
          {/* 좌: 소개서를 감싼 박스 + 미리보기 캐러셀 (우측 폼 높이에 맞춰 등높이) */}
          <div className="brochure-previewcol">
            <BrochurePreview />
          </div>
          {/* 우: 신청 폼 */}
          <div className="brochure-formcol">
            <BrochureForm />
          </div>
        </div>
      </div>
    </section>
  );
}
