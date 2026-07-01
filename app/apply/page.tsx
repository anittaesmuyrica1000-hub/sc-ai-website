import type { Metadata } from "next";
import "./apply.css";
import ApplyForm from "./ApplyForm";
import { buildPageMetadata } from "@/lib/pageSeo";

// 어드민 SEO 초안(page_seo)이 바뀌면 주기적으로 반영(정적 생성 → ISR).
export const revalidate = 120;

const FALLBACK_METADATA: Metadata = {
  title: "무료 신청 · AI 면접 채용 검증",
  description:
    "AI면접 무료 도입 신청. AI 면접으로 지원자를 자동 검증하고, 채용팀에 검증된 핵심 인재 리포트를 전달받으세요.",
  alternates: { canonical: "/apply" },
  openGraph: {
    title: "무료 신청 · AI면접 | AI 면접 채용 검증",
    description: "AI 면접으로 지원자를 자동 검증하고, 채용팀에 검증된 핵심 인재 리포트를 전달받으세요.",
    url: "/apply",
    images: [{ url: "/og-image.png?v=2", width: 1200, height: 630 }],
  },
};
export function generateMetadata() {
  return buildPageMetadata("/apply", FALLBACK_METADATA);
}

const APPLY_LOGOS = [
  { src: "/logos/woongjin-t.png", alt: "Woongjin" },
  { src: "/logos/skonec-t.png", alt: "SKONEC entertainment" },
  { src: "/logos/markany-t.png", alt: "MarkAny" },
];

// 신뢰 로고 마퀴 — 데스크톱(인트로 안)·모바일(폼 아래) 두 곳에서 재사용
function ApplyPartners() {
  return (
    <>
      <p className="apply-partners-label">이미 500개 이상의 기업이 Supercoder와 함께하고 있습니다</p>
      <div className="apply-marquee">
        <div className="apply-marquee-track">
          {Array.from({ length: 6 }).map((_, b) =>
            APPLY_LOGOS.map((l, i) => (
              <img
                key={`${b}-${i}`}
                src={l.src}
                alt={b === 0 ? l.alt : ""}
                aria-hidden={b === 0 ? undefined : true}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function ApplyPage() {
  return (
    <section className="apply">
      <div className="wrap">
        {/* 상단 중앙 헤딩 — 블로그·서비스소개서와 동일하게 중앙정렬 */}
        <div className="apply-top">
          <h1>
            <span className="apply-h1-d">AI 면접 도입, 우리 회사에 맞게 시작하세요</span>
            <span className="apply-h1-m">AI 면접 도입 문의</span>
          </h1>
          <p>채용 규모와 프로세스에 맞는 AI 면접 활용 방안을 안내해드립니다.</p>
        </div>
        <div className="apply-grid">
          <div className="apply-intro">
            {/* 체크 포인트 — 모바일에선 숨김 */}
            <ul className="apply-points">
              <li><i className="fa-solid fa-circle-check"></i> 지원자 자동 AI 평가</li>
              <li><i className="fa-solid fa-circle-check"></i> 핵심 인재 리포트 제공</li>
              <li><i className="fa-solid fa-circle-check"></i> 영업일 기준 1일 내 상담</li>
            </ul>
            {/* 데스크톱: 로고를 인트로 안에 유지 */}
            <div className="apply-partners apply-partners--desktop">
              <ApplyPartners />
            </div>
          </div>
          <div className="apply-formcol">
            <ApplyForm />
          </div>
          {/* 모바일: 로고를 폼 아래로 */}
          <div className="apply-partners apply-partners--mobile">
            <ApplyPartners />
          </div>
        </div>
      </div>
    </section>
  );
}
