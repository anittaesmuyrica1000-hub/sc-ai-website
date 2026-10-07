"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EVENTS, statusOf, ddayLabel } from "@/lib/events";
import { trackEvent } from "@/lib/track";

/**
 * 사이트 상단 이벤트 공지 배너.
 * GNB의 '이벤트' 메뉴만으로는 처음 온 방문자가 진행 중인 행사를 알아차리지 못해서,
 * 헤더 위 한 줄 스트립으로 행사 페이지 진입로를 만든다(2026-10-07).
 *
 * - 행사 데이터·모집 상태는 lib/events.ts 하나만 본다. 마감(closed)되면 스스로 사라지므로
 *   행사가 끝난 뒤 배너 내리는 배포를 따로 할 필요가 없다.
 * - 헤더가 아니라 문서 흐름에 놓인다 — 스크롤하면 배너는 올라가고 GNB만 남는다.
 *   섹션 인지형 GNB의 색 판정선 보정은 SiteHeader.syncHeader가 .evb 높이를 읽어서 한다.
 */
const EVENT = EVENTS[0];

/** 닫은 방문자에게 다시 보이지 않기 위한 키 — 행사가 바뀌면 키도 바뀌어 새 행사는 다시 보인다 */
const DISMISS_KEY = `evb-dismissed:${EVENT?.slug}`;

/**
 * 배너를 그리지 않는 경로.
 * /event* — 이미 행사 안이라 유도가 무의미(가상기업 채용 화면 포함).
 * /admin — 공개 GNB도 없는 관리 화면.
 * /apply·/brochure — B2B 리드 폼. 작성 중인 사람을 B2C 행사로 빼돌리지 않는다.
 */
const HIDDEN_PREFIXES = ["/event", "/admin", "/apply", "/brochure"];

export default function EventBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // localStorage는 마운트 후에만 읽는다(SSR엔 없음). 닫았던 방문자는 한 프레임 보일 수 있지만,
  // 처음부터 숨겨 두면 모든 방문자에게 배너가 늦게 튀어나와 레이아웃이 밀린다(CLS) — 반대가 낫다.
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      /* 사생활 보호 모드 등 — 그냥 보여준다 */
    }
  }, []);

  if (!EVENT || dismissed) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;
  // 모집 마감 후에는 알릴 것이 없다(결과 발표는 참가자에게 개별 안내)
  if (statusOf(EVENT) === "closed") return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* 저장 실패 시 이번 방문 동안만 닫힘 */
    }
  };

  return (
    <div className="evb" role="region" aria-label="진행 중인 이벤트 안내">
      <Link
        href={`/event/${EVENT.slug}`}
        className="evb-link"
        onClick={() => trackEvent("event_banner_click", { location: pathname || "/" })}
      >
        <span className="wrap evb-in">
          <span className="evb-chip">EVENT</span>
          <strong className="evb-title">{EVENT.title}</strong>
          <span className="evb-sub">참가비 무료 · 전공·학년 제한 없음</span>
          {/* 날짜 기반 라벨 — 프리렌더 시점과 접속 시점이 날짜 경계를 걸치면 서로 다를 수 있다 */}
          <span className="evb-cta" suppressHydrationWarning>
            {ddayLabel(EVENT, "long")}
            <span className="evb-cta-more"> · 자세히 보기</span> <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
      <button type="button" className="evb-x" aria-label="이벤트 배너 닫기" onClick={close}>
        ×
      </button>
    </div>
  );
}
