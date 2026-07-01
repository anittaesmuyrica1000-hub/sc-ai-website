"use client";

import { useState } from "react";

// 소개서 미리보기 캐러셀 — 에이치닷 '소개서 받기'처럼 좌측에 표지·주요 페이지를 넘겨보게.
// 이미지는 서비스덱에서 뽑은 public/brochure-preview/*.jpg.
const SLIDES = [
  { src: "/brochure-preview/01-cover.jpg", alt: "AI 면접 서비스 소개서 표지" },
  { src: "/brochure-preview/02-message.jpg", alt: "채용의 감을 데이터로 — 핵심 메시지" },
  { src: "/brochure-preview/03-steps.jpg", alt: "AI 기반 구조화 채용 4단계" },
  { src: "/brochure-preview/04-report.jpg", alt: "AI 면접 분석 리포트 예시" },
  { src: "/brochure-preview/05-roi.jpg", alt: "측정 가능한 ROI — 채용 기간·비용·합격률" },
  { src: "/brochure-preview/06-usecase.jpg", alt: "실제 도입 사례" },
];

export default function BrochurePreview() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);

  return (
    <div className="bpreview">
      <div className="bpreview-stage">
        <button type="button" className="bpreview-arrow prev" onClick={() => go(-1)} aria-label="이전 페이지">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        {SLIDES.map((s, d) => (
          <img key={s.src} src={s.src} alt={d === i ? s.alt : ""} className={`bpreview-img${d === i ? " on" : ""}`} loading={d === 0 ? "eager" : "lazy"} aria-hidden={d === i ? undefined : true} />
        ))}
        <button type="button" className="bpreview-arrow next" onClick={() => go(1)} aria-label="다음 페이지">
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div className="bpreview-dots" role="tablist" aria-label="소개서 페이지">
        {SLIDES.map((_, d) => (
          <button key={d} type="button" className={`bpreview-dot${d === i ? " on" : ""}`} onClick={() => setI(d)} aria-label={`${d + 1}페이지 보기`} aria-selected={d === i} role="tab" />
        ))}
      </div>
    </div>
  );
}
