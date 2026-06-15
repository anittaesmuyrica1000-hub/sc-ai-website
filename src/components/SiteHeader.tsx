"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrochureModal from "@/components/BrochureModal";

/* 공유 GNB — 기존 partials.js 의 섹션 인지형 헤더 + 햄버거 메뉴를 React 로 이식.
 * 다크 섹션(data-nav="dark") 위 → nav-invert(흰 콘텐츠), 밝은 섹션 스크롤 → nav-solid,
 * 히어로 최상단(data-nav="hide") → nav-hidden. */
export default function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [brochureOpen, setBrochureOpen] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function over(sel: string, navLine: number, y: number) {
      const els = document.querySelectorAll(sel);
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        const top = r.top + y;
        const bottom = top + r.height;
        if (navLine >= top && navLine < bottom) return true;
      }
      return false;
    }

    function syncHeader() {
      if (!header) return;
      const y = window.scrollY;
      const navLine = y + 33;
      const overHide = over('[data-nav="hide"]', navLine, y);
      const overDark = over('[data-nav="dark"]', navLine, y);
      const hidden = overHide && y < 40;
      header.classList.toggle("nav-hidden", hidden);
      header.classList.toggle("nav-invert", overDark && !hidden);
      header.classList.toggle("nav-solid", !hidden && !overDark && y > 8);
    }

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
    window.addEventListener("resize", syncHeader, { passive: true });
    return () => {
      window.removeEventListener("scroll", syncHeader);
      window.removeEventListener("resize", syncHeader);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
    <header ref={headerRef}>
      <nav className="wrap">
        <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/supercoder-nav.svg" alt="Supercoder" className="nav-logo-img nav-logo--base" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/supercoder-nav-white.svg" alt="Supercoder" className="nav-logo-img nav-logo--invert" />
        </Link>
        <div className="navlinks">
          <Link href="/apply" className="btn btn-blue nav-btn">도입 문의</Link>
          <div className="nav-menu-wrap">
            <button
              type="button"
              className={"nav-menu-btn" + (menuOpen ? " open" : "")}
              aria-label="메뉴"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="navMenu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="nav-burger"><span /><span /><span /></span>
            </button>
            <div className="nav-menu" id="navMenu" hidden={!menuOpen} onClick={() => setMenuOpen(false)}>
              <Link href="/#value">왜 AI 면접인가</Link>
              <Link href="/#how">작동 방식</Link>
              <Link href="/#proof">도입 효과</Link>
              <Link href="/#voices">고객 후기</Link>
              <Link href="/blog">블로그</Link>
              <button
                type="button"
                className="nav-menu-cta"
                onClick={() => { setMenuOpen(false); setBrochureOpen(true); }}
              >
                서비스 소개서
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <BrochureModal open={brochureOpen} onClose={() => setBrochureOpen(false)} />
    </>
  );
}
