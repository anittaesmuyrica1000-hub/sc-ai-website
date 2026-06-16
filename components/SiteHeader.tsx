"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * 공유 GNB(헤더) — 기존 partials.js의 <site-header> + 섹션 인지형 색상 로직 포팅.
 * 마크업/클래스는 theme.css(header.nav-*) 셀렉터가 그대로 적용되도록 동일하게 유지.
 * '서비스소개서' 클릭은 BrochureModal이 #navBrochure 위임 클릭으로 처리한다.
 */
export default function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // 섹션 인지형 GNB 색상(Notion 식) — 헤더 중앙선 아래 섹션에 맞춰 테마 토글
  useEffect(() => {
    function syncHeader() {
      const header = headerRef.current;
      if (!header) return;
      const y = window.scrollY;
      const navLine = y + 33; // 헤더(64px) 중앙선의 문서 좌표
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
  }, []);

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

  return (
    <header ref={headerRef}>
      <nav className="wrap">
        <Link href="/" className="logo">
          <img src="/supercoder-nav.svg" alt="Supercoder" className="nav-logo-img nav-logo--base" />
          <img src="/supercoder-nav-white.svg" alt="Supercoder" className="nav-logo-img nav-logo--invert" />
        </Link>
        <div className="navlinks">
          <Link href="/apply" className="btn btn-blue nav-btn">도입 문의</Link>
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
              <Link href="/#value" onClick={() => setMenuOpen(false)}>왜 AI 면접인가</Link>
              <Link href="/#how" onClick={() => setMenuOpen(false)}>작동 방식</Link>
              <Link href="/#proof" onClick={() => setMenuOpen(false)}>도입 효과</Link>
              <Link href="/#voices" onClick={() => setMenuOpen(false)}>고객 후기</Link>
              <Link href="/blog" onClick={() => setMenuOpen(false)}>블로그</Link>
              <a href="#" id="navBrochure">서비스소개서</a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
