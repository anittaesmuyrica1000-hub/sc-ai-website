"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EVENTS, statusOf, ddayLabel } from "@/lib/events";
import { trackEvent } from "@/lib/track";

/**
 * 홈 첫 진입 시 좌하단에 올라오는 이벤트 코너 카드(2026-10-07 사용자 선택).
 * 상단 스트립(EventBanner)이 상시 진입로라면, 이 카드는 첫 방문자에게 행사를
 * 한 번 더 보여주는 장치다 — 홈("/")에서만 뜨고, 콘텐츠를 가리지 않아
 * 닫지 않아도 브라우징을 방해하지 않는다(모달 아님 — 딤·스크롤 잠금 없음).
 *
 * - 좌하단 고정: 우하단은 챗봇(.cbot) 자리다. z-index도 챗봇(120)보다 낮게 둔다.
 * - 썸네일은 글자 없는 키비주얼(/event-popup.webp 720×405) — 행사명·D-day는
 *   HTML 텍스트가 맡아 작은 카드에서도 선명하다.
 * - 행사명·일정은 전부 lib/events.ts에서 온다. 모집 마감(closed)되면 스스로 사라진다.
 * - 닫기(×)는 sessionStorage — 같은 방문 안에서 다시 뜨지 않고, 다음 방문엔 다시 보인다.
 * - 센터 모달 구조가 필요하면: 포스터형은 git 65e5b5d, 16:9+본문형은 897336b 참고.
 */
const EVENT = EVENTS[0];

const SESSION_KEY = `evp-closed:${EVENT?.slug}`;

export default function EventPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 노출 판정은 전부 마운트 후(클라이언트) — SSR HTML에 카드를 넣지 않아
  // 하이드레이션 불일치도, 닫았던 사람에게 번쩍임도 없다. 고정 요소라 CLS도 없다.
  useEffect(() => {
    if (!EVENT || pathname !== "/") return;
    if (statusOf(EVENT) === "closed") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* 사생활 보호 모드 — 그냥 보여준다 */
    }
    // 첫 화면이 자리 잡은 뒤 슬쩍 올라오도록 한 박자 늦게
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* 저장 실패 — 이번 렌더에서만 닫힘 */
    }
  }, []);

  if (!EVENT || pathname !== "/" || !open) return null;

  const onCta = () => {
    trackEvent("event_popup_click");
    close();
  };

  return (
    <div className="evp-card" role="complementary" aria-label="진행 중인 이벤트 안내">
      <button type="button" className="evp-x" aria-label="이벤트 카드 닫기" onClick={close}>
        ×
      </button>
      <Link href={`/event/${EVENT.slug}`} className="evp-card-link" onClick={onCta}>
        <span className="evp-card-media">
          <img src="/event-popup.webp" alt="" width={720} height={405} />
        </span>
        <span className="evp-card-body">
          <strong className="evp-card-title">{EVENT.title}</strong>
          {/* 날짜 기반 라벨 — 모집 전 "10월 8일 모집 시작" → 모집 중 "D-n" */}
          <span className="evp-card-meta" suppressHydrationWarning>
            {ddayLabel(EVENT, "long")} · 참가비 무료
          </span>
          <span className="evp-card-cta">
            자세히 보기 <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
