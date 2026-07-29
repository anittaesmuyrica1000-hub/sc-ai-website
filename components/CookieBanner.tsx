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
        더 나은 서비스를 위해 방문 통계를 수집합니다.{" "}
        <Link href="/privacy" className="cookie-popup__link">개인정보처리방침</Link>
      </p>
      <div className="cookie-popup__actions">
        <button className="cookie-popup__btn cookie-popup__btn--out" onClick={decline}>필수만</button>
        <button className="cookie-popup__btn cookie-popup__btn--blue" onClick={accept}>동의</button>
      </div>
    </div>
  );
}
