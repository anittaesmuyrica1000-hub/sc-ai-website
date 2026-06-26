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
        <div className="foot-top">
          <div className="foot-brand">
            {/* 로고 클릭 = 홈으로 전체 새로고침(Next Link 아닌 일반 앵커라 풀 페이지 로드) */}
            <a href="/" className="foot-logo-link" aria-label="홈으로 새로고침">
              <img src="/supercoder-footer.svg" className="foot-logo-img" alt="Supercoder" />
            </a>
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
          </div>
        </div>
        <div className="foot-bottom">
          <div className="foot-biz">
            <span>(주)세컨드팀</span>
            <span>대표 최재웅</span>
            <span>서울 서초구 효령로55길 19 4층</span>
            <span>이메일 support@supercoder.co</span>
          </div>
          <p className="foot-copy">© 2026 Second Team. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
