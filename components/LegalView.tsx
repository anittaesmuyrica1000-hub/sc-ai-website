import Link from "next/link";
import type { LegalDoc } from "@/lib/supabase";

// 약관(법적 문서) 렌더 — DB의 HTML 본문을 .legal 스타일로 출력.
// title/body는 관리자(authenticated)만 작성 가능(RLS)하므로 신뢰된 HTML로 렌더한다.
export default function LegalView({ doc }: { doc: LegalDoc }) {
  return (
    <main className="legal">
      <div className="legal-head">
        <h1 dangerouslySetInnerHTML={{ __html: doc.title }} />
        {doc.meta && <p className="legal-meta">{doc.meta}</p>}
      </div>
      <div dangerouslySetInnerHTML={{ __html: doc.body }} />
      <Link className="back-link" href="/">
        <i className="fa-solid fa-arrow-left"></i> 홈으로 돌아가기
      </Link>
    </main>
  );
}
