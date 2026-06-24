import Link from "next/link";
import type { LegalDoc } from "@/lib/supabase";
import { renderContent } from "@/lib/postRender";

// 약관(법적 문서) 렌더 — 본문은 마크다운(블로그와 동일)으로 작성하고 renderContent로 렌더.
// 단, 과거 HTML 본문도 깨지지 않도록 HTML 태그가 있으면 그대로 출력(자동 판별).
// title/body는 관리자(authenticated)만 작성 가능(RLS)하므로 신뢰된 콘텐츠로 렌더한다.
function renderBody(body: string): string {
  const looksHtml = /<(p|h2|h3|h4|ul|ol|li|div|table|br|strong|em)\b/i.test(body);
  return looksHtml ? body : renderContent(body);
}

export default function LegalView({ doc }: { doc: LegalDoc }) {
  return (
    <main className="legal">
      <div className="legal-head">
        <h1 dangerouslySetInnerHTML={{ __html: doc.title }} />
        {doc.meta && <p className="legal-meta">{doc.meta}</p>}
      </div>
      <div dangerouslySetInnerHTML={{ __html: renderBody(doc.body) }} />
      <Link className="back-link" href="/">
        <i className="fa-solid fa-arrow-left"></i> 홈으로 돌아가기
      </Link>
    </main>
  );
}
