import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
// 상세 레이아웃은 블로그 글 상세를 그대로 쓴다. post.css 를 고치면 함께 바뀐다.
import "../../blog/[id]/post.css";
import "../event.css";
import { EVENTS, findEvent, statusOf, ddayLabel, STATUS_LABEL, type EventItem } from "@/lib/events";
import { EVENT_JOBS } from "@/lib/eventApply";
import { buildPageMetadata } from "@/lib/pageSeo";

export const revalidate = 120;

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = findEvent(slug);
  if (!e) return { title: "이벤트를 찾을 수 없습니다" };
  const fallback: Metadata = {
    title: `${e.title} 참가자 모집`,
    description: e.excerpt,
    alternates: { canonical: `/event/${e.slug}` },
    openGraph: {
      title: `${e.title} 참가자 모집`,
      description: e.excerpt,
      url: `/event/${e.slug}`,
      images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
    },
  };
  return buildPageMetadata(`/event/${e.slug}`, fallback);
}

/* ── 이벤트별 본문 ───────────────────────────────
   행사마다 내용이 다르므로 slug로 본문을 고른다. 레이아웃·타이포는 전부 post.css 공용.

   ⚠️ 사실관계의 출처는 03_회의자료/2026-슈퍼전자-AI면접챌린지-기획안.pptx 다.
      고칠 때 함께 지켜야 하는 제약 세 가지:
      1) 문항 수·소요시간을 쓰지 않는다 — "5문항", "약 O분" 금지(slide 14).
      2) 모델 직무의 설계 근거가 된 실존 기업명을 쓰지 않는다(slide 13).
      3) 가상기업 고지는 고정 문구다. 포스터·지원 폼·보도자료와 같은 문장을 쓴다(slide 4). */

const STEPS = [
  ["1. 지원서 접수", "마케팅·개발 중 한 직군을 골라 지원서를 냅니다", "10.06 ~ 11.01"],
  ["2. 1차 AI 면접 (온라인)", "응시 기간 안에서 원하는 시간을 골라 응시합니다", "11.04 ~ 11.08"],
  ["3. Finalist 발표", "면접 결과를 검토해 3인을 선발하고 개별 안내드립니다", "11.11"],
  ["4. 2차 인재상 면접 (오프라인)", "슈퍼전자 인재상 면접과 참가자 인터뷰, 시상식에 참여합니다", "11.20"],
];

/* 인재상 4 — 채용공고문이 "자세한 정의는 이벤트 페이지 참조"로 이 표를 가리킨다(slide 12).
   2차가 인재상 면접이므로 지원자가 미리 읽고 준비할 수 있어야 한다. */
const VALUES = [
  ["Challenge", "도전", "해보지 않은 방식을 먼저 시도한다"],
  ["Ownership", "주도", "맡은 일의 결과까지 책임진다"],
  ["Collaboration", "협업", "다른 직군의 언어로 말한다"],
  ["Growth", "성장", "어제의 자기 방식을 의심한다"],
];

const FAQS = [
  [
    "슈퍼전자는 실제로 있는 회사인가요?",
    "아닙니다. 슈퍼전자는 이 행사를 위해 만든 가상 기업입니다. 실제 채용 절차나 입사 자격과 관계가 없으며, 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.",
  ],
  [
    "반도체를 몰라도 지원할 수 있나요?",
    "네. 반도체 지식은 묻지 않습니다. 면접의 상황 질문은 전공과 상관없이 답할 수 있게 만들었습니다. 회사를 반도체 기업으로 둔 것은 '이 제품을 누가 사는가'를 묻는 질문이 자연스럽게 나오기 때문입니다.",
  ],
  [
    "전공이나 학년 제한이 있나요?",
    "없습니다. 전공, 학년, 졸업 시기를 보지 않습니다. 어학 점수나 자격증, 수상 경력도 반영하지 않습니다.",
  ],
  ["참가비가 있나요?", "없습니다. 모든 전형은 무료로 진행됩니다."],
  [
    "AI 면접은 어떻게 진행되나요?",
    "온라인으로 진행되며, 응시 기간 안에서 원하는 시간을 골라 응시할 수 있습니다. 자격증이나 스펙을 직접 묻는 대신 직무 역량에 연결된 본인의 경험을 질문하고, 답변에 따라 후속 질문이 이어집니다. 답변 시간에 제한은 없습니다.",
  ],
  [
    "두 직군에 모두 지원할 수 있나요?",
    "한 직군만 선택해 지원할 수 있습니다. 지원서 제출 시 마케팅과 개발 중 하나를 고르시면 됩니다.",
  ],
  [
    "오프라인 최종 면접에 꼭 참석해야 하나요?",
    "1차 AI 면접까지만 참여하셔도 괜찮습니다. 오프라인 최종 면접은 선발된 Finalist 3인을 대상으로 진행하며, 지원서에서 참석 가능 여부를 미리 확인합니다.",
  ],
];

function MockChallengeBody({ e, dday }: { e: EventItem; dday: string }) {
  return (
    <>
      {/* 공고 카드는 여기(상세)에만 둔다. 목록(/event)은 행사 배너만 보여주고,
          "어떤 직군을 뽑는지"는 들어와서 확인하는 구조다.
          읽기 폭 안에서는 2열로 두면 제목이 접히고 태그가 넘쳐서 세로로 쌓는다.
          카드 자체가 지원 경로라 본문 중간에 CTA 버튼을 따로 두지 않는다. */}
      <div className="ev-jobs">
        <div className="ev-jobs__head">
          <h2>모집 중인 공고</h2>
          <span className="ev-jobs__count">{EVENT_JOBS.length}</span>
        </div>
        <ul className="ev-jobs__list ev-jobs__list--stack">
          {EVENT_JOBS.map((j) => (
            <li key={j.v}>
              <Link href={`${e.applyUrl}?job=${j.v}`} className="ev-jobcard">
                <span className="ev-jobcard__main">
                  <span className="ev-jobcard__org">슈퍼전자</span>
                  <span className="ev-jobcard__title">{j.l} 신입사원 모집</span>
                  <span className="ev-jobcard__meta">
                    <span>신입</span>
                    <span>
                      {e.applyStart.replace(/-/g, ".")} ~ {e.applyEnd.replace(/-/g, ".")}
                    </span>
                  </span>
                  <span className="ev-jobcard__tags">
                    <span className="ev-tag ev-tag--dday">{dday}</span>
                    {j.tags.map((t) => (
                      <span key={t} className="ev-tag">
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="ev-jobcard__go" aria-hidden="true">
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="ev-jobs__note">한 직군만 선택해 지원합니다. 참가비는 없고 전공·학년 제한도 없습니다.</p>
      </div>

      <h2>어떤 행사인가요</h2>
      <p>
        실제 채용에서 AI 면접을 처음 만나는 경우가 많습니다. 화면 앞에 앉아 무엇을 어떻게 말해야 할지 모른 채로 첫
        전형을 치르면, 답변 내용과 무관한 이유로 실력을 보이지 못하게 됩니다.
      </p>
      <p>
        슈퍼코더는 취업 전에 AI 면접을 실전처럼 겪어 볼 수 있는 자리를 만들었습니다. 이 행사를 위해 만든 가상기업{" "}
        <strong>슈퍼전자</strong>의 채용 전형을 지원서부터 최종 면접까지 그대로 진행합니다. 지원서를 내고, 온라인 AI
        면접을 보고, 선발되면 오프라인 인재상 면접과 시상식에 참여합니다.
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

      <h2>가상기업 슈퍼전자</h2>
      <p>
        2018년에 설립한 반도체 기업입니다. 메모리 반도체와 이미지 센서를 만들어 스마트폰·자동차·데이터센터 고객사에
        공급하고, 2026년 하반기에는 AI 서버용 고대역폭 메모리 신제품 양산을 준비하고 있습니다. 임직원 1,200명, 본사는
        서울입니다.
      </p>
      <p className="post-src">
        기업을 상대로 파는 회사라 &lsquo;고객이 누구인가&rsquo;를 묻는 질문이 자연스럽게 나옵니다. 다만 반도체 지식은
        묻지 않습니다. 면접의 상황 질문은 전공과 상관없이 답할 수 있게 만들었습니다.
      </p>

      <h3>인재상</h3>
      <p>2차 오프라인 면접은 아래 네 가지를 기준으로 진행합니다.</p>
      <div className="post-table-wrap">
        <table className="post-table">
          <thead>
            <tr>
              <th>인재상</th>
              <th>뜻</th>
              <th>정의</th>
            </tr>
          </thead>
          <tbody>
            {VALUES.map((v) => (
              <tr key={v[0]}>
                <td>
                  <strong>{v[0]}</strong>
                </td>
                <td>{v[1]}</td>
                <td>{v[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>모집 직군</h2>
      <p>
        두 직군 중 <strong>하나를 선택</strong>해 지원합니다. 두 직군 모두 전공·자격 요건이 없고, 다른 회사와 산업에도
        거의 같은 직무가 있어 여기서 해 본 것이 실제 취업 준비로 이어집니다.
      </p>

      {EVENT_JOBS.map((j) => (
        <div key={j.v}>
          {/* 직군명만 쓴다. 소속 팀(j.team)은 지원 페이지의 공고 화면이 메타로 보여준다 —
              여기서 "소프트웨어개발팀 · 소프트웨어 개발"처럼 같은 말을 두 번 쓰지 않도록. */}
          <h3>{j.l}</h3>
          <p className="post-src">{j.team}</p>
          <p>{j.desc}</p>
          <p>이런 것을 봅니다</p>
          <ul className="post-list">
            {j.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ))}
      <p className="post-src">
        전공, 어학 점수, 자격증, 수상 경력은 보지 않습니다. 우대 사항도 없습니다. 해 본 경험을 묻고 답변으로
        판단합니다.
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
              <td>1차 AI 면접 완료 선착순 100명</td>
              <td>스타벅스 모바일 쿠폰 5,000원권</td>
            </tr>
            <tr>
              <td>Finalist 3인</td>
              <td>슈퍼코더 주최 상장·수료증, 2차 오프라인 면접 참여, 교통 실비 3만원</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Finalist는 마케팅 부문 1인, 개발 부문 1인, 전체 부문 1인으로 선발합니다. 상장은 이력서에 이렇게 적을 수 있습니다
        — <strong>2026 슈퍼전자 AI 면접 챌린지 (주최 슈퍼코더) · 마케팅 부문 최우수</strong>.
      </p>
      <ul className="post-list">
        <li>쿠폰 선착순은 1차 AI 면접을 끝까지 마친 시각을 기준으로 합니다.</li>
        <li>중복 지원, 허위 기재, 참가 대상 미충족 신청은 집계에서 제외하며 다음 순번으로 승계합니다.</li>
        <li>쿠폰은 면접 종료 후 일괄 발송하며, 발송 예정일은 2026년 11월 13일입니다.</li>
        <li>지원서에 적어 주신 휴대폰 번호로 발송합니다. 번호 오기로 받지 못하신 경우 11월 27일까지 문의해 주세요.</li>
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
              <td>모집 직군</td>
              <td>제품마케팅, 소프트웨어 개발 (한 직군 선택)</td>
            </tr>
            <tr>
              <td>지원 자격</td>
              <td>어학 점수·자격증·수상 경력 미반영. 우대 사항 없음</td>
            </tr>
            <tr>
              <td>모집 기간</td>
              <td>
                {e.applyFrom} ~ {e.applyTo}
              </td>
            </tr>
            <tr>
              <td>1차 AI 면접 (온라인)</td>
              <td>{e.interview}</td>
            </tr>
            <tr>
              <td>Finalist 발표</td>
              <td>{e.announce} · 개별 안내</td>
            </tr>
            <tr>
              <td>2차 인재상 면접 (오프라인)</td>
              <td>{e.final}</td>
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
              <td>{e.contact}</td>
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
          <strong>슈퍼전자는 본 행사를 위한 가상 기업입니다.</strong> 실제 채용 절차나 입사 자격과 관계가 없으며, 본
          행사 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.
        </li>
        <li>
          지원서에 적어 주신 정보는 참가 자격 확인, 행사 안내와 면접 링크 발송, 참가 혜택 발송, Finalist 선발과 안내,
          행사 운영 통계 작성에만 사용합니다.
        </li>
        <li>수집한 정보는 행사 종료 후 3개월까지 보관하며 2027년 2월 28일까지 전량 파기합니다.</li>
        <li>
          1차 AI 면접의 응답은 면접 결과 검토와 행사 결과 집계에 사용합니다. 개인을 식별할 수 없도록 처리한 뒤
          보도자료·블로그 등 콘텐츠에 활용하는 것은 지원서에서 별도로 동의를 받으며, 동의하지 않으셔도 참가에는 영향이
          없습니다.
        </li>
        <li>
          오프라인 최종 면접의 촬영·홍보 활용은 Finalist 확정 후 별도로 동의를 받습니다. 동의하지 않으셔도 최종
          면접에는 참여하실 수 있습니다.
        </li>
      </ul>
    </>
  );
}

const BODIES: Record<string, (p: { e: EventItem; dday: string }) => React.ReactElement> = {
  "ai-mock-challenge-2026": MockChallengeBody,
};

const TAGS = ["AI면접", "모의채용", "취업준비", "마케팅직무", "개발직무", "대외활동"];

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = findEvent(slug);
  const Body = e ? BODIES[e.slug] : undefined;
  if (!e || !Body) notFound();

  const status = statusOf(e);
  // 공고 카드의 D-day. revalidate 120 이라 날짜가 바뀌어도 2분 안에 따라온다.
  const dday = ddayLabel(e);

  const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.excerpt,
    startDate: e.applyStart,
    endDate: "2026-11-20",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage: "ko-KR",
    location: [
      { "@type": "VirtualLocation", url: `https://www.supercoder.co/event/${e.slug}` },
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
        {/* 행사가 한 건뿐이면 /event 가 이 페이지로 되돌려 보내므로(목록 건너뛰기) 링크를 숨긴다 —
            누르면 제자리로 돌아오는 링크가 된다. 두 건 이상이면 자동으로 다시 나온다. */}
        {EVENTS.length > 1 && (
          <Link href="/event" className="post-back">
            <i className="fa-solid fa-arrow-left"></i> 이벤트 목록
          </Link>
        )}

        <div className="post-head">
          <span className="cat">{STATUS_LABEL[status]}</span>
          <h1>{e.title}</h1>
          <div className="post-meta">
            <span>
              <i className="fa-solid fa-bullhorn"></i> 주최 슈퍼코더
            </span>
            <span>
              <i className="fa-solid fa-clock-rotate-left"></i> {e.period}
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
          <Body e={e} dday={dday} />
        </div>

        <ul className="post-tags" aria-label="주제 키워드">
          {TAGS.map((t) => (
            <li key={t} className="post-tag">
              #{t}
            </li>
          ))}
        </ul>

        <aside className="post-cta">
          <p className="post-cta__label">
            <i className="fa-solid fa-circle-check"></i> {e.title}
          </p>
          <h2 className="post-cta__title">첫 AI 면접을 실전에서 보지 마세요.</h2>
          <p className="post-cta__desc">
            참가비는 없고 전공·학년 제한도 없습니다. {e.applyTo}까지 지원할 수 있습니다.
          </p>
          <div className="post-cta__actions">
            <Link href={e.applyUrl} className="btn btn-blue">
              지원하기 <i className="fa-solid fa-arrow-right"></i>
            </Link>
            <Link href="/" className="btn btn-out">
              슈퍼코더 AI면접 알아보기
            </Link>
          </div>
        </aside>
      </article>
    </>
  );
}
