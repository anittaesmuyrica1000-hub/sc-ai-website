"use client";

import { useState } from "react";
import Link from "next/link";

// 사람인 2022: 신입 1년 내 조기퇴사율 평균 28.7% (1,124개사) — 고정 전제
const TURNOVER_RATE = 0.287;
// 사람인 2022: 채용 1인당 비용 1,272만원 (499개사) = 조기퇴사 시 재채용 비용의 보수적 하한
const COST_PER_HIRE = 1272; // 만원

function formatManwon(manwon: number): string {
  const m = Math.round(manwon);
  if (m >= 10000) {
    const eok = Math.floor(m / 10000);
    const rem = m % 10000;
    return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${m.toLocaleString()}만원`;
}

export default function CostCalculator() {
  const [hires, setHires] = useState(50);

  const badHires = hires * TURNOVER_RATE;
  const lossManwon = badHires * COST_PER_HIRE;

  return (
    <section className="calc" id="calc">
      <div className="wrap">
        <div className="head">
          <div className="tagchip"><i className="fa-solid fa-coins"></i> 채용 손실 계산기</div>
          <h2>우리 회사는 매년 <span className="blue">얼마</span>를 잃고 있을까요?</h2>
          <p className="lead">조기퇴사로 다시 뽑는 비용만 따져도 이만큼입니다.</p>
          <p className="calc-premise"><i className="fa-solid fa-circle-info"></i> <span>전제 · 1년 내 조기퇴사율 <strong>28.7%</strong> 고정 · 재채용 1인당 <strong>1,272만원</strong> (사람인, 2022) · 직무·기업별로 달라질 수 있는 보수적 추정치입니다.</span></p>
        </div>

        <div className="calc-box">
          <div className="calc-inputs">
            <label className="calc-field">
              <span className="cf-top"><span>연간 신규 채용 인원</span><strong>{hires.toLocaleString()}명</strong></span>
              <input
                type="range" min={10} max={1000} step={10} value={hires}
                onChange={(e) => setHires(Number(e.target.value))}
                aria-label="연간 신규 채용 인원"
              />
              <span className="cf-note">슬라이더로 우리 회사 채용 규모를 맞춰보세요</span>
            </label>
          </div>

          <div className="calc-result">
            <span className="cr-label">매년 새어나가는 채용 손실</span>
            <span className="cr-num">{formatManwon(lossManwon)}</span>
            <span className="cr-sub">신규 {hires.toLocaleString()}명 중 약 {Math.round(badHires).toLocaleString()}명이 1년 내 이탈 → 재채용 비용</span>
          </div>
        </div>

        <div className="calc-cta">
          <Link href="/apply" className="btn btn-blue">우리 회사 채용 검증 상담받기 <i className="fa-solid fa-arrow-right"></i></Link>
        </div>
      </div>
    </section>
  );
}
