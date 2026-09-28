import type { Metadata } from "next";
// 목록 레이아웃(히어로·필터·카드 그리드)은 블로그 목록을 그대로 쓴다.
// 스타일을 복사하지 않고 원본을 import — blog.css를 고치면 두 목록이 함께 바뀐다.
import "../blog/blog.css";
import "./event.css";
import EventClient from "./EventClient";
import { EVENTS, statusOf, ddayLabel } from "@/lib/events";
import { buildPageMetadata } from "@/lib/pageSeo";

// 모집 상태(모집 예정 → 모집 중 → 모집 마감)가 날짜에 따라 바뀌므로 요청 시 계산한다
export const dynamic = "force-dynamic";

const FALLBACK_METADATA: Metadata = {
  title: "이벤트 · AI 면접을 직접 해보는 자리",
  description:
    "슈퍼코더가 여는 AI 면접 이벤트를 모았습니다. 취업 전에 AI 면접을 실전처럼 겪어 볼 수 있습니다.",
  alternates: { canonical: "/event" },
  openGraph: {
    title: "이벤트 · AI면접 | AI 면접을 직접 해보는 자리",
    description: "슈퍼코더가 여는 AI 면접 이벤트를 모았습니다.",
    url: "/event",
    images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
  },
};
export function generateMetadata() {
  return buildPageMetadata("/event", FALLBACK_METADATA);
}

export default function EventIndexPage() {
  // D-day는 서버에서 계산해 넘긴다 — 클라이언트에서 new Date()를 쓰면 서버 렌더 결과와
  // 값이 달라져 하이드레이션 불일치가 난다.
  const rows = EVENTS.map((e) => ({ ...e, status: statusOf(e), dday: ddayLabel(e) }));
  // 모집 중 → 모집 예정 → 모집 마감 순
  const order = { open: 0, upcoming: 1, closed: 2 } as const;
  rows.sort((a, b) => order[a.status] - order[b.status] || b.applyStart.localeCompare(a.applyStart));

  const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "슈퍼코더 이벤트",
    itemListElement: rows.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.supercoder.co/event/${e.slug}`,
      name: e.title,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <EventClient events={rows} />
    </>
  );
}
