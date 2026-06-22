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

export default function ApplyPage() {
  return (
    <section className="apply">
      <div className="wrap">
        <div className="apply-grid">
          <div className="apply-intro">
            <h1>AI 면접으로 채용 효율을 <br />높여보세요</h1>
            <p>지원자 검증부터 채용 결정까지, AI로 더 빠르게.</p>
            <ul className="apply-points">
              <li><i className="fa-solid fa-circle-check"></i> 지원자 자동 AI 평가</li>
              <li><i className="fa-solid fa-circle-check"></i> 핵심 인재 리포트 제공</li>
              <li><i className="fa-solid fa-circle-check"></i> 1일 내 담당자 상담</li>
            </ul>
            <div className="apply-partners">
              <p className="apply-partners-label">이미 500개 이상의 채용팀이 함께합니다</p>
              <div className="apply-logos">
                <img src="/logos/kakaopay.png" alt="kakaopay" />
                <img src="/logos/hyundai-autoever.png" alt="HYUNDAI AutoEver" />
                <img src="/logos/woongjin.png" alt="Woongjin" />
                <img src="/logos/skonec.png" alt="SKONEC entertainment" />
                <img src="/logos/markany.png" alt="MarkAny" />
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
