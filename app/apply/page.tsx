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
            <h1>도입·이용에 대해 문의를 남겨주시면 <br />담당자가 영업일 1일 내 연락드립니다</h1>
            <p>AIVIEW는 AI 면접으로 지원자를 자동 검증하고, 채용팀에는 검증된 핵심 인재 리포트만 전달합니다. 도입 배경이나 궁금한 점을 자유롭게 남겨주세요.</p>
            <ul className="apply-points">
              <li><span className="ic"><i className="fa-solid fa-shield-halved"></i></span> AI 면접으로 전 지원자를 자동 검증</li>
              <li><span className="ic"><i className="fa-solid fa-file-lines"></i></span> 검증된 핵심 인재 리포트만 채용팀에 전달</li>
              <li><span className="ic"><i className="fa-solid fa-bolt"></i></span> 설치·계약 없이 무료로 도입 효과 확인</li>
            </ul>
          </div>
          <div className="apply-formcol">
            <ApplyForm />
          </div>
        </div>
      </div>
    </section>
  );
}
