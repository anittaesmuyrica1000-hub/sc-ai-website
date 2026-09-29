"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/track";

/* 공고·행사 페이지의 링크를 복사하는 버튼.
   취준생이 공고를 옮기는 경로는 대부분 단톡방과 커뮤니티 링크다. 지원 폼 URL 하나만으로는
   그 경로가 끊긴다 — 열자마자 개인정보 입력 화면이 나오기 때문이다.

   동작이 기기에 따라 갈린다(2026-09-29 결정):
   · 모바일(포인터 coarse) → OS 공유 시트. 카카오톡 단톡방으로 한 번에 넘어간다.
   · 데스크톱 → 클립보드 복사 + 토스트.

   ⚠️ 데스크톱에서 시트를 열면 안 된다. macOS 는 AirDrop·메모·일기·미리 알림까지
      늘어서서, 링크 하나 넘기려는 사람에게 고를 것만 늘린다.
      navigator.share 존재 여부만으로 분기하면 안 된다 — 사파리·크롬 데스크톱에도 있다.
      포인터가 coarse 인지(손가락인지)를 함께 본다.

   ⚠️ 공유 시트를 닫는 것은 실패가 아니다(AbortError). 여기서 복사로 되돌리면
      "취소했는데 복사됨" 토스트가 떠서 무엇이 일어났는지 알 수 없게 된다. */

type Props = {
  /** 공유할 경로(/event/...). origin 은 클릭 시점의 location 에서 붙인다 */
  path: string;
  /** 공유 시트에 넘길 제목(모바일). 카카오톡 대화방에 이 문구가 보인다 */
  title: string;
  text?: string;
  /** utm_campaign — 행사 slug */
  campaign: string;
  /** utm_content — 직군 등 어느 공고에서 나간 링크인지 */
  content?: string;
  /** GA4 에서 어느 자리의 버튼인지 구분한다 */
  position: "header" | "side" | "hero" | "bottom";
  /** icon: 아이콘만 · line: 테두리 알약 · text: 테두리 없이 아이콘+글자 */
  variant?: "icon" | "line" | "text";
  label?: string;
  /**
   * 아이콘 모양.
   * · upload — iOS 공유 모양 (fa-arrow-up-from-bracket)
   * · link   — 링크 (fa-link)
   * · nodes  — 점 세 개를 이은 공유 기호. 인라인 SVG 다.
   *
   * ⚠️ nodes 를 FontAwesome 으로 못 쓰는 이유: fa-share-nodes(\f1e0) 글리프가
   *    public/fonts/fa-solid-900.woff2 서브셋에 없고 app/fontawesome.css 클래스 목록에도 없다.
   *    클래스를 써도 ::before content 가 비어 아무것도 안 나온다.
   *    FontAwesome 아이콘을 새로 쓸 때는 반드시 woff2 의 cmap 을 먼저 확인할 것.
   */
  icon?: "upload" | "link" | "nodes";
};

export default function ShareButton({
  path,
  title,
  text,
  campaign,
  content,
  position,
  variant = "icon",
  label = "공고 공유하기",
  icon = "upload",
}: Props) {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function flash(msg: string) {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2500);
  }

  function buildUrl(): string {
    const u = new URL(path, window.location.origin);
    // 지원서의 유입경로 문항과 교차 검증한다 — "지인 추천"이 실제로 공유 링크였는지 보인다
    u.searchParams.set("utm_source", "share");
    u.searchParams.set("utm_medium", "social");
    u.searchParams.set("utm_campaign", campaign);
    if (content) u.searchParams.set("utm_content", content);
    return u.toString();
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      flash("링크를 복사했어요");
      trackEvent("share_click", { method: "clipboard", position, content });
      return;
    } catch {
      /* 권한 거부·비보안 컨텍스트 — 아래 폴백으로 */
    }
    try {
      // clipboard API 가 막힌 환경(구형 사파리·http)용 폴백
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flash("링크를 복사했어요");
      trackEvent("share_click", { method: "exec_command", position, content });
    } catch {
      flash("복사하지 못했습니다. 주소창의 링크를 복사해 주세요");
    }
  }

  /* 손가락으로 쓰는 기기에서만 공유 시트를 연다 — 위 주석의 이유 */
  function canUseShareSheet(): boolean {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }

  async function onClick() {
    const url = buildUrl();
    if (canUseShareSheet()) {
      try {
        await navigator.share({ title, text, url });
        trackEvent("share_click", { method: "web_share", position, content });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        /* 시트가 뜨지 못한 경우에만 복사로 넘어간다 */
      }
    }
    await copy(url);
  }

  return (
    <span className="share-wrap">
      <button
        type="button"
        className={`share-btn share-btn--${variant}`}
        onClick={onClick}
        aria-label={label}
        title={label}
      >
        {icon === "nodes" ? (
          <svg className="share-btn__svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="12.4" cy="3.4" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="3.6" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="12.4" cy="12.6" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M5.7 6.9 10.4 4.5M5.7 9.1 10.4 11.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <i className={`fa-solid ${icon === "link" ? "fa-link" : "fa-arrow-up-from-bracket"}`} aria-hidden="true"></i>
        )}
        {variant !== "icon" && <span>{label}</span>}
      </button>
      {/* 화면 낭독기도 결과를 듣도록 role="status". 토스트가 없을 때도 노드를 유지한다 */}
      <span className="share-toast" role="status" aria-live="polite" data-show={toast ? "1" : "0"}>
        {toast}
      </span>
    </span>
  );
}
