"use client";

import { useState } from "react";

/* 글 공유 바 — flex.team 블로그 패턴(상단 SNS 공유). 링크/카카오 대신
 * 범용 X·페이스북·링크드인 공유 + 링크 복사. URL은 클라이언트에서 직접 읽는다. */
export default function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => (typeof window !== "undefined" ? window.location.href : "");
  const open = (href: string) =>
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=540");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 클립보드 거부 시 무시 */
    }
  };

  return (
    <div className="share-bar" aria-label="이 글 공유">
      <span className="share-label">공유</span>
      <button
        type="button"
        className="share-btn"
        aria-label="X(트위터)에 공유"
        onClick={() =>
          open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`
          )
        }
      >
        <i className="fa-brands fa-x-twitter" />
      </button>
      <button
        type="button"
        className="share-btn"
        aria-label="페이스북에 공유"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}
      >
        <i className="fa-brands fa-facebook-f" />
      </button>
      <button
        type="button"
        className="share-btn"
        aria-label="링크드인에 공유"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}
      >
        <i className="fa-brands fa-linkedin-in" />
      </button>
      <button type="button" className="share-btn" aria-label="링크 복사" onClick={onCopy}>
        <i className={copied ? "fa-solid fa-check" : "fa-solid fa-link"} />
      </button>
      {copied && <span className="share-copied">링크 복사됨</span>}
    </div>
  );
}
