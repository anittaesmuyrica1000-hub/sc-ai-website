"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 공유 GNB(헤더) — 페이지 네비 중심(블로그·서비스소개서·로그인) + 도입문의 CTA.
 * 섹션 앵커(왜 AI 면접인가/작동 방식/…)는 제거(스크롤 점프 방식 폐기).
 * 데스크톱은 인라인 링크, 모바일은 햄버거 메뉴. 섹션 인지형 색상(nav-invert 등) 유지.
 * '서비스소개서'는 BrochureModal이 .js-brochure 위임 클릭으로 처리한다.
 */
export default function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // 섹션 인지형 GNB 색상 — 헤더 중앙선 아래 섹션에 맞춰 테마 토글
  useEffect(() => {
    function syncHeader() {
      const header = headerRef.current;
      if (!header) return;
      const y = window.scrollY;
      const navLine = y + 33;
      function over(sel: string) {
        const els = document.querySelectorAll(sel);
        for (let i = 0; i < els.length; i++) {
          const r = els[i].getBoundingClientRect();
          const top = r.top + y;
          const bottom = top + r.height;
          if (navLine >= top && navLine < bottom) return true;
        }
        return false;
      }
      const overHide = over('[data-nav="hide"]');
      const overDark = over('[data-nav="dark"]');
      const hidden = overHide && y < 40;
      header.classList.toggle("nav-hidden", hidden);
      header.classList.toggle("nav-invert", overDark && !hidden);
      header.classList.toggle("nav-solid", !hidden && !overDark && y > 8);
    }
    window.addEventListener("scroll", syncHeader, { passive: true });
    window.addEventListener("resize", syncHeader, { passive: true });
    syncHeader();
    return () => {
      window.removeEventListener("scroll", syncHeader);
      window.removeEventListener("resize", syncHeader);
    };
    // pathname 변경(클라이언트 라우팅) 시 재실행 — 페이지마다 헤더 색상(로고 반전) 재계산
  }, [pathname]);

  // 메뉴 바깥 클릭 / ESC 로 닫기
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest(".nav-menu") && !t.closest(".nav-menu-btn")) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header ref={headerRef}>
      <nav className="wrap">
        <Link href="/" className="logo">
          <img src="/supercoder-nav.svg" alt="Supercoder" className="nav-logo-img nav-logo--base" />
          <img src="/supercoder-nav-white.svg" alt="Supercoder" className="nav-logo-img nav-logo--invert" />
        </Link>

        <div className="navlinks">
          {/* 데스크톱: 인라인 페이지 링크 */}
          <div className="nav-inline">
            <Link href="/blog">블로그</Link>
            <a href="#" className="js-brochure">서비스소개서</a>
          </div>

          {/* 주 CTA — 항상 노출 */}
          <Link href="/apply" className="btn btn-blue nav-btn">도입 문의</Link>

          {/* 모바일: 햄버거 메뉴 */}
          <div className="nav-menu-wrap">
            <button
              type="button"
              className={`nav-menu-btn${menuOpen ? " open" : ""}`}
              aria-label="메뉴"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="navMenu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="nav-burger"><span></span><span></span><span></span></span>
            </button>
            <div className="nav-menu" id="navMenu" hidden={!menuOpen}>
              <Link href="/blog" onClick={close}>블로그</Link>
              <a href="#" className="js-brochure" onClick={close}>서비스소개서</a>
              <Link href="/apply" className="nav-menu-cta" onClick={close}>도입 문의</Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
