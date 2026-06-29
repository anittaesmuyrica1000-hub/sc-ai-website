import type { Metadata } from "next";
import Link from "next/link";
import { getLegalDoc } from "@/lib/legal";
import LegalView from "@/components/LegalView";
import { buildPageMetadata } from "@/lib/pageSeo";

export const dynamic = "force-dynamic";

const FALLBACK_METADATA: Metadata = {
  title: "개인정보처리방침",
  description:
    "AI면접 개인정보처리방침 — 정보 수집·이용, 공유, 데이터 보안, 접근·정정·삭제 권리를 안내합니다.",
  alternates: { canonical: "/privacy" },
};
export function generateMetadata() {
  return buildPageMetadata("/privacy", FALLBACK_METADATA);
}

// DB(legal_docs)에 'privacy' 약관이 있으면 그것을, 없으면 아래 정적 콘텐츠로 폴백
export default async function PrivacyPage() {
  const doc = await getLegalDoc("privacy");
  if (doc) return <LegalView doc={doc} />;
  return <PrivacyStatic />;
}

function PrivacyStatic() {
  return (
    <main className="legal">
      <div className="legal-head">
        <h1>개인정보처리방침</h1>
        <p className="legal-meta">운영: 주식회사 세컨드팀 · 문의: support@supercoder.co</p>
      </div>

      <p>주식회사 세컨드팀(이하 “회사”)는 개인정보와 개인정보 보호의 중요성을 인식하고 있습니다. 본 개인정보처리방침은 회사의 채용 플랫폼 서비스와 관련하여 개인정보를 수집·이용·공개하는 방법을 설명합니다.</p>

      <h2>정보 수집 및 이용</h2>
      <ul>
        <li>사용자는 자신의 데이터, 인터뷰 녹음, 전사본, 이력서 및 회사 플랫폼을 통해 공유된 기타 정보가 평가 목적으로 외부 서비스에 전송될 수 있음을 인정합니다.</li>
        <li>인터뷰에서 캡처된 이미지는 프로필과 함께 잠재적 고용주에게 표시되는 고품질의 전문 사진을 생성하는 데 사용될 수 있습니다.</li>
        <li>사용자 데이터는 회사의 모델 품질을 향상시키는 데 사용될 수 있습니다.</li>
        <li>사용자의 데이터, 이력서, AI 인터뷰, 기대 급여 및 플랫폼을 통해 공유된 기타 정보는 회사를 통해 채용하는 기업에서 접근할 수 있습니다.</li>
        <li>회사는 연관된 채용 기회, 뉴스 및 업데이트와 관련한 마케팅 메시지나 이메일을 전송하는 데 사용할 수 있습니다.</li>
      </ul>

      <h2>정보 공유</h2>
      <ul>
        <li>회사는 채용 공고를 게시한 기업과 개인정보를 공유할 수 있습니다.</li>
        <li>회사는 개인정보를 제3자에게 판매하지 않습니다.</li>
      </ul>

      <h2>데이터 보안</h2>
      <p>회사는 개인정보를 무단 접근, 사용 또는 공개로부터 보호하기 위한 합리적인 조치를 취합니다.</p>

      <h2>접근, 정정 및 삭제</h2>
      <p>이용자는 회사가 수집한 개인정보에 대해 액세스, 정정 또는 삭제할 권리가 있으며, 아래 연락처로 요청할 수 있습니다.</p>

      <h2>정책 업데이트</h2>
      <p>회사는 사업 변경 및 법률 변화를 반영하여 본 방침을 업데이트할 수 있으며, 중대한 변경이 있는 경우 이메일로 고지합니다.</p>

      <h2>연락</h2>
      <p>본 방침에 관한 문의는 <a href="mailto:support@supercoder.co">support@supercoder.co</a> 로 연락해 주시기 바랍니다.</p>

      <Link className="back-link" href="/"><i className="fa-solid fa-arrow-left"></i> 홈으로 돌아가기</Link>
    </main>
  );
}
