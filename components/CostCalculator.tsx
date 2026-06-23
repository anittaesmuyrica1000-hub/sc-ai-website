"use client";

import { useState } from "react";
import Link from "next/link";

// 사람인(2022, 499개사): 채용 1인당 평균 비용 1,272만원 = 조기퇴사 시 재채용 비용의 보수적 하한
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
  const [hires, setHires] = useState(20);
  const [rate, setRate] = useState(28.7);

  const badHires = hires * (rate / 100);
  const lossManwon = badHires * COST_PER_HIRE;

  return (
    <section className="calc" id="calc">
      <div className="wrap">
        <div className="head">
          <div className="tagchip"><i className="fa-solid fa-calculator"></i> 채용 손실 계산기</div>
          <h2>우리 회사는 <span className="blue">매년 얼마</span>를 잃고 있을까요?</h2>
          <p className="lead">조기퇴사로 다시 뽑는 비용만 따져도 이만큼입니다.</p>
        </div>

        <div className="calc-box">
          <div className="calc-inputs">
            <label className="calc-field">
              <span className="cf-top"><span>연간 신규 채용 인원</span><strong>{hires}명</strong></span>
              <input
                type="range" min={1} max={100} step={1} value={hires}
                onChange={(e) => setHires(Number(e.target.value))}
                aria-label="연간 신규 채용 인원"
              />
            </label>
            <label className="calc-field">
              <span className="cf-top"><span>1년 내 조기퇴사율</span><strong>{rate.toFixed(1)}%</strong></span>
              <input
                type="range" min={5} max={50} step={0.1} value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                aria-label="1년 내 조기퇴사율"
              />
              <span className="cf-note">국내 평균 약 28.7% (사람인)</span>
            </label>
          </div>

          <div className="calc-result">
            <span className="cr-label">연간 채용 손실 추정액</span>
            <span className="cr-num">{formatManwon(lossManwon)}</span>
            <span className="cr-sub">연 {badHires.toFixed(1)}명 재채용 × 1인당 1,272만원</span>
          </div>
        </div>

        <p className="calc-src">
          계산식: 연간 채용 인원 × 조기퇴사율 × 재채용 비용(1인당 1,272만원). 출처: 사람인(채용 1인당 비용 1,272만원·499개사·2022 / 신입 1년 내 조기퇴사율 평균 28.7%·1,124개사·2022). 직무·기업별로 달라질 수 있는 보수적 추정치입니다.
        </p>

        <div className="calc-cta">
          <Link href="/apply" className="btn btn-blue">우리 회사 채용 검증 상담받기 <i className="fa-solid fa-arrow-right"></i></Link>
        </div>
      </div>
    </section>
  );
}
