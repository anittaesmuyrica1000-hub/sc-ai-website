"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "all");
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "essential");
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-bar">
      <p className="cookie-bar__text">
        이 사이트는 방문 분석을 위해 쿠키를 사용합니다.{" "}
        <Link href="/privacy" className="cookie-bar__link">개인정보처리방침</Link>
      </p>
      <div className="cookie-bar__actions">
        <button className="btn btn-out cookie-bar__btn" onClick={decline}>필수만 허용</button>
        <button className="btn btn-blue cookie-bar__btn" onClick={accept}>전체 동의</button>
      </div>
    </div>
  );
}
