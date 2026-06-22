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
            <p>30분 데모를 통해 우리 회사에 맞는 활용 방안을 확인할 수 있습니다.</p>
            <ul className="apply-points">
              <li><span className="ic"><i className="fa-solid fa-shield-halved"></i></span> 지원자 자동 AI 평가</li>
              <li><span className="ic"><i className="fa-solid fa-file-lines"></i></span> 핵심 인재 리포트 제공</li>
              <li><span className="ic"><i className="fa-solid fa-bolt"></i></span> 1일 내 담당자 상담</li>
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
