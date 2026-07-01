import type { Metadata } from "next";
import "./brochure.css";
import BrochureForm from "./BrochureForm";
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

const BROCHURE_LOGOS = [
  { src: "/logos/woongjin-t.png", alt: "Woongjin" },
  { src: "/logos/skonec-t.png", alt: "SKONEC entertainment" },
  { src: "/logos/markany-t.png", alt: "MarkAny" },
];

// 신뢰 로고 마퀴 — 데스크톱(인트로 하단)·모바일(폼 아래) 재사용
function BrochurePartners() {
  return (
    <>
      <p className="brochure-partners-label">이미 500개 이상의 기업이 Supercoder와 함께하고 있습니다</p>
      <div className="brochure-marquee">
        <div className="brochure-marquee-track">
          {Array.from({ length: 6 }).map((_, b) =>
            BROCHURE_LOGOS.map((l, i) => (
              <img key={`${b}-${i}`} src={l.src} alt={b === 0 ? l.alt : ""} aria-hidden={b === 0 ? undefined : true} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function BrochurePage() {
  return (
    <section className="brochure">
      <div className="wrap">
        <div className="brochure-grid">
          {/* 좌: 가치 · 담긴 내용 · 신뢰 로고 */}
          <div className="brochure-intro">
            <p className="eyebrow"><i className="fa-solid fa-file-lines"></i> 서비스 소개서</p>
            <h1>
              <span className="brochure-h1-d">채용의 &lsquo;감&rsquo;을 데이터로,<br />AI 면접이 만드는 변화</span>
              <span className="brochure-h1-m">AI 면접, 채용을 재정의하다</span>
            </h1>
            <p>역량 모델링·AI 면접·분석 리포트부터 측정 가능한 ROI까지 — 슈퍼코더가 채용을 데이터로 바꾸는 방식을 소개서에 담았습니다. 입력하신 <b>회사 이메일</b>로 바로 보내드립니다.</p>
            <ul className="brochure-points">
              <li><i className="fa-solid fa-circle-check"></i> 채용을 데이터로 바꾸는 4단계 (역량 모델링·AI 면접·리포트)</li>
              <li><i className="fa-solid fa-circle-check"></i> 측정 가능한 ROI — 채용 기간·비용·합격률 개선</li>
              <li><i className="fa-solid fa-circle-check"></i> 채용팀·현업·지원자별 도입 효과</li>
              <li><i className="fa-solid fa-circle-check"></i> 실제 도입 사례 &amp; 고객 후기</li>
            </ul>
            <div className="brochure-partners brochure-partners--desktop">
              <BrochurePartners />
            </div>
          </div>

          {/* 우: 신청 폼 */}
          <div className="brochure-formcol">
            <BrochureForm />
          </div>

          {/* 모바일: 로고를 폼 아래로 */}
          <div className="brochure-partners brochure-partners--mobile">
            <BrochurePartners />
          </div>
        </div>
      </div>
    </section>
  );
}
