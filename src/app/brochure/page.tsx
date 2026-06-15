import Link from "next/link";
import BrochureForm from "./BrochureForm";
import "../apply/apply.css";
import "./brochure.css";

export const metadata = {
  title: "AI 면접관 서비스 소개서",
  description: "정보를 남기면 AIVIEW AI 면접관 서비스 소개서를 바로 받아보실 수 있습니다.",
  alternates: { canonical: "/brochure" },
};

export default function BrochurePage() {
  return (
    <section className="apply">
      <div className="wrap">
        <div className="apply-grid">
          {/* 좌: 카피 */}
          <div className="apply-copy">
            <div className="eyebrow"><i className="fa-solid fa-file-lines" /> 서비스 소개서</div>
            <h1>AI 면접관<br /><span className="blue">서비스 소개서</span></h1>
            <p className="lead">복잡하고 어려운 채용과정, 이제 결정만 하세요. 정보를 남겨주시면 소개서를 바로 받아보실 수 있습니다.</p>
            <ul className="bro-toc">
              <li><i className="fa-solid fa-circle-check" /> AI 면접 작동 방식과 검증 리포트 예시</li>
              <li><i className="fa-solid fa-circle-check" /> 도입 효과(시간·비용 절감) 데이터</li>
              <li><i className="fa-solid fa-circle-check" /> 요금제와 도입 절차 안내</li>
            </ul>
            <div className="trust">500개 이상의 팀이 신뢰하는 선택</div>
          </div>

          {/* 우: 폼 */}
          <div className="apply-card">
            <BrochureForm />
          </div>
        </div>
      </div>
    </section>
  );
}
