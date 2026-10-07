"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EVENTS, statusOf, ddayLabel } from "@/lib/events";
import { trackEvent } from "@/lib/track";

/**
 * 홈 첫 진입 시 뜨는 이벤트 센터 팝업(2026-10-07).
 * 상단 스트립(EventBanner)이 상시 진입로라면, 이 팝업은 첫 방문자에게 행사를
 * 한 번 확실히 보여주는 장치다 — 홈("/")에서만 뜨고, 블로그 글 등 다른 입구에서는
 * 스트립만 남겨 반복 방문자를 방해하지 않는다.
 *
 * - 비주얼은 팝업 전용 이미지(/event-popup.webp, 사용자 제작 1440×810 — 2026-10-07).
 *   행사 페이지 히어로(/event-hero-v2.webp)와 같은 3D 키비주얼 계열이라 행사로 이어져 읽히되,
 *   파일은 분리 — 팝업 이미지를 바꿔도 히어로가 따라 바뀌지 않는다.
 *   ⚠️ '이벤트' 칩과 행사명이 이미지 안에 디자인되어 있다 — HTML로 칩·행사명을 다시
 *   얹지 않는다(이중 표기). 대신 img alt가 행사명을 읽는다. 글자 없는 이미지로 되돌리면
 *   옛 오버레이 마크업·스타일은 git 2ac2a9d 참고.
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

/** ISO 날짜 → "10/8" — 팝업 한 줄에 맞춘 최단 표기(앞자리 0 제거) */
function md(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
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
        {/* 비주얼도 통째로 행사 페이지 링크 — 팝업에서 그림을 누르는 사람이 가장 많다 */}
        <Link href={href} className="evp-visual" onClick={onCta}>
          {/* 행사명이 이미지에 들어 있으므로 alt가 그 역할을 한다 */}
          <img src="/event-popup.webp" alt={`이벤트 — ${EVENT.title}`} width={1440} height={810} />
        </Link>

        <div className="evp-body">
          <p className="evp-lead">{EVENT.lead}</p>
          {/* 날짜 줄 = 상태 라벨 + 모집 기간(2026-10-07 사용자) — 모집 전 "10월 8일 모집 시작" → 모집 중 "D-n".
              기간은 applyStart/End에서 "10/8 ~ 11/1"로 만든다(참가비 등 나머지는 비주얼·행사 페이지 몫) */}
          <p className="evp-meta">
            <strong className="evp-dday">{ddayLabel(EVENT, "long")}</strong>
            {` · 모집 기간 ${md(EVENT.applyStart)} ~ ${md(EVENT.applyEnd)}`}
          </p>
          <Link href={href} className="btn btn-blue evp-cta" onClick={onCta}>
            이벤트 자세히 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* 우상단 X는 뺐다(2026-10-07 사용자) — 닫기 수단은 아래 '닫기'·ESC·바깥 클릭으로 충분하고,
            비주얼 위에 떠 있어 이미지를 가렸다 */}
        <div className="evp-foot">
          <button type="button" onClick={hideToday}>오늘 하루 보지 않기</button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={closeSession}>닫기</button>
        </div>
      </div>
    </div>
  );
}
