import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import HeroParticles from "@/components/HeroParticles";
import { getFaqs } from "@/lib/faq";
import { renderBody } from "@/lib/postRender";
import { buildPageMetadata } from "@/lib/pageSeo";

// 홈 canonical (중복 색인 방지) — 공통 메타는 layout.tsx. 어드민 SEO 초안(적용 시) 덮어씀.
const FALLBACK_METADATA: Metadata = { alternates: { canonical: "/" } };
export function generateMetadata() {
  return buildPageMetadata("/", FALLBACK_METADATA);
}

// JSON-LD·검색용 태그 제거 텍스트
const plain = (s: string) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// FAQ가 어드민(DB)에서 바뀌면 일정 주기로 자동 반영(ISR). 그 외엔 정적으로 빠르게 서빙.
export const revalidate = 120;

const LOGOS = [
  { src: "/logos/woongjin.webp", alt: "Woongjin" },
  { src: "/logos/skonec.webp", alt: "SKONEC entertainment" },
  { src: "/logos/markany.webp", alt: "MarkAny" },
];

export default async function HomePage() {
  const faqs = await getFaqs();
  const JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "AI면접",
        url: "https://www.supercoder.co/",
        logo: "https://www.supercoder.co/apple-touch-icon.png",
        description:
          "AI 면접으로 지원자를 자동 검증하고 채용팀에 검증된 핵심 인재 리포트를 전달하는 B2B 채용 SaaS",
        sameAs: [],
      },
      { "@type": "WebSite", name: "AI면접", url: "https://www.supercoder.co/", inLanguage: "ko-KR" },
      // SoftwareApplication 스키마 제거(2026-08-07 SEO 진단): Google 리치 결과가
      // aggregateRating/review를 요구하나 실데이터 없이 넣는 건 가이드라인 위반.
      // 고객 평점 데이터 확보 시 aggregateRating과 함께 복원.
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          
          acceptedAnswer: { "@type": "Answer", text: plain(f.answer) },
        })),
      },
    ],
  };
  return (
    <>
      {/* 히어로 + 도입사 로고를 하나의 배경(그라데이션·지구본·그레인)으로 연결하는 래퍼 */}
      <div className="hero-bg" data-nav="dark">
        <HeroParticles canvasId="hero-particles" targetId="real-word" />
        {/* SECTION 01 · DECLARATION (히어로) */}
        <section className="decl" id="hero">

          <div className="wrap">
            <div>
              <div className="tagchip"><i className="fa-solid fa-bolt"></i> AI 면접 채용 검증</div>
              <h1>
                <span className="sky">지원자 검증은 </span><span className="hl" id="real-word">AI</span><span className="sky">가,</span><br />
                <span className="sky">채용 결정은 </span><span className="hl">사람</span><span className="sky">이 더 빠르게</span>
              </h1>
              <p>
                <span style={{ color: "#fff" }}>AI 면접·리포트</span>로 1차 검토를 줄이고,<br />
                <span style={{ color: "#fff" }}>핵심 후보 판단</span>에 집중하세요.
              </p>
              <div className="decl-cta">
                <Link href="/apply" className="btn btn-blue">무료 상담 신청 <i className="fa-solid fa-arrow-right"></i></Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 02 · CLIENTS (도입사 로고 마퀴) */}
      <div className="herostrip" id="clients">
        <p className="hs-label">지원자 검증에 Supercoder를 활용하고 있습니다</p>
        <div className="marquee">
          <div className="marquee-track">
            {Array.from({ length: 6 }).map((_, block) =>
              // 반복 블록 로고에도 alt를 채운다(SEO 진단 alt 누락 대응) — 중복 낭독은 aria-hidden으로 차단
              LOGOS.map((l, i) => (
                <img
                  key={`${block}-${i}`}
                  src={l.src}
                  alt={l.alt}
                  aria-hidden={block === 0 ? undefined : true}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 04 · FLOOD */}
      <section className="flood" id="flood">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-triangle-exclamation"></i> 채용의 현실</div>
            <h2>AI로 쓴 이력서는 좋아졌는데,<br />지원자의 <span className="blue">실력</span>도 좋아졌을까요?</h2>
            <p className="lead">진짜를 못 거르는 1차 검토는<br />결국 채용 비용과 미스매치로 이어집니다.</p>
          </div>
          <ul className="flood-stats">
            <li>
              <div className="stat"><span className="lbl">지원자 거짓·과장 적발 경험</span><span className="num">84%</span></div>
              <p className="src">출처: 사람인, 기업 927개사</p>
            </li>
            <li>
              <div className="stat"><span className="lbl">기준 미달도 통과시킨 경험</span><span className="num">59%</span></div>
              <p className="src">출처: 잡코리아, 인사담당자 794명</p>
            </li>
            <li>
              <div className="stat"><span className="lbl">잘못 뽑아 후회한 경험</span><span className="num">81%</span></div>
              <p className="src">출처: 사람인, 인사담당자 377명</p>
            </li>
            <li>
              <div className="stat"><span className="lbl">채용 1명당 평균 비용</span><span className="num">1,272<span>만원</span></span></div>
              <p className="src">출처: 사람인, 기업 499개사</p>
            </li>
          </ul>
        </div>
      </section>

      {/* SECTION 03 · VALUE */}
      <section className="value" id="value">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-circle-check"></i> 솔루션</div>
            <h2>그래서, 사람을 만나기 전에<br /><span className="blue">AI 면접이 먼저 검증</span>합니다</h2>
            <p className="lead">더 빠르게, 더 효율적으로, 더 일관되게.</p>
          </div>
          <div className="value-grid">
            <div className="valcard">
              <div className="ic"><i className="fa-solid fa-stopwatch"></i></div>
              <h3>빠른 속도</h3>
              <p>수천 명의 지원자를 AI가 동시에 검토해<br />1차 검토 시간을 크게 줄입니다.</p>
              <span className="metric">1차 검토 시간 ↓</span>
            </div>
            <div className="valcard">
              <div className="ic"><i className="fa-solid fa-coins"></i></div>
              <h3>비용 절감</h3>
              <p>초기 검증을 자동화해<br />채용 미스매치 비용을 줄입니다.</p>
              <span className="metric">채용 미스매치 ↓</span>
            </div>
            <div className="valcard">
              <div className="ic"><i className="fa-solid fa-crosshairs"></i></div>
              <h3>역량 검증</h3>
              <p>이력서에 적힌 내용과 실제 응답을 대조해,<br />핵심 역량을 데이터로 확인합니다.</p>
              <span className="metric">핵심 역량 판단 기준 제공</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05 · ROLE REVERSAL (깔때기) */}
      <section className="role-funnel" id="role">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-circle-check"></i> 역할 분담</div>
            <h2>지원자 선별은 <span className="blue">AI</span>가,<br />최종 판단은 <span className="blue">사람</span>이</h2>
            <p className="lead">AI가 전체 지원자를 먼저 선별하고, 채용팀은 최종 의사결정에 집중합니다.</p>
          </div>
          <div className="funnel3">
            <div className="fn-wrap">
              <svg className="fn-svg" viewBox="0 48 1140 636" role="img" aria-label="지원자 전체를 AI가 자동 검증·필터링해 핵심 인재 리포트로 좁히고, 최종 판단만 채용팀이 내리는 깔때기">
                <defs>
                  <linearGradient id="fnGrad" gradientUnits="userSpaceOnUse" x1="540" y1="62" x2="610" y2="496">
                    <stop offset="0" stopColor="#4577FF" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#3A6FFF" />
                  </linearGradient>
                </defs>
                <g className="fn-guides">
                  <path d="M925 135 H990 Q1000 135 1000 145 V425 Q1000 435 990 435 H730" fill="none" stroke="#5B8DF7" strokeWidth="1.5" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M950 580 H650" fill="none" stroke="#2144a5" strokeWidth="1.5" strokeDasharray="6 6" strokeLinecap="round" />
                </g>
                <path className="seg" d="M215.2 71.7 Q210 62 221 62 L919 62 Q930 62 924.8 71.7 L857.2 198.3 Q852 208 841 208 L299 208 Q288 208 282.8 198.3 Z" fill="url(#fnGrad)" />
                <path className="seg" d="M311.3 233.7 Q306 224 317 224 L823 224 Q834 224 828.7 233.7 L767.3 346.3 Q762 356 751 356 L389 356 Q378 356 372.7 346.3 Z" fill="url(#fnGrad)" />
                <path className="seg" d="M401.2 383.7 Q396 374 407 374 L733 374 Q744 374 738.8 383.7 L683.2 486.3 Q678 496 667 496 L473 496 Q462 496 456.8 486.3 Z" fill="url(#fnGrad)" />
                <path className="tip" d="M483.6 523.4 Q478 514 489 514 L651 514 Q662 514 656.4 523.4 L575.6 658.6 Q570 668 564.4 658.6 Z" fill="#2144a5" />
                <text className="fl" x="570" y="135">지원자 전체 - AI 자동 검증</text>
                <text className="fl" x="570" y="290">핵심 역량 기준으로 지원자 선별</text>
                <text className="fl" x="570" y="435">핵심 인재 리포트</text>
                <text className="fl ft" x="570" y="552">최종</text>
                <text className="fl ft" x="570" y="586">판단</text>
              </svg>
              <span className="fn-tag tag-ai"><i className="fa-solid fa-robot"></i> AI</span>
              <span className="fn-tag tag-team"><i className="fa-solid fa-user"></i> 채용팀</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06 · HOW IT WORKS */}
      <section className="how" id="how">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-file-lines"></i> AI 리포트</div>
            <h2>핵심 후보 판단에 필요한 내용을<br /><span className="blue">리포트 한 장</span>에 담았습니다</h2>
            <p className="lead">요약, 등급, 역량, 면접 포인트까지 한눈에 확인하세요.</p>
          </div>

          <div className="how-rows">
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 01</span>
                <h3>인터뷰 요약</h3>
                <p>긴 영상을 다시 볼 필요 없이, 대화의 핵심만 자동 <strong>요약</strong>합니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-interview.webp" alt="인터뷰 요약 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 02</span>
                <h3>종합평가</h3>
                <p>복잡한 점수 대신 <strong>등급</strong>으로, 후보자 판단 기준을 빠르게 확인합니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-grade.webp" alt="종합 등급 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 03</span>
                <h3>역량평가</h3>
                <p><strong>핵심 역량</strong>의 강점과 약점을 차트로 한눈에 비교합니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-competency.webp" alt="역량 평가 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 04</span>
                <h3>강점·약점 분석</h3>
                <p><strong>강점과 약점</strong>을 구분해, 대면 면접에서 확인할 포인트까지 짚어줍니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-strength.webp" alt="강점·약점 분석 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
          </div>

          <div className="head" style={{ paddingTop: "clamp(112px,15vw,190px)" }}>
            <div className="tagchip"><i className="fa-solid fa-diagram-project"></i> 진행 절차</div>
            <h2>채용공고만 등록하면, 검증 리포트까지<br /><span className="blue">AI가 진행</span>합니다</h2>
          </div>

          {/* 프로세스(시안2) — 라이트블루 패널 + 3단계 카드. 펄스/페이드업 루프 모션(CSS). */}
          <div className="flow2">
            <div className="pstep">
              <div className="pic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg></div>
              <span className="pstep-tag">STEP 01</span>
              <h3>채용공고 등록</h3>
              <p>공고를 등록하면<br />AI가 직무·요구 역량을 분석합니다.</p>
            </div>
            <div className="pstep">
              <div className="pic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" /></svg></div>
              <span className="pstep-tag">STEP 02</span>
              <h3>AI 면접 자동 생성·진행</h3>
              <p>AI가 평가 기준·질문을 만들고,<br />지원자가 온라인으로 응시합니다.</p>
            </div>
            <div className="pstep">
              <div className="pic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg></div>
              <span className="pstep-tag">STEP 03</span>
              <h3>검증 리포트 수신</h3>
              <p>AI가 응답을 분석·채점해<br />한 장의 리포트로 정리합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07 · PROOF */}
      <section className="proof2" id="proof">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-chart-simple"></i> 검증된 효과</div>
            <h2 className="proof-h2">만 명이 몰려도, 검증된 핵심인재만 <span className="blue">남깁니다</span></h2>
            <p className="lead">인력은 못 늘리고, 뽑은 사람은 쉽게 나가지 않습니다. 1명을 뽑아도 확실한 핵심인재여야 합니다.</p>
          </div>
          <div className="proof-row">
            <div className="pc2"><div className="vlabel">역량 검증</div><div className="big big-phrase">서류 너머 핵심역량</div><p>지원서 <strong>48.5%</strong>가 AI 작성 의심, 인사담당 <strong>73%</strong>는 진짜를 못 가려냅니다. AI 면접은 핵심역량 기준으로 실제 실력을 검증합니다.</p><p className="psrc">출처: 고용노동부</p></div>
            <div className="pc2"><div className="vlabel">속도</div><div className="big big-phrase">만 명도 즉시 스크리닝</div><p>사람이 한 명당 10분씩 만 명을 보면 약 <strong>208일</strong>. AI는 동시에 진행해 <strong>당일</strong> 끝나, 검토가 밀려 좋은 후보를 놓치는 일이 없습니다.</p><p className="psrc">출처: 서류 10분 사람인·잡코리아 (208일=추산)</p></div>
            <div className="pc2"><div className="vlabel">비용 절감</div><div className="big big-phrase">면접관 시간 절약</div><p>핵심역량 미달자를 1차에서 걸러, 현업 면접관은 <strong>검증된 소수</strong>만 만납니다. 가장 비싼 자원인 면접관의 시간을 아낍니다.</p><p className="psrc">현업 면접관 시간 = 가장 비싼 채용 자원</p></div>
          </div>
        </div>
      </section>

      {/* SECTION 08 · VOICES */}
      <section className="voices" id="voices">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-comment-dots"></i> 활용 사례</div>
            <h2>채용팀은 이렇게 활용하고 있습니다</h2>
            <p className="lead">반복 검토는 줄이고, <span className="blue" style={{ fontWeight: 700 }}>핵심 후보 판단</span>에 더 많은 시간을 쓰고 있습니다.</p>
          </div>
          <div className="v-grid">
            <div className="vc">
              <div className="bubble">
                <div className="qm"><i className="fa-solid fa-quote-left"></i></div>
                <blockquote>“AI 면접으로 1차 면접을 대체해, 개발자들이 본업에 집중하면서도 좋은 인재를 놓치지 않게 됐어요.”</blockquote>
              </div>
              <div className="who"><div className="ava">A</div><div><div className="nm">테크기업 채용 총괄</div><div className="ro">개발 직군 채용 담당</div></div></div>
            </div>
            <div className="vc">
              <div className="bubble">
                <div className="qm"><i className="fa-solid fa-quote-left"></i></div>
                <blockquote>“표준화된 질문으로 직무 적합성과 의지를 객관적으로 파악할 수 있었습니다.”</blockquote>
              </div>
              <div className="who"><div className="ava">B</div><div><div className="nm">국내 금융 플랫폼 채용담당자</div><div className="ro">대규모 채용 운영 담당</div></div></div>
            </div>
            <div className="vc">
              <div className="bubble">
                <div className="qm"><i className="fa-solid fa-quote-left"></i></div>
                <blockquote>“AI 면접 리포트 덕분에 후보자의 강점과 우려점을 빠르게 파악할 수 있었습니다.”</blockquote>
              </div>
              <div className="who"><div className="ava">C</div><div><div className="nm">국내 모빌리티 IT 기업 채용담당자</div><div className="ro">기술 직군 채용 담당</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 08.5 · FAQ */}
      <section className="faq" id="faq">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow">FAQ</span>
            <h2>자주 묻는 질문</h2>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <details className="faq-item" key={i} {...(i === 0 ? { open: true } : {})}>
                <summary>{f.question} <i className="fa-solid fa-plus fq-ic"></i></summary>
                {/* 답변에 박힌 강제 줄바꿈(<br>)은 제거 — 화면폭에 맞춰 자연스럽게 흐르도록(문단 <p>은 유지) */}
                <div className="fa-ans" dangerouslySetInnerHTML={{ __html: renderBody(f.answer).replace(/<br\s*\/?>\s*/gi, " ") }} />
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 09 · FINAL CTA */}
      <section className="final" id="final" data-nav="dark">
        <HeroParticles canvasId="final-particles" targetId="real-cta" />
        <div className="wrap">
          <h2>다음 채용은,<br /><span className="real-cta" id="real-cta">AI 면접</span>으로 더 빠르게 시작하세요.</h2>
          <p>간단한 문의를 남겨주시면, 담당자가 도입 방안을 안내해드립니다.</p>
          <Link href="/apply" className="btn btn-blue">무료 상담 신청 <i className="fa-solid fa-arrow-right"></i></Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </>
  );
}
