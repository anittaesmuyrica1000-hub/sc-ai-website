"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EVENTS, statusOf } from "@/lib/events";
import { trackEvent } from "@/lib/track";

/**
 * 홈 첫 진입 시 뜨는 이벤트 센터 팝업(2026-10-07).
 * 상단 스트립(EventBanner)이 상시 진입로라면, 이 팝업은 첫 방문자에게 행사를
 * 한 번 확실히 보여주는 장치다 — 홈("/")에서만 뜨고, 블로그 글 등 다른 입구에서는
 * 스트립만 남겨 반복 방문자를 방해하지 않는다.
 *
 * - 포스터형(2026-10-07 사용자 선택): 카드 전체가 포스터 이미지 한 장(/event-popup.webp,
 *   1080×1350 4:5 — SNS 포스터와 같은 규격)이고, 아래에 '오늘 하루 보지 않기 · 닫기'만 남는다.
 *   행사명·기간·혜택·전형 절차가 전부 이미지 안에 있으므로 HTML 본문(리드·D-day·CTA 버튼)은
 *   두지 않는다 — 내용 수정은 이미지 재제작·교체로 한다. 이미지 전체가 행사 페이지 링크다.
 *   (16:9 비주얼 + HTML 본문 구조로 되돌리려면 git 897336b 참고)
 * - 행사명·기간·D-day는 전부 lib/events.ts에서 온다. 모집 마감(closed)되면 스스로 사라진다.
 * - '오늘 하루 보지 않기'는 localStorage(KST 날짜), '닫기'는 sessionStorage —
 *   닫아도 다음 방문에는 다시 보이지만, 같은 방문 안에서 다시 뜨지는 않는다.
 */
const EVENT = EVENTS[0];

const HIDE_TODAY_KEY = `evp-hide-today:${EVENT?.slug}`;
const SESSION_KEY = `evp-closed:${EVENT?.slug}`;

/** 한국 시간 기준 오늘(YYYY-MM-DD) — lib/events.ts kstToday와 같은 계산 */
function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function EventPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 노출 판정은 전부 마운트 후(클라이언트) — SSR HTML에 팝업을 넣지 않아
  // 하이드레이션 불일치도, 닫았던 사람에게 번쩍임도 없다. 오버레이라 CLS 걱정도 없다.
  useEffect(() => {
    if (!EVENT || pathname !== "/") return;
    if (statusOf(EVENT) === "closed") return;
    try {
      if (localStorage.getItem(HIDE_TODAY_KEY) === kstToday()) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* 사생활 보호 모드 — 그냥 보여준다 */
    }
    // 첫 페인트 직후 바로 덮지 않고 반 박자 늦게 — 덜 갑작스럽다
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  const closeSession = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* 저장 실패 — 이번 렌더에서만 닫힘 */
    }
  }, []);

  const hideToday = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(HIDE_TODAY_KEY, kstToday());
    } catch {
      /* 저장 실패 — 세션 닫힘과 동일하게 동작 */
    }
  }, []);

  // ESC로 닫기 + 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSession();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeSession]);

  if (!EVENT || pathname !== "/" || !open) return null;

  const href = `/event/${EVENT.slug}`;
  const onCta = () => {
    trackEvent("event_popup_click");
    closeSession();
  };

  return (
    <div className="evp-dim" role="presentation" onClick={closeSession}>
      <div
        className="evp"
        role="dialog"
        aria-modal="true"
        aria-label={`${EVENT.title} 안내`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 포스터 전체가 행사 페이지 링크 — 내용은 이미지가, 접근성은 alt가 담당한다 */}
        <Link href={href} className="evp-visual" onClick={onCta}>
          <img
            src="/event-popup.webp"
            alt={`${EVENT.title} — ${EVENT.period} · 참가비 무료. 눌러서 자세히 보기`}
            width={1080}
            height={1350}
          />
        </Link>

        <div className="evp-foot">
          <button type="button" onClick={hideToday}>오늘 하루 보지 않기</button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={closeSession}>닫기</button>
        </div>

        <button type="button" className="evp-x" aria-label="이벤트 팝업 닫기" onClick={closeSession}>
          ×
        </button>
      </div>
    </div>
  );
}
