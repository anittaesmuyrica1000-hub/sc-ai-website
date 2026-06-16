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
          <div className="apply-formcol">
            <ApplyForm />
          </div>
        </div>
      </div>
    </section>
  );
}
