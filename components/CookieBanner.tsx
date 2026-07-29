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
    <div className="cookie-popup">
      <p className="cookie-popup__text">
        방문 분석을 위해 쿠키를 사용합니다.{" "}
        <Link href="/privacy" className="cookie-popup__link">개인정보처리방침</Link>
      </p>
      <div className="cookie-popup__actions">
        <button className="cookie-popup__btn cookie-popup__btn--out" onClick={decline}>거부</button>
        <button className="cookie-popup__btn cookie-popup__btn--blue" onClick={accept}>동의</button>
      </div>
    </div>
  );
}
