import type { Metadata } from "next";
import Link from "next/link";
// 블로그 상세와 같은 읽기 레이아웃을 쓴다. 스타일을 복사하지 않고 원본을 그대로 import —
// post.css를 고치면 블로그 글과 이 페이지가 함께 바뀐다.
import "../blog/[id]/post.css";
import "./event.css";
import { buildPageMetadata } from "@/lib/pageSeo";

export const revalidate = 120;

/**
 * 2026 슈퍼코더 AI 모의채용 챌린지 이벤트 페이지.
 *
 * ⚠️ EVENT 상수의 값은 2026-10-02 기획 회의 확정 전 **제안값**이다.
 *    회의 확정값으로 교체한 뒤에만 main(운영)으로 머지한다.
 * ⚠️ APPLY_URL 은 아직 미확정이다. 신청 폼(Google Form 또는 자체 폼)이 정해지면
 *    이 상수 하나만 바꾸면 전 CTA가 함께 바뀐다.
 *    자체 폼으로 갈 경우 리드 저장은 반드시 서버 라우트를 거쳐야 한다(RLS로 클라이언트 insert 차단).
 */
const APPLY_URL = "#apply-notice"; // TODO(10/02 확정): 신청 폼 URL

const EVENT = {
  name: "2026 슈퍼코더 AI 모의채용 챌린지",
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

const STEPS = [
  ["1. 지원서 제출", "마케팅·개발 중 한 직무를 골라 지원서를 냅니다", "10.06 ~ 11.01"],
  ["2. 1차 온라인 AI 면접", "응시 기간 안에서 원하는 시간을 골라 응시합니다", "11.04 ~ 11.08"],
  ["3. Finalist 발표", "면접 결과를 검토해 개별 안내드립니다", "11.11"],
  ["4. 오프라인 최종 면접", "슈퍼전자 인재상 면접과 인터뷰, 시상식에 참여합니다", "11.20"],
];

const FAQS = [
  [
    "슈퍼전자는 실제로 있는 회사인가요?",
    "아닙니다. 슈퍼전자는 이 행사를 위해 만든 가상 기업입니다. 실제 채용 절차나 입사 자격과 관계가 없으며, 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.",
  ],
  ["전공이나 학년 제한이 있나요?", "없습니다. 전공, 학년, 졸업 시기를 보지 않습니다. 어학 점수나 자격증도 요구하지 않습니다."],
  ["참가비가 있나요?", "없습니다. 모든 전형은 무료로 진행됩니다."],
  [
    "AI 면접은 어떻게 진행되나요?",
    "온라인으로 진행되며, 응시 기간 안에서 원하는 시간을 골라 응시할 수 있습니다. 자격증이나 스펙을 직접 묻는 대신 직무 역량에 연결된 본인의 경험을 질문하고, 답변에 따라 후속 질문이 이어집니다.",
  ],
  ["두 직무에 모두 지원할 수 있나요?", "한 직무만 선택해 지원할 수 있습니다. 지원서 제출 시 마케팅과 개발 중 하나를 고르시면 됩니다."],
  [
    "오프라인 최종 면접에 꼭 참석해야 하나요?",
    "1차 온라인 AI 면접까지만 참여하셔도 괜찮습니다. 오프라인 최종 면접은 선발된 Finalist를 대상으로 진행하며, 지원서에서 참석 가능 여부를 미리 확인합니다.",
  ],
];

const TAGS = ["AI면접", "모의채용", "취업준비", "마케팅직무", "개발직무", "대외활동"];

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
      {
        "@type": "Place",
        name: "서울",
        address: { "@type": "PostalAddress", addressLocality: "서울", addressCountry: "KR" },
      },
    ],
    organizer: { "@type": "Organization", name: "슈퍼코더", url: "https://www.supercoder.co/" },
    isAccessibleForFree: true,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <article className="post-wrap">
        <Link href="/" className="post-back">
          <i className="fa-solid fa-arrow-left"></i> 슈퍼코더 홈
        </Link>

        <div className="post-head">
          <span className="cat">이벤트</span>
          <h1>{EVENT.name}</h1>
          <div className="post-meta">
            <span>
              <i className="fa-solid fa-bullhorn"></i> 주최 슈퍼코더
            </span>
            <span>
              <i className="fa-solid fa-clock-rotate-left"></i> 모집 10.06 ~ 11.01
            </span>
            <span>
              <i className="fa-solid fa-users"></i> 대학·대학원 재학생 및 졸업생
            </span>
            <span>
              <i className="fa-solid fa-gift"></i> 참가비 무료
            </span>
          </div>
        </div>

        <div className="post-content">
          {/* 핵심 요약 — 블로그 TL;DR 박스와 같은 컴포넌트 */}
          <div className="post-tldr">
            <div className="tldr-head">
              <i className="fa-solid fa-circle-check"></i> 한눈에 보기
            </div>
            <ul>
              <li>가상기업 &lsquo;슈퍼전자&rsquo;의 마케팅·개발 직무에 지원해 실제 채용 전형을 그대로 경험합니다.</li>
              <li>전공·학년·졸업 시기 제한이 없고, 어학 점수나 자격증도 보지 않습니다.</li>
              <li>지원 선착순 100명과 1차 면접 완료 선착순 100명에게 모바일 쿠폰을 드립니다.</li>
              <li>선발된 Finalist는 11월 20일 오프라인 최종 면접에 참여하고 상장·수료증을 받습니다.</li>
            </ul>
          </div>

          <div className="ev-apply">
            <a href={APPLY_URL} className="btn btn-blue">
              지원하기 <i className="fa-solid fa-arrow-right"></i>
            </a>
            <span className="ev-apply__note">{EVENT.applyTo}까지 접수</span>
          </div>

          <h2>어떤 행사인가요</h2>
          <p>
            실제 채용에서 AI 면접을 처음 만나는 경우가 많습니다. 화면 앞에 앉아 무엇을 어떻게 말해야 할지 모른 채로
            첫 전형을 치르면, 답변 내용과 무관한 이유로 실력을 보이지 못하게 됩니다.
          </p>
          <p>
            슈퍼코더는 취업 전에 AI 면접을 실전처럼 겪어 볼 수 있는 자리를 만들었습니다. 이 행사를 위해 만든 가상기업{" "}
            <strong>슈퍼전자</strong>의 채용 전형을 처음부터 끝까지 그대로 진행합니다. 지원서를 내고, 온라인 AI 면접을
            보고, 선발되면 오프라인 최종 면접과 시상식에 참여합니다.
          </p>
          <blockquote>결과는 어떠한 기업의 채용에도 영향을 주지 않습니다. 연습용으로 편하게 보셔도 됩니다.</blockquote>

          <h2>전형 절차</h2>
          <div className="post-table-wrap">
            <table className="post-table">
              <thead>
                <tr>
                  <th>단계</th>
                  <th>내용</th>
                  <th>일정</th>
                </tr>
              </thead>
              <tbody>
                {STEPS.map((s) => (
                  <tr key={s[0]}>
                    <td>{s[0]}</td>
                    <td>{s[1]}</td>
                    <td>{s[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>모집 직무</h2>
          <p>
            슈퍼전자는 공기청정기·로봇청소기·스마트 조명을 만들고, 기기를 한 앱에서 제어하는 모바일 앱{" "}
            <strong>슈퍼홈</strong>을 운영합니다. 이번 전형은 슈퍼홈의 국내 성장과 해외 진출 준비를 함께 맡을 신입
            인재를 찾습니다. 두 직무 중 하나를 선택해 지원합니다.
          </p>

          <h3>제품마케팅팀 · 마케터</h3>
          <p>하는 일</p>
          <ul className="post-list">
            <li>신제품과 슈퍼홈 앱의 시장·고객을 분석해 누구에게 무엇으로 팔 것인지 정합니다</li>
            <li>출시 캠페인을 기획하고 실행합니다</li>
            <li>캠페인이 끝난 뒤 무엇이 통했고 무엇이 통하지 않았는지 정리합니다</li>
          </ul>
          <p>이런 분을 찾습니다</p>
          <ul className="post-list">
            <li>사용자가 왜 떠났는지 궁금해서 직접 확인해 본 경험이 있는 분</li>
            <li>자기 결과를 숫자로 설명해 본 분</li>
            <li>짧고 분명하게 쓰는 분</li>
          </ul>

          <h3>애플리케이션개발팀 · 소프트웨어 엔지니어</h3>
          <p>하는 일</p>
          <ul className="post-list">
            <li>슈퍼홈 앱의 화면과 기능을 만듭니다</li>
            <li>앱과 가전 기기를 잇는 서버 기능을 만듭니다</li>
            <li>기기 연결이 실패하는 원인을 찾아 고칩니다</li>
          </ul>
          <p>이런 분을 찾습니다</p>
          <ul className="post-list">
            <li>안 되는 이유를 끝까지 찾아본 경험이 있는 분</li>
            <li>자기 코드를 남에게 설명해 본 분</li>
            <li>필요해서 새 기술을 직접 익혀 본 분</li>
          </ul>
          <p className="post-src">
            두 직무 모두 전공·자격 요건이 없습니다. 전공, 어학 점수, 자격증, 수상 경력은 보지 않습니다.
          </p>

          <h2>참가 혜택</h2>
          <div className="post-table-wrap">
            <table className="post-table">
              <thead>
                <tr>
                  <th>대상</th>
                  <th>혜택</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>지원 완료 선착순 100명</td>
                  <td>스타벅스 모바일 쿠폰 5,000원권</td>
                </tr>
                <tr>
                  <td>1차 AI 면접 완료 선착순 100명</td>
                  <td>스타벅스 모바일 쿠폰 10,000원권</td>
                </tr>
                <tr>
                  <td>Finalist 전원</td>
                  <td>슈퍼코더 주최 상장·수료증, 오프라인 최종 면접 참여</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>두 쿠폰은 중복으로 받을 수 있습니다.</p>
          <ul className="post-list">
            <li>선착순은 지원서 제출 시각과 면접 제출 시각을 기준으로 합니다.</li>
            <li>중복 지원, 허위 기재, 참가 대상 미충족 신청은 집계에서 제외하며 다음 순번으로 승계합니다.</li>
            <li>쿠폰은 지원 마감 후 일괄 발송하며, 발송 예정일은 2026년 11월 13일입니다.</li>
            <li>
              지원서에 적어 주신 휴대폰 번호로 발송합니다. 번호 오기로 받지 못하신 경우 11월 27일까지 문의해 주세요.
            </li>
          </ul>

          <h2>모집 요강</h2>
          <div className="post-table-wrap">
            <table className="post-table">
              <tbody>
                <tr>
                  <td>참가 대상</td>
                  <td>취업을 준비하고 있는 대학·대학원 재학생 및 졸업생 (학년·전공·졸업 시기 제한 없음)</td>
                </tr>
                <tr>
                  <td>모집 직무</td>
                  <td>마케팅, 개발 (한 직무 선택)</td>
                </tr>
                <tr>
                  <td>모집 기간</td>
                  <td>
                    {EVENT.applyFrom} ~ {EVENT.applyTo}
                  </td>
                </tr>
                <tr>
                  <td>1차 온라인 AI 면접</td>
                  <td>{EVENT.interview}</td>
                </tr>
                <tr>
                  <td>Finalist 발표</td>
                  <td>{EVENT.announce} · 개별 안내</td>
                </tr>
                <tr>
                  <td>오프라인 최종 면접</td>
                  <td>{EVENT.final}</td>
                </tr>
                <tr>
                  <td>참가비</td>
                  <td>무료</td>
                </tr>
                <tr>
                  <td>주최</td>
                  <td>슈퍼코더</td>
                </tr>
                <tr>
                  <td>문의</td>
                  <td>{EVENT.contact}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>자주 묻는 질문</h2>
          {FAQS.map(([q, a]) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}

          <hr className="post-hr" />

          <h2 id="apply-notice">유의사항</h2>
          <ul className="post-list">
            <li>
              <strong>슈퍼전자는 본 행사를 위한 가상 기업입니다.</strong> 실제 채용 절차나 입사 자격과 관계가 없으며,
              본 행사 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.
            </li>
            <li>
              지원서에 적어 주신 정보는 참가 자격 확인, 행사 안내와 면접 링크 발송, 참가 혜택 발송, Finalist 선발과
              안내, 행사 운영 통계 작성에만 사용합니다.
            </li>
            <li>수집한 정보는 행사 종료 후 3개월까지 보관하며 2027년 2월 28일까지 전량 파기합니다.</li>
            <li>
              1차 AI 면접의 응답은 면접 결과 검토와 행사 결과 집계에 사용하며, 개인을 식별할 수 없도록 처리한 뒤 통계와
              콘텐츠에 활용할 수 있습니다.
            </li>
            <li>
              오프라인 최종 면접의 촬영·홍보 활용은 Finalist 확정 후 별도로 동의를 받습니다. 동의하지 않으셔도 최종
              면접에는 참여하실 수 있습니다.
            </li>
          </ul>
        </div>

        <ul className="post-tags" aria-label="주제 키워드">
          {TAGS.map((t) => (
            <li key={t} className="post-tag">
              #{t}
            </li>
          ))}
        </ul>

        {/* 하단 전환 CTA — 블로그 글과 같은 컴포넌트 */}
        <aside className="post-cta">
          <p className="post-cta__label">
            <i className="fa-solid fa-circle-check"></i> 2026 슈퍼코더 AI 모의채용 챌린지
          </p>
          <h2 className="post-cta__title">첫 AI 면접을 실전에서 보지 마세요.</h2>
          <p className="post-cta__desc">
            참가비는 없고 전공·학년 제한도 없습니다. {EVENT.applyTo}까지 지원할 수 있습니다.
          </p>
          <div className="post-cta__actions">
            <a href={APPLY_URL} className="btn btn-blue">
              지원하기 <i className="fa-solid fa-arrow-right"></i>
            </a>
            <Link href="/" className="btn btn-out">
              슈퍼코더 AI면접 알아보기
            </Link>
          </div>
        </aside>
      </article>
    </>
  );
}
