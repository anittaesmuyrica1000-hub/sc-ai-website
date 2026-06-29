"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 공유 푸터 — 기존 partials.js <site-footer> 포팅. theme.css(footer) 셀렉터 적용.
export default function SiteFooter() {
  const pathname = usePathname();
  // 어드민 콘솔에서는 공개 푸터 숨김(자체 레이아웃)
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer>
      <div className="wrap">
        {/* 1) 로고 — 클릭 시 홈으로 전체 새로고침(일반 앵커) */}
        <a href="/" className="foot-logo-link" aria-label="홈으로 새로고침">
          <img src="/supercoder-footer.svg" className="foot-logo-img" alt="Supercoder" />
        </a>

        {/* 2) 상품정보 — 서비스 + 약관 */}
        <nav className="foot-nav">
          <Link href="/apply">도입 문의</Link>
          <a href="#" className="js-brochure">서비스소개서</a>
          <Link href="/blog">블로그</Link>
          <a href="https://ai.supercoder.co/recruiter" target="_blank" rel="noopener noreferrer">로그인</a>
        </nav>
        <div className="foot-legal">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">기업용 서비스 이용약관</Link>
          <Link href="/terms-applicant">지원자용 서비스 이용약관</Link>
        </div>

        {/* 3) 기업정보 — 맨 하단 */}
        <hr className="foot-divider" />
        <div className="foot-biz">
          <span>(주)세컨드팀</span>
          <span>대표 최재웅</span>
          <span>서울 서초구 효령로55길 19 4층</span>
          <span>support@supercoder.co</span>
        </div>
        <p className="foot-copy">© 2026 Second Team. All rights reserved.</p>
      </div>
    </footer>
  );
}
