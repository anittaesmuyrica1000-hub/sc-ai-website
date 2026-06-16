import Link from "next/link";

// 공유 푸터 — 기존 partials.js <site-footer> 포팅. theme.css(footer) 셀렉터 적용.
export default function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <img src="/supercoder-footer.svg" className="foot-logo-img" alt="Supercoder" />
          </div>
          <div className="foot-links">
            <div className="foot-col">
              <h4>AI 면접관</h4>
              <ul>
                <li><Link href="/privacy">개인정보처리 방침</Link></li>
                <li><Link href="/terms">기업용 서비스 이용약관</Link></li>
                <li><Link href="/terms-applicant">지원자용 서비스 이용약관</Link></li>
              </ul>
            </div>
            <div className="foot-col">
              <h4>글로벌 인재 채용</h4>
              <ul>
                <li><Link href="/privacy">개인정보처리 방침</Link></li>
                <li><Link href="/terms">서비스 이용약관</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <p className="foot-copy">© 2026 Second Team. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
