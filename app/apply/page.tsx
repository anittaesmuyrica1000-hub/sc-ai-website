import type { Metadata } from "next";
import "./apply.css";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "무료 신청 · AI 면접 채용 검증",
  description:
    "AI면접 무료 도입 신청. AI 면접으로 지원자를 자동 검증하고, 채용팀에 검증된 핵심 인재 리포트를 전달받으세요.",
  alternates: { canonical: "/apply" },
  openGraph: {
    title: "무료 신청 · AI면접 | AI 면접 채용 검증",
    description: "AI 면접으로 지원자를 자동 검증하고, 채용팀에 검증된 핵심 인재 리포트를 전달받으세요.",
    url: "/apply",
  },
};

const APPLY_LOGOS = [
  { src: "/logos/kakaopay-t.png", alt: "kakaopay" },
  { src: "/logos/hyundai-autoever-t.png", alt: "HYUNDAI AutoEver" },
  { src: "/logos/woongjin-t.png", alt: "Woongjin" },
  { src: "/logos/skonec-t.png", alt: "SKONEC entertainment" },
  { src: "/logos/markany-t.png", alt: "MarkAny" },
];

export default function ApplyPage() {
  return (
    <section className="apply">
      <div className="wrap">
        <div className="apply-grid">
          <div className="apply-intro">
            <h1>AI 면접 도입,<br />우리 회사에 맞게 시작하세요</h1>
            <p>채용 규모와 프로세스에 맞는 AI 면접 활용 방안을 안내해드립니다.</p>
            <ul className="apply-points">
              <li><i className="fa-solid fa-circle-check"></i> 지원자 자동 AI 평가</li>
              <li><i className="fa-solid fa-circle-check"></i> 핵심 인재 리포트 제공</li>
              <li><i className="fa-solid fa-circle-check"></i> 영업일 기준 1일 내 상담</li>
            </ul>
            <div className="apply-partners">
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
            </div>
          </div>
          <div className="apply-formcol">
            <ApplyForm />
          </div>
        </div>
      </div>
    </section>
  );
}
