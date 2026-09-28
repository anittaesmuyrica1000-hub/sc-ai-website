import type { Metadata } from "next";
import Link from "next/link";
import "./event.css";
import HeroParticles from "@/components/HeroParticles";
import { buildPageMetadata } from "@/lib/pageSeo";

export const revalidate = 120;

/**
 * 2026 슈퍼코더 AI 모의채용 챌린지 이벤트 페이지.
 *
 * ⚠️ 아래 EVENT 상수의 값은 2026-10-02 기획 회의 확정 전 **제안값**이다.
 *    회의 확정값으로 교체한 뒤에만 main(운영)으로 머지한다.
 * ⚠️ APPLY_URL 은 아직 미확정이다. 신청 폼(Google Form 또는 자체 폼)이 정해지면
 *    이 상수 하나만 바꾸면 전 CTA가 함께 바뀐다.
 *    자체 폼으로 갈 경우 리드 저장은 반드시 서버 라우트를 거쳐야 한다(RLS로 클라이언트 insert 차단).
 */
const APPLY_URL = "#apply-notice"; // TODO(10/02 확정): 신청 폼 URL

const EVENT = {
  name: "2026 슈퍼코더 AI 모의채용 챌린지",
  sub: "가상기업 '슈퍼전자' 채용 시뮬레이션",
  copy: "취업 전에, AI 면접부터 실전처럼.",
  applyFrom: "2026년 10월 6일(화)",
  applyTo: "2026년 11월 1일(일) 23:59",
  interview: "2026년 11월 4일(수) ~ 11월 8일(일)",
  announce: "2026년 11월 11일(수)",
  final: "2026년 11월 20일(금), 서울",
  contact: "이벤트 담당자 연락처 준비 중", // TODO(10/02 확정)
};

const FALLBACK_METADATA: Metadata = {
  title: "AI 모의채용 챌린지 — 취업 전에 AI 면접 미리 보기",
  description:
    "가상기업 '슈퍼전자'의 마케팅·개발 직무에 지원하고 온라인 AI 면접을 실전처럼 경험해 보세요. 참가비 무료, 전공·학년 제한 없음. 2026년 10월 6일부터 11월 1일까지 모집합니다.",
  alternates: { canonical: "/event" },
  openGraph: {
    title: "2026 슈퍼코더 AI 모의채용 챌린지 참가자 모집",
    description:
      "가상기업에 지원해 AI 면접을 실전처럼. 참가비 무료, 전공·학년 제한 없음. 선발자는 오프라인 최종 면접에 참여합니다.",
    url: "/event",
    images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
  },
};
export function generateMetadata() {
  return buildPageMetadata("/event", FALLBACK_METADATA);
}

/* ── 전형 절차 ─────────────────────────────── */
const STEPS = [
  { icon: "fa-file-lines", title: "지원서 제출", desc: "마케팅·개발 중 한 직무를 골라 지원서를 냅니다", when: "10.06 ~ 11.01" },
  { icon: "fa-robot", title: "1차 온라인 AI 면접", desc: "응시 기간 안에서 원하는 시간을 골라 응시합니다", when: "11.04 ~ 11.08" },
  { icon: "fa-user-check", title: "Finalist 발표", desc: "면접 결과를 검토해 개별 안내드립니다", when: "11.11" },
  { icon: "fa-users", title: "오프라인 최종 면접", desc: "슈퍼전자 인재상 면접과 인터뷰, 시상식에 참여합니다", when: "11.20" },
];

/* ── 모집 직무 ─────────────────────────────── */
const JOBS = [
  {
    tag: "마케팅",
    title: "제품마케팅팀 · 마케터",
    does: [
      "신제품과 슈퍼홈 앱의 시장·고객을 분석해 누구에게 무엇으로 팔 것인지 정합니다",
      "출시 캠페인을 기획하고 실행합니다",
      "캠페인이 끝난 뒤 무엇이 통했고 무엇이 통하지 않았는지 정리합니다",
    ],
    fit: ["사용자가 왜 떠났는지 직접 확인해 본 분", "자기 결과를 숫자로 설명해 본 분", "짧고 분명하게 쓰는 분"],
  },
  {
    tag: "개발",
    title: "애플리케이션개발팀 · 소프트웨어 엔지니어",
    does: [
      "슈퍼홈 앱의 화면과 기능을 만듭니다",
      "앱과 가전 기기를 잇는 서버 기능을 만듭니다",
      "기기 연결이 실패하는 원인을 찾아 고칩니다",
    ],
    fit: ["안 되는 이유를 끝까지 찾아본 분", "자기 코드를 남에게 설명해 본 분", "필요해서 새 기술을 직접 익혀 본 분"],
  },
];

/* ── 참가 혜택 ─────────────────────────────── */
const BENEFITS = [
  { icon: "fa-gift", title: "지원 완료 선착순 100명", desc: "스타벅스 모바일 쿠폰 5,000원권" },
  { icon: "fa-coins", title: "1차 AI 면접 완료 선착순 100명", desc: "스타벅스 모바일 쿠폰 10,000원권" },
  { icon: "fa-bookmark", title: "Finalist 전원", desc: "슈퍼코더 주최 상장·수료증, 오프라인 최종 면접 참여" },
];

/* ── FAQ ───────────────────────────────────── */
const FAQS = [
  {
    q: "슈퍼전자는 실제로 있는 회사인가요?",
    a: "아닙니다. 슈퍼전자는 이 행사를 위해 만든 가상 기업입니다. 실제 채용 절차나 입사 자격과 관계가 없으며, 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.",
  },
  {
    q: "전공이나 학년 제한이 있나요?",
    a: "없습니다. 전공, 학년, 졸업 시기를 보지 않습니다. 어학 점수나 자격증도 요구하지 않습니다.",
  },
  { q: "참가비가 있나요?", a: "없습니다. 모든 전형은 무료로 진행됩니다." },
  {
    q: "AI 면접은 어떻게 진행되나요?",
    a: "온라인으로 진행되며, 응시 기간 안에서 원하는 시간을 골라 응시할 수 있습니다. 자격증이나 스펙을 직접 묻는 대신 직무 역량에 연결된 본인의 경험을 질문하고, 답변에 따라 후속 질문이 이어집니다.",
  },
  {
    q: "두 직무에 모두 지원할 수 있나요?",
    a: "한 직무만 선택해 지원할 수 있습니다. 지원서 제출 시 마케팅과 개발 중 하나를 고르시면 됩니다.",
  },
  {
    q: "오프라인 최종 면접에 꼭 참석해야 하나요?",
    a: "1차 온라인 AI 면접까지만 참여하셔도 괜찮습니다. 오프라인 최종 면접은 선발된 Finalist를 대상으로 진행하며, 지원서에서 참석 가능 여부를 미리 확인합니다.",
  },
];

export default function EventPage() {
  const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EVENT.name,
    description:
      "가상기업 '슈퍼전자'의 마케팅·개발 직무에 지원하고 온라인 AI 면접을 실전처럼 경험하는 모의채용 행사입니다.",
    startDate: "2026-10-06",
    endDate: "2026-11-20",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage: "ko-KR",
    location: [
      { "@type": "VirtualLocation", url: "https://www.supercoder.co/event" },
      { "@type": "Place", name: "서울", address: { "@type": "PostalAddress", addressLocality: "서울", addressCountry: "KR" } },
    ],
    organizer: { "@type": "Organization", name: "슈퍼코더", url: "https://www.supercoder.co/" },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      {/* ── HERO ─────────────────────────────── */}
      <div className="ev-hero" data-nav="dark">
        <HeroParticles canvasId="event-particles" targetId="ev-accent" />
        <div className="wrap ev-hero-inner">
          <p className="ev-kicker">SUPERCODER EVENT</p>
          <h1>
            취업 전에,<br />
            <span id="ev-accent">AI 면접</span>부터 실전처럼.
          </h1>
          <p className="ev-hero-sub">
            가상기업 &lsquo;슈퍼전자&rsquo;에 지원하고, 실제 채용 전형을 그대로 경험해 보세요.
          </p>
          <div className="ev-hero-dates">
            <div>
              <span>모집 기간</span>
              <strong>10.06 ~ 11.01</strong>
            </div>
            <div>
              <span>1차 온라인 AI 면접</span>
              <strong>11.04 ~ 11.08</strong>
            </div>
            <div>
              <span>오프라인 최종 면접</span>
              <strong>11.20 서울</strong>
            </div>
          </div>
          <div className="ev-hero-cta">
            <a href={APPLY_URL} className="btn btn-blue">
              지원하기 <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
          <p className="ev-hero-note">참가비 무료 · 전공·학년 제한 없음 · 온라인 응시</p>
        </div>
      </div>

      {/* ── 전형 절차 ─────────────────────────── */}
      <section className="ev-sec" id="process">
        <div className="wrap">
          <p className="eyebrow">전형 안내</p>
          <h2 className="ev-h2">지원부터 최종 면접까지</h2>
          <div className="ev-steps">
            {STEPS.map((s, i) => (
              <div className="ev-step" key={s.title}>
                <div className="ev-step-num">
                  <i className={`fa-solid ${s.icon}`} aria-hidden="true"></i>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="ev-step-when">{s.when}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 모집 직무 ─────────────────────────── */}
      <section className="ev-sec ev-sec-soft" id="jobs">
        <div className="wrap">
          <p className="eyebrow">모집 직무</p>
          <h2 className="ev-h2">두 직무 중 하나를 골라 지원합니다</h2>
          <p className="ev-lead">
            슈퍼전자는 공기청정기·로봇청소기·스마트 조명을 만들고, 기기를 한 앱에서 제어하는 모바일 앱
            &lsquo;슈퍼홈&rsquo;을 운영합니다. 이번 전형은 슈퍼홈의 국내 성장과 해외 진출 준비를 함께 맡을
            신입 인재를 찾습니다.
          </p>
          <div className="ev-jobs">
            {JOBS.map((j) => (
              <article className="ev-job" key={j.tag}>
                <span className="ev-job-tag">{j.tag}</span>
                <h3>{j.title}</h3>
                <h4>하는 일</h4>
                <ul>
                  {j.does.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <h4>이런 분을 찾습니다</h4>
                <ul>
                  {j.fit.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p className="ev-job-note">
                  전공·자격 요건 없음. 전공, 어학 점수, 자격증, 수상 경력은 보지 않습니다.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 참가 혜택 ─────────────────────────── */}
      <section className="ev-sec" id="benefits">
        <div className="wrap">
          <p className="eyebrow">참가 혜택</p>
          <h2 className="ev-h2">참가비는 없고, 혜택은 중복으로 받습니다</h2>
          <div className="ev-benefits">
            {BENEFITS.map((b) => (
              <div className="ev-benefit" key={b.title}>
                <i className={`fa-solid ${b.icon}`} aria-hidden="true"></i>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
          <ul className="ev-fineprint">
            <li>선착순은 지원서 제출 시각과 면접 제출 시각을 기준으로 합니다.</li>
            <li>중복 지원, 허위 기재, 참가 대상 미충족 신청은 집계에서 제외하며 다음 순번으로 승계합니다.</li>
            <li>쿠폰은 지원 마감 후 일괄 발송하며, 발송 예정일은 2026년 11월 13일입니다.</li>
            <li>지원서에 적어 주신 휴대폰 번호로 발송합니다. 번호 오기로 받지 못하신 경우 11월 27일까지 문의해 주세요.</li>
          </ul>
        </div>
      </section>

      {/* ── 지원 자격 · 일정 ───────────────────── */}
      <section className="ev-sec ev-sec-soft" id="info">
        <div className="wrap">
          <p className="eyebrow">모집 요강</p>
          <h2 className="ev-h2">한눈에 보기</h2>
          <div className="ev-table-wrap">
            <table className="ev-table">
              <tbody>
                <tr>
                  <th>참가 대상</th>
                  <td>취업을 준비하고 있는 대학·대학원 재학생 및 졸업생 (학년·전공·졸업 시기 제한 없음)</td>
                </tr>
                <tr>
                  <th>모집 직무</th>
                  <td>마케팅, 개발 (한 직무 선택)</td>
                </tr>
                <tr>
                  <th>모집 기간</th>
                  <td>
                    {EVENT.applyFrom} ~ {EVENT.applyTo}
                  </td>
                </tr>
                <tr>
                  <th>1차 온라인 AI 면접</th>
                  <td>{EVENT.interview}</td>
                </tr>
                <tr>
                  <th>Finalist 발표</th>
                  <td>{EVENT.announce} · 개별 안내</td>
                </tr>
                <tr>
                  <th>오프라인 최종 면접</th>
                  <td>{EVENT.final}</td>
                </tr>
                <tr>
                  <th>참가비</th>
                  <td>무료</td>
                </tr>
                <tr>
                  <th>주최</th>
                  <td>슈퍼코더</td>
                </tr>
                <tr>
                  <th>문의</th>
                  <td>{EVENT.contact}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────── */}
      <section className="ev-sec" id="event-faq">
        <div className="wrap">
          <p className="eyebrow">자주 묻는 질문</p>
          <h2 className="ev-h2">궁금한 점</h2>
          <div className="ev-faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 유의사항 ──────────────────────────── */}
      <section className="ev-sec ev-sec-soft" id="notice">
        <div className="wrap">
          <div className="ev-notice" id="apply-notice">
            <h3>
              <i className="fa-solid fa-circle-info" aria-hidden="true"></i> 반드시 확인해 주세요
            </h3>
            <ul>
              <li>
                <b>슈퍼전자는 본 행사를 위한 가상 기업입니다.</b> 실제 채용 절차나 입사 자격과 관계가 없으며,
                본 행사 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.
              </li>
              <li>
                지원서에 적어 주신 정보는 참가 자격 확인, 행사 안내와 면접 링크 발송, 참가 혜택 발송,
                Finalist 선발과 안내, 행사 운영 통계 작성에만 사용합니다.
              </li>
              <li>수집한 정보는 행사 종료 후 3개월까지 보관하며 2027년 2월 28일까지 전량 파기합니다.</li>
              <li>
                1차 AI 면접의 응답은 면접 결과 검토와 행사 결과 집계에 사용하며, 개인을 식별할 수 없도록 처리한
                뒤 통계와 콘텐츠에 활용할 수 있습니다.
              </li>
              <li>
                오프라인 최종 면접의 촬영·홍보 활용은 Finalist 확정 후 별도로 동의를 받습니다. 동의하지 않으셔도
                최종 면접에는 참여하실 수 있습니다.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────── */}
      <section className="ev-final" data-nav="dark">
        <div className="wrap">
          <h2>첫 AI 면접을 실전에서 보지 마세요</h2>
          <p>
            {EVENT.applyTo}까지 지원할 수 있습니다.
          </p>
          <div className="ev-hero-cta">
            <a href={APPLY_URL} className="btn btn-white">
              지원하기 <i className="fa-solid fa-arrow-right"></i>
            </a>
            <Link href="/" className="btn btn-out ev-btn-ghost">
              슈퍼코더 AI면접 알아보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
