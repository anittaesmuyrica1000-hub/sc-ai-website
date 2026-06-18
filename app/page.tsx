import Link from "next/link";
import "./landing.css";
import HeroParticles from "@/components/HeroParticles";

const LOGOS = [
  { src: "/logos/kakaopay.png", alt: "kakaopay" },
  { src: "/logos/hyundai-autoever.png", alt: "HYUNDAI AutoEver" },
  { src: "/logos/woongjin.png", alt: "Woongjin" },
  { src: "/logos/skonec.png", alt: "SKONEC entertainment" },
  { src: "/logos/markany.png", alt: "MarkAny" },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "AI면접",
      url: "https://sc-ai-website.vercel.app/",
      logo: "https://sc-ai-website.vercel.app/apple-touch-icon.png",
      description:
        "AI 면접으로 지원자를 자동 검증하고 채용팀에 검증된 핵심 인재 리포트를 전달하는 B2B 채용 SaaS",
      sameAs: [],
    },
    { "@type": "WebSite", name: "AI면접", url: "https://sc-ai-website.vercel.app/", inLanguage: "ko-KR" },
    {
      "@type": "SoftwareApplication",
      name: "AI면접",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "AI 면접 기반 채용 검증 솔루션. 지원자를 자동 검증하고 핵심 인재 리포트를 제공합니다.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW", description: "무료 도입 신청" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "AI 면접은 어떻게 진행되나요?", acceptedAnswer: { "@type": "Answer", text: "지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AI면접이 응답을 분석·검증해 역량 평가와 핵심 요약이 담긴 리포트를 생성하고, 채용팀에는 검증을 통과한 상위 후보의 리포트만 전달됩니다." } },
        { "@type": "Question", name: "기존 ATS·채용 툴과 연동되나요?", acceptedAnswer: { "@type": "Answer", text: "리포트는 표준 형식으로 제공되어 기존 채용 프로세스에 바로 활용할 수 있습니다. 상세 연동 방식은 도입 상담에서 안내해 드립니다." } },
        { "@type": "Question", name: "도입까지 얼마나 걸리나요?", acceptedAnswer: { "@type": "Answer", text: "설치나 계약 없이 무료 신청 후 바로 시작할 수 있습니다. 신청하시면 영업일 기준 1일 내 담당자가 데모와 함께 안내드립니다." } },
        { "@type": "Question", name: "지원자 데이터는 안전하게 관리되나요?", acceptedAnswer: { "@type": "Answer", text: "모든 데이터는 전송 구간 암호화(HTTPS)와 접근 통제 정책 아래 관리됩니다. 수집 항목과 처리 방식은 개인정보처리방침에서 확인하실 수 있습니다." } },
        { "@type": "Question", name: "비용은 어떻게 책정되나요?", acceptedAnswer: { "@type": "Answer", text: "채용 규모와 활용 방식에 맞춰 책정됩니다. 우선 무료로 도입 효과를 확인해 보신 뒤, 상담을 통해 안내해 드립니다." } },
      ],
    },
  ],
};

export default function HomePage() {
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
                <span className="hl">수천 명</span><span className="sky">의 지원자,</span><br /><span className="sky">채용팀은 </span>
                <span className="hl" id="real-word">상위 후보</span><span className="sky">만 보면 됩니다.</span>
              </h1>
              <p>
                <span style={{ fontWeight: 700, color: "#fff" }}>AI 면접이</span> 전 지원자를 검증하고,<br />
                검증된 <span style={{ fontWeight: 700, color: "#fff" }}>핵심 인재 리포트만 채용팀에 전달합니다.</span>
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
        <p className="hs-label">이미 500개 이상의 채용팀이 검증을 맡겼습니다</p>
        <div className="marquee">
          <div className="marquee-track">
            {Array.from({ length: 6 }).map((_, block) =>
              LOGOS.map((l, i) => (
                <img
                  key={`${block}-${i}`}
                  src={l.src}
                  alt={block === 0 ? l.alt : ""}
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
              <div className="stat"><span className="lbl">지원자 거짓·과장 적발 경험</span><span className="num">83.8%</span></div>
              <p className="src">출처: 사람인, 기업 927개사</p>
            </li>
            <li>
              <div className="stat"><span className="lbl">기준 미달도 통과시킨 경험</span><span className="num">58.9%</span></div>
              <p className="src">출처: 잡코리아, 인사담당자 794명</p>
            </li>
            <li>
              <div className="stat"><span className="lbl">잘못 뽑아 후회한 경험</span><span className="num">80.2%</span></div>
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
            <p className="lead">더 빠르게, 더 싸게, 더 정확하게 — 한 번에.</p>
          </div>
          <div className="value-grid">
            <div className="valcard">
              <div className="ic"><i className="fa-solid fa-stopwatch"></i></div>
              <h3>빠른 속도</h3>
              <p>수천 명의 지원자를 AI가 동시에 검증.<br />1차 서류 검토 시간이 사라집니다.</p>
              <span className="metric">1차 검토 시간 ↓</span>
            </div>
            <div className="valcard">
              <div className="ic"><i className="fa-solid fa-coins"></i></div>
              <h3>비용 절감</h3>
              <p>잘못된 채용 한 건은 연봉의 30%.<br />검증 자동화로 실패 비용을 줄입니다.</p>
              <span className="metric">채용 미스매치 ↓</span>
            </div>
            <div className="valcard">
              <div className="ic"><i className="fa-solid fa-crosshairs"></i></div>
              <h3>정확성</h3>
              <p>이력서 주장과 실제 역량을 대조해,<br />핵심 역량을 데이터로 검증합니다.</p>
              <span className="metric">핵심 역량 검증 정확도 ↑</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05 · ROLE REVERSAL (깔때기) */}
      <section className="role-funnel" id="role">
        <div className="wrap">
          <div className="head">
            <div className="tagchip"><i className="fa-solid fa-circle-check"></i> 역할 분담</div>
            <h2>수천 명은 <span className="blue">AI</span>가 좁히고,<br />단 하나의 <span className="blue">결정</span>만 사람이</h2>
            <p className="lead">AI가 수천 명을 좁히고, 사람은 단 하나만 결정합니다.</p>
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
            <h2>이 <span className="blue">리포트 한 장</span>이면 충분합니다</h2>
            <p className="lead">검증은 AI가 끝냅니다. 결과만 확인하세요.</p>
          </div>

          <div className="how-rows">
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 01</span>
                <h3>인터뷰 요약</h3>
                <p>긴 영상을 다시 볼 필요 없이, 대화의 핵심만 자동 요약합니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-interview.png" alt="인터뷰 요약 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 02</span>
                <h3>종합평가</h3>
                <p>복잡한 점수 대신 <strong>등급</strong>으로, 합격·보류·탈락을 빠르게 가릅니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-grade.png" alt="종합 등급 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 03</span>
                <h3>역량평가</h3>
                <p><strong>핵심 역량</strong>의 강점과 약점을 차트로 한눈에 비교합니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-competency.png" alt="역량 평가 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
            <div className="how-row">
              <div className="hr-info">
                <span className="hr-eyebrow">리포트 04</span>
                <h3>강점·약점 분석</h3>
                <p>강점과 약점을 구분해, 대면 면접에서 확인할 포인트까지 짚어줍니다.</p>
              </div>
              <div className="hr-media"><img className="hr-img" src="/diagram-strength.png" alt="강점·약점 분석 도식" width={1080} height={570} loading="lazy" /></div>
            </div>
          </div>

          <div className="head" style={{ marginBottom: 6, paddingTop: "clamp(56px,7vw,104px)" }}>
            <p className="lead" style={{ marginTop: 0, fontWeight: 600 }}>응시부터 리포트까지, 사람 손 없이 단 3단계.</p>
          </div>

          <div className="flow">
            <div className="node">
              <div className="step">STEP 01</div>
              <div className="ic"><i className="fa-solid fa-paper-plane"></i></div>
              <h3>후보자 AI 면접 응시</h3>
              <p>언제 어디서나, 시공간 제약 없이<br />온라인 응시 · 설치 없이 이력서 제출.</p>
            </div>
            <div className="arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
            <div className="node">
              <div className="step">STEP 02</div>
              <div className="ic"><i className="fa-solid fa-magnifying-glass-chart"></i></div>
              <h3>AI 분석·검증</h3>
              <p>이력서의 주장과 실제 역량을<br />대조해 자동으로 검증·채점.</p>
            </div>
            <div className="arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
            <div className="node">
              <div className="step">STEP 03</div>
              <div className="ic"><i className="fa-solid fa-file-lines"></i></div>
              <h3>리포트 수신</h3>
              <p>검증된 핵심 인재 리포트만<br />채용팀이 받아 판단합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07 · PROOF */}
      <section className="proof2" id="proof">
        <div className="wrap">
          <div className="head">
            <h2>AI 면접 하나로,<br />1차 검토가 <span className="blue">이렇게 바뀝니다</span></h2>
            <p className="lead">도입 효과를 숫자로 보여드립니다.</p>
          </div>
          <div className="proof-row">
            <div className="pc2"><div className="vlabel"><i className="fa-solid fa-bolt"></i> 속도</div><div className="big">동시</div><p>수천 명을 한 번에 1차 검증<br />(응시 → AI 면접 → 리포트)</p></div>
            <div className="pc2"><div className="vlabel"><i className="fa-solid fa-piggy-bank"></i> 비용 절감</div><div className="big">1,272<span style={{ fontSize: ".5em" }}>만원</span></div><p>잘못된 채용 1건 · 그대로 손실</p><p className="psrc">출처: 사람인, 기업 499개사</p></div>
            <div className="pc2"><div className="vlabel"><i className="fa-solid fa-circle-check"></i> 일관성</div><div className="big">100<span style={{ fontSize: ".5em" }}>%</span></div><p>모든 지원자를 동일 기준으로<br />일관되게 검증</p></div>
          </div>
        </div>
      </section>

      {/* SECTION 08 · VOICES */}
      <section className="voices" id="voices">
        <div className="wrap">
          <div className="head">
            <h2>먼저 써본 채용팀의 이야기</h2>
            <p className="lead">실제 도입 고객사가 전한 <span className="blue" style={{ fontWeight: 700 }}>AI 면접 채용</span> 경험입니다.</p>
          </div>
          <div className="v-grid">
            <div className="vc">
              <div className="bubble">
                <div className="qm"><i className="fa-solid fa-quote-left"></i></div>
                <blockquote>“AI 면접으로 1차 면접을 대체해, 개발자들이 본업에 집중하면서도 좋은 인재를 놓치지 않게 됐어요.”</blockquote>
              </div>
              <div className="who"><div className="ava">A</div><div><div className="nm">A사</div><div className="ro">Supercoder 도입 고객</div></div></div>
            </div>
            <div className="vc">
              <div className="bubble">
                <div className="qm"><i className="fa-solid fa-quote-left"></i></div>
                <blockquote>“표준화된 질문으로 직무 적합성과 의지를 객관적으로 파악할 수 있었습니다.”</blockquote>
              </div>
              <div className="who"><div className="ava">B</div><div><div className="nm">B사</div><div className="ro">Supercoder 도입 고객</div></div></div>
            </div>
            <div className="vc">
              <div className="bubble">
                <div className="qm"><i className="fa-solid fa-quote-left"></i></div>
                <blockquote>“개발자 채용부터 과정 전반의 컨설팅까지, 성장하는 팀에 큰 도움이 됐습니다.”</blockquote>
              </div>
              <div className="who"><div className="ava">C</div><div><div className="nm">C사</div><div className="ro">Supercoder 도입 고객</div></div></div>
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
            <details className="faq-item" open>
              <summary>AI 면접은 어떻게 진행되나요? <i className="fa-solid fa-plus fq-ic"></i></summary>
              <div className="fa-ans">지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AI면접이 응답을 분석·검증해 역량 평가와 핵심 요약이 담긴 리포트를 생성하고, 채용팀에는 검증을 통과한 상위 후보의 리포트만 전달됩니다.</div>
            </details>
            <details className="faq-item">
              <summary>기존 ATS·채용 툴과 연동되나요? <i className="fa-solid fa-plus fq-ic"></i></summary>
              <div className="fa-ans">리포트는 표준 형식으로 제공되어 기존 채용 프로세스에 바로 활용할 수 있습니다. 상세 연동 방식은 도입 상담에서 안내해 드립니다.</div>
            </details>
            <details className="faq-item">
              <summary>도입까지 얼마나 걸리나요? <i className="fa-solid fa-plus fq-ic"></i></summary>
              <div className="fa-ans">설치나 계약 없이 무료 신청 후 바로 시작할 수 있습니다. 신청하시면 영업일 기준 1일 내 담당자가 데모와 함께 안내드립니다.</div>
            </details>
            <details className="faq-item">
              <summary>지원자 데이터는 안전하게 관리되나요? <i className="fa-solid fa-plus fq-ic"></i></summary>
              <div className="fa-ans">모든 데이터는 전송 구간 암호화(HTTPS)와 접근 통제 정책 아래 관리됩니다. 수집 항목과 처리 방식은 <Link href="/privacy">개인정보처리방침</Link>에서 확인하실 수 있습니다.</div>
            </details>
            <details className="faq-item">
              <summary>비용은 어떻게 책정되나요? <i className="fa-solid fa-plus fq-ic"></i></summary>
              <div className="fa-ans">채용 규모와 활용 방식에 맞춰 책정됩니다. 우선 무료로 도입 효과를 확인해 보신 뒤, 상담을 통해 안내해 드립니다.</div>
            </details>
          </div>
        </div>
      </section>

      {/* SECTION 09 · FINAL CTA */}
      <section className="final" id="final" data-nav="dark">
        <HeroParticles canvasId="final-particles" targetId="real-cta" />
        <div className="wrap">
          <h2>다음 채용부터,<br /><span className="real-cta" id="real-cta">검증된 후보</span>만 만나세요.</h2>
          <p>5분이면 충분합니다. AI가 먼저 검증하고 핵심 후보만 전달합니다.</p>
          <Link href="/apply" className="btn btn-blue">무료 상담 신청 <i className="fa-solid fa-arrow-right"></i></Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </>
  );
}
