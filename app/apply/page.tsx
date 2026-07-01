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
        <div className="apply-grid">
          <div className="apply-intro">
            <div className="tagchip"><i className="fa-solid fa-comments"></i> 우리 회사 맞춤 상담</div>
            {/* 제목: 데스크톱은 긴 문구, 모바일은 짧게 */}
            <h1>
              <span className="apply-h1-d">AI 면접 도입,<br />우리 회사에 맞게 시작하세요</span>
              <span className="apply-h1-m">AI 면접 도입 문의</span>
            </h1>
            <p>채용 규모와 프로세스에 맞는 AI 면접 활용 방안을 안내해드립니다.</p>
            {/* 체크 포인트 6개(2단) — 서비스덱 p8~11 근거. 모바일에선 숨김 */}
            <ul className="apply-points">
              <li><i className="fa-solid fa-circle-check"></i> 역량 모델 기반 질문 자동 설계</li>
              <li><i className="fa-solid fa-circle-check"></i> 24시간 화상·음성 AI 인터뷰</li>
              <li><i className="fa-solid fa-circle-check"></i> 역량별 점수·근거 분석 리포트</li>
              <li><i className="fa-solid fa-circle-check"></i> 지원자 역량 레이더 비교</li>
              <li><i className="fa-solid fa-circle-check"></i> 이력서·1차 면접 자동화</li>
              <li><i className="fa-solid fa-circle-check"></i> 검증된 핵심 후보만 선별</li>
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
