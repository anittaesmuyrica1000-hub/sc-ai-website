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
          <div className="foot-biz">
            <span>(주)세컨드팀</span>
            <span>대표 김도현</span>
            <span>사업자등록번호 220-88-12345</span>
            <span>통신판매업신고 제2026-서울강남-01234호</span>
            <span>서울특별시 강남구 테헤란로 152, 강남파이낸스센터 10층</span>
            <span>대표전화 02-1234-5678</span>
            <span>이메일 support@supercoder.co</span>
          </div>
          <p className="foot-copy">© 2026 Second Team. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
