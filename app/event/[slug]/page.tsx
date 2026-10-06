import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
// 상세 레이아웃은 블로그 글 상세를 그대로 쓴다. post.css 를 고치면 함께 바뀐다.
import "../../blog/[id]/post.css";
import "../event.css";
import {
  EVENTS,
  findEvent,
  statusOf,
  ddayLabel,
  withoutYear,
  applyRange,
  applyPeriodLabel,
  openLabel,
  STATUS_LABEL,
  type EventItem,
  type EventStatus,
} from "@/lib/events";
import { EVENT_JOBS, EVENT_STEPS, EVENT_VALUES, COMPANY_PROFILE, COMPANY_FACTS, FICTION_NOTICE } from "@/lib/eventApply";
import ShareButton from "@/components/ShareButton";
import { buildPageMetadata } from "@/lib/pageSeo";

/* 주제 키워드. 화면에 해시태그로 늘어놓지 않고 meta keywords 와 og:article:tag 로만 내보낸다 —
   본문 끝의 해시태그 줄은 읽는 사람에게 주는 정보가 없고 지원 배너 앞을 가로막는다.
   블로그 상세(app/blog/[id]/page.tsx)가 posts.tags 로 쓰는 방식과 같다. */
const TAGS = ["AI면접", "모의채용", "취업준비", "마케팅직무", "개발직무", "대외활동"];

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
    keywords: TAGS,
    alternates: { canonical: `/event/${e.slug}` },
    openGraph: {
      type: "article",
      /* ⚠️ siteName·locale 을 여기에 다시 적는 이유 — Next 는 페이지에 openGraph 가 있으면
         layout 의 openGraph 를 통째로 갈아끼운다. lib/pageSeo.ts 의 OG_DEFAULTS 가 받아 주지만
         그건 page_seo 초안이 있을 때만이고(mergeSeo 는 seo 가 null 이면 fallback 을 그대로 반환),
         이 경로는 초안이 없어 og:site_name·og:locale 이 통째로 빠져 있었다. */
      siteName: "AI면접",
      locale: "ko_KR",
      title: `${e.title} 참가자 모집`,
      description: e.excerpt,
      url: `/event/${e.slug}`,
      images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
      tags: TAGS,
    },
    /* layout 의 twitter 는 홈 문구("AI 면접으로 검증된 인재만 만나세요")라 이 페이지를
       X 에 공유하면 행사와 상관없는 카드가 떴다. 페이지 값으로 덮는다. */
    twitter: {
      card: "summary_large_image",
      title: `${e.title} 참가자 모집`,
      description: e.excerpt,
      images: ["/og-image.png?v=3"],
    },
  };
  return buildPageMetadata(`/event/${e.slug}`, fallback);
}

/* ── 이벤트별 본문 ───────────────────────────────
   행사마다 내용이 다르므로 slug로 본문을 고른다. 레이아웃·타이포는 전부 post.css 공용.

   ⚠️ 사실관계의 출처는 03_회의자료/2026-슈퍼닉스-AI면접챌린지-기획안.pptx 다.
      고칠 때 함께 지켜야 하는 제약 세 가지:
      1) 문항 수·소요시간을 쓰지 않는다 — "5문항", "약 O분" 금지(slide 14).
      2) 모델 직무의 설계 근거가 된 실존 기업명을 쓰지 않는다(slide 13).
      3) 가상기업 고지는 고정 문구다. 포스터·지원 폼·보도자료와 같은 문장을 쓴다(slide 4). */

/* Finalist 선발 기준 — 참가 혜택의 보조 설명과 FAQ 가 같은 문장을 쓴다. 한쪽만 고치면 어긋난다.
   2026-10-02 회의: 3인(부문 1·1 + 전체 1) → 직군별 1인씩 2인. 전체 부문과 1·2·3등 등수는 없어졌다.
   ⚠️ 채점 항목 이름·배점은 쓰지 않는다 — 채점 틀은 아직 '논의' 단계다(10/30 내부 테스트까지 확정). */
const FINALIST_RULE =
  "Finalist 2인은 제품마케팅과 소프트웨어 개발 직군에서 1인씩, 각 직군에서 직무 AI 면접 점수가 가장 높은 사람입니다.";

/* 자주 묻는 질문.
   2026-09-30 쿠폰·Finalist·문의처 세 문항을 더했다 — 지원자가 가장 먼저 물을 내용인데 표와 유의사항에만 있었다.
   뺀 것: "참가비가 있나요"(히어로 메타·하단 지원 배너에 이미 나온다),
         "전공·학년 제한"(반도체 문항에 합쳤다).
   문의처는 e.contact 를 써야 해서 행사 값을 받는 함수로 둔다. */
const faqs = (e: EventItem) => [
  [
    "슈퍼전자는 실제로 있는 회사인가요?",
    "아닙니다. 이 행사를 위해 만든 가상 기업입니다. 실제 채용 절차나 입사 자격과 관계가 없으며, 참가와 결과는 어떠한 기업의 채용에도 영향을 주지 않습니다.",
  ],
  [
    "반도체를 몰라도 지원할 수 있나요?",
    "네. 반도체 지식은 묻지 않고 전공·학년·졸업 시기도 보지 않습니다. 어학 점수와 자격증, 수상 경력도 반영하지 않습니다. 면접의 상황 질문은 전공과 상관없이 답할 수 있게 만들었습니다.",
  ],
  [
    "AI 면접은 어떻게 진행되나요?",
    "직무 AI 면접은 온라인으로 진행하며, 응시 기간 안에서 원하는 시간을 골라 응시합니다. 자격증이나 스펙을 직접 묻는 대신 직무 역량에 연결된 본인의 경험을 질문하고, 답변에 따라 후속 질문이 이어집니다. 답변 시간에 제한은 없습니다.",
  ],
  ["두 직군에 모두 지원할 수 있나요?", "한 직군만 선택해 지원할 수 있습니다. 지원 후에는 직군을 바꿀 수 없습니다."],
  [
    "오프라인 AI 역량 검사에 꼭 참석해야 하나요?",
    "직무 AI 면접까지만 마쳐도 선착순 쿠폰 대상이 됩니다. 오프라인 AI 역량 검사는 Finalist 2인만 참여하며, 지원서에서 참석 가능 여부와 현장 사진 활용 동의를 미리 확인합니다.",
  ],
  [
    "선착순 쿠폰은 언제 받나요?",
    "직무 AI 면접을 끝까지 성실히 마친 순서로 30명에게 스타벅스 모바일 쿠폰 5,000원권을 드립니다. '성실히 마쳤다'는 모든 문항에 끝까지 답변을 완료한 경우를 말합니다. 11월 13일에 지원서에 적은 휴대폰 번호로 문자를 보냅니다.",
  ],
  ["Finalist는 어떻게 뽑나요?", `${FINALIST_RULE} 결과는 11월 11일에 개별로 안내드립니다.`],
  ["문의는 어디로 하면 되나요?", `${e.contact}로 메일을 보내 주세요.`],
];

/* ⚠️ 이 페이지는 '행사 전체', 공고 상세(/jobs/[job])는 '직군 하나'를 맡는다.
   직군별 하는 일·자격·우대사항은 공고 상세에만 둔다 — 두 곳에 같은 문장을 두면 반드시 어긋난다.
   그래서 여기서 뺀 것: 모집 직군(931px), 모집 요강 표(586px).
   모집 요강의 항목은 전부 다른 자리에 있다 — 일정·참가비는 사이드 패널, 문의는 유의사항,
   참가 대상·주최는 히어로 메타, 전형은 아래 전형 절차, 지원 자격은 공고 상세 자격요건. */
function MockChallengeBody({ e, dday }: { e: EventItem; dday: string }) {
  return (
    <>
      {/* 제목은 전부 명사형으로 맞춘다(행사 소개 · 슈퍼전자 소개 · 전형 절차 …)
          섹션 순서는 2026-10-02 회의에서 정한 지원자 경로다 —
          행사 소개 → 슈퍼전자 소개 → 모집 공고 2개 → 전형 절차 → 참가 혜택 → FAQ → 유의사항 → 하단 지원 배너.
          어떤 회사인지 먼저 알고 공고를 고르게 한다. */}
      <h2>행사 소개</h2>
      {/* 2026-10-06 최종 원고(지시 그대로). 두 문단이고, 예전에 있던
          "결과는 어떠한 기업의 채용에도 영향을 주지 않습니다" 한 줄은 뺐다 —
          같은 내용이 히어로 고지 칩·FAQ 첫 문항·유의사항 첫 줄에 그대로 있다.
          도입률 같은 수치는 쓰지 않는다 — 출처를 댈 수 있는 값이 아니다. */}
      <p>
        요즘 채용 과정에서 AI 면접을 만나는 일이 점점 많아지고 있습니다. 처음 보는 화면에서 질문을 받고, 제한된
        시간 안에 답해야 하다 보니 실력과 상관없이 긴장하거나 낯설게 느껴질 수도 있습니다.
      </p>
      <p>
        이번 대회에서는 실제 지원 전에 AI 면접 과정을 직접 경험해 볼 수 있습니다. 가상기업 ‘슈퍼전자’에 지원해
        온라인 직무 AI 면접을 진행하고, Finalist로 선발되면 11월 14일 서울 현장에서 오프라인 AI 역량 검사에
        참여합니다.
      </p>

      <h2>슈퍼전자 소개</h2>
      {COMPANY_PROFILE.map((para) => (
        <p key={para}>{para}</p>
      ))}
      {/* 회사 개요 — 실제 채용 공고의 기업 정보 줄. 선만 쓰고 면을 깔지 않는다 */}
      <dl className="ev-facts">
        {COMPANY_FACTS.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {/* 인재상 아래 안내문('2차 인재상 AI 면접은 아래 네 가지를 기준으로…')은 뺐다(2026-10-02).
          2차 전형이 오프라인 AI 역량 검사로 바뀌어 인재상이 채점 기준이 아니다. */}
      <h3>인재상</h3>
      <ul className="ev-values">
        {EVENT_VALUES.map(([en, ko, def, dos]) => (
          <li key={en}>
            <b>{en}</b>
            <span>{ko}</span>
            <p>{def}</p>
            {/* ⚠️ 중첩 ul 로 두지 않는다 — `.ev-values li` 가 안쪽 li 에도 카드 테두리를 씌운다 */}
            <div className="ev-values__dos">
              {dos.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* 공고 카드는 여기(상세)에만 둔다. 목록(/event)은 행사 배너만 보여주고,
          "어떤 직군을 뽑는지"는 들어와서 확인하는 구조다.
          카드 자체가 지원 경로라 본문 중간에 CTA 버튼을 따로 두지 않는다. */}
      <div className="ev-jobs">
        <div className="ev-jobs__head">
          <h2>모집 중인 공고</h2>
          <span className="ev-jobs__count">{EVENT_JOBS.length}</span>
        </div>
        <ul className="ev-jobs__list ev-jobs__list--stack">
          {EVENT_JOBS.map((j) => (
            <li key={j.v}>
              <Link href={`/event/${e.slug}/jobs/${j.v}`} className="ev-jobcard">
                <span className="ev-jobcard__main">
                  <span className="ev-jobcard__org">슈퍼전자</span>
                  <span className="ev-jobcard__title">{j.l} 신입사원 모집</span>
                  <span className="ev-jobcard__meta">
                    <span>신입</span>
                    <span>
                      {applyRange(e)}
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
      </div>

      <h2>전형 절차</h2>
      <ol className="ev-flow">
        {EVENT_STEPS.map(([name, desc, when]) => (
          <li key={name}>
            <span className="ev-flow__dot">{name}</span>
            <span className="ev-flow__when">{when}</span>
            <p>{desc}</p>
          </li>
        ))}
      </ol>

      {/* 혜택은 전형 절차 바로 뒤에 둔다(2026-10-02 회의 순서). 전형을 다 읽은 다음이라
          '어디까지 하면 무엇을 받는지'가 단계와 바로 이어진다. */}
      <h2>참가 혜택</h2>
      {/* '지급' 열을 둔 이유 — 받는 시점과 경로를 표 밖 문장으로 빼 두면 표를 읽고도
          다시 찾아 내려가야 한다. 대상·혜택·지급을 한 줄에서 끝낸다.
          ⚠️ 수료증은 Finalist 에게만 준다(2026-09-29 확인). 완주자 전원 발급은
             05_시상물/상장-수료증-문구.md §2-A 에 안으로 남아 있을 뿐 채택되지 않았다.
          2026-10-02 회의: 쿠폰 100명 → 30명, Finalist 3인 → 2인(직군별 1인), 1인 50만원.
          2026-10-06: 지원자가 먼저 보는 순서대로 상금 → 수료증 → 오프라인 검사 참여로 다시 적었다.
                      말은 '상금'으로 통일한다 — 기획안(p.4·p.20·p.28)·보도자료가 전부 '상금'이고,
                      '상여금'은 입사 후 급여로 읽혀 가상기업 설정이 오히려 헷갈린다.
                      수여물 표기는 '슈퍼코더 공식 수료증' 하나로 줄였다. 상장은 기획안 p.28 에 남아 있지만
                      표에서는 대표 수여물 하나만 적는다 — 셀이 길어지면 세 혜택이 한눈에 안 들어온다. */}
      <div className="post-table-wrap">
        <table className="post-table">
          <thead>
            <tr>
              <th>대상</th>
              <th>혜택</th>
              <th>지급</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>직무 AI 면접까지 성실히 마친 선착순 30명</td>
              <td>스타벅스 모바일 쿠폰 5,000원권</td>
              <td>11월 13일 · 문자</td>
            </tr>
            <tr>
              <td>Finalist 2인 (직군별 1인)</td>
              <td>상금 각 50만원 · 슈퍼코더 공식 수료증 · 오프라인 AI 역량 검사 참여</td>
              <td>11월 14일 · 현장</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* 표 아래 보조 설명 — 표 본문보다 작게 둔다(.ev-notes). 유의사항의 post-list 는 그대로다 */}
      {/* 표의 행 순서(쿠폰 → Finalist)를 따른다 */}
      <ul className="post-list ev-notes">
        <li>선착순은 지원서를 낸 순서가 아니라 직무 AI 면접을 끝까지 성실히 마친 시각을 기준으로 합니다.</li>
        <li>{FINALIST_RULE}</li>
      </ul>

      <h2>자주 묻는 질문</h2>
      <div className="ev-faq">
        {faqs(e).map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <hr className="post-hr" />

      <h2 id="apply-notice">유의사항</h2>
      <ul className="post-list">
        <li>
          {FICTION_NOTICE} 본 행사는 슈퍼코더가 주최합니다.
        </li>
        <li>
          지원서에 적어 주신 정보는 참가 자격 확인, 안내 발송, Finalist 선발, 행사 결과 정리에만 씁니다. 2027년
          2월 28일까지 모두 지웁니다.
        </li>
        <li>
          직무 AI 면접 답변은 결과를 검토하고 집계하는 데 씁니다. 누구 답변인지 알 수 없게 처리해 콘텐츠에
          쓰는 것은 지원서에서 따로 동의를 받고, 동의하지 않아도 참가에는 지장이 없습니다.
        </li>
        {/* 2026-10-06: 촬영은 Finalist 2인의 '시상식 후 인터뷰' 한 자리로 한정한다.
            검사 중이나 상장 수여 장면까지 적어 두면 동의 범위가 현장 전체로 넓어진다.
            영상은 찍지 않고, 동의는 Finalist 확정 후가 아니라 지원서에서 [필수] 항목으로 미리 받는다
            (apply/CareerApply.tsx 의 consent_photo).
            ⚠️ 필수로 바뀌었으므로 '동의하지 않아도 참여할 수 있다'는 문장을 두면 안 된다 — 폼과 어긋난다. */}
        <li>
          11월 14일 현장에서는 Finalist 2인이 시상식을 마친 뒤 참가자 인터뷰와 사진 촬영을 진행합니다. 영상은 찍지
          않습니다. 이 사진과 이름·소속을 홍보에 쓰는 것은 지원서에서 필수 항목으로 동의를 받습니다.
        </li>
        <li>
          중복 지원, 사실과 다르게 적은 지원서, 참가 대상이 아닌 신청은 취소되고 다음 순서로 넘어갑니다. 쿠폰은
          지원서에 적은 휴대폰 번호로 보냅니다. 번호를 잘못 적어 못 받으셨다면 11월 27일까지 알려 주세요.
        </li>
        {/* 사이드 패널에서 문의 행을 뺐으므로 연락처는 여기가 유일하다 — 지우면 페이지에서 사라진다 */}
        <li>문의 · {e.contact}</li>
      </ul>
    </>
  );
}

/* 지원 버튼 — 사이드 패널 · 하단 배너 · 좁은 화면 하단 바가 같이 쓴다.
   모집 전에는 여는 날을 적는다. 예전엔 '지원 신청하기'를 눌러 도착한 화면이
   '아직 접수 전입니다'라 지원자가 막힌 느낌을 받았다(2026-09-30).
   openBefore — 모집 전에도 누를 수 있게 둔다. 슈퍼전자 공고 목록은 오픈 전에도 볼 수 있어야 해서
   사이드 패널만 켠다. 하단 배너·하단 바는 비활성 그대로다.
   문구는 '공고 미리 보기' — 날짜만 적어 두면 누르면 무엇이 나오는지 알 수 없다. */
function ApplyCta({
  e, status, className = "", openBefore = false,
}: { e: EventItem; status: EventStatus; className?: string; openBefore?: boolean }) {
  if (status === "upcoming" && openBefore) {
    return (
      <Link href={e.applyUrl} className={`btn btn-blue ${className}`}>
        공고 미리 보기 <i className="fa-solid fa-arrow-right"></i>
      </Link>
    );
  }
  if (status === "upcoming") {
    return (
      <span className={`btn ev-btn-off ${className}`} aria-disabled="true">
        {openLabel(e, "long")}
      </span>
    );
  }
  return (
    <Link href={e.applyUrl} className={`btn btn-blue ${className}`}>
      지원 신청하기 <i className="fa-solid fa-arrow-right"></i>
    </Link>
  );
}

const BODIES: Record<string, (p: { e: EventItem; dday: string }) => React.ReactElement> = {
  "ai-mock-challenge-2026": MockChallengeBody,
};


export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = findEvent(slug);
  const Body = e ? BODIES[e.slug] : undefined;
  if (!e || !Body) notFound();

  const status = statusOf(e);
  // 공고 카드 칩(short)과 지원 패널·하단 바(long). revalidate 120 이라 날짜가 바뀌어도 2분 안에 따라온다.
  const dday = ddayLabel(e);
  const ddayLong = ddayLabel(e, "long");

  const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.excerpt,
    startDate: e.applyStart,
    endDate: "2026-11-14",
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

      {/* 데스크톱 1440 기준 레이아웃.
          읽기 폭 하나로만 두면 1440에서 양옆이 비고 지원 버튼이 스크롤 밖으로 밀린다.
          히어로(전체 폭) + 본문·사이드바 2단(1180 컨테이너)으로 잡고,
          사이드바에 일정과 지원 버튼을 붙여 스크롤 내내 따라오게 한다. */}
      {/* ⚠️ header 태그로 쓰면 안 된다 — globals.css 의 GNB 규칙이 태그 선택자(header, header:hover)라
          position:sticky 와 hover 배경(흰색)까지 그대로 먹는다. 마우스를 올리면 흰 배경이 덮여
          흰 글씨가 통째로 사라졌다(2026-09-28). */}
      <section
        className={`ev-hero${e.cover ? " ev-hero--img" : ""}`}
        /* 배경 이미지는 CSS 변수로 넘긴다 — 미디어쿼리에서 모바일 이미지로 갈아끼우려면
           background-image 를 인라인으로 박으면 안 된다(인라인이 항상 이긴다). */
        style={
          e.cover
            ? ({
                "--ev-hero-img": `url(${e.cover})`,
                "--ev-hero-img-m": `url(${e.coverMobile || e.cover})`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className="ev-hero__inner">
          {/* 행사가 한 건뿐이면 /event 가 이 페이지로 되돌려 보내므로(목록 건너뛰기) 링크를 숨긴다 —
              누르면 제자리로 돌아오는 링크가 된다. 두 건 이상이면 자동으로 다시 나온다.
              div 자체를 조건부로 둔다 — 비어 있어도 margin-bottom 24px 이 그대로 남는다. */}
          {EVENTS.length > 1 && (
            <div className="ev-hero__top">
              <Link href="/event" className="ev-hero__back">
                <i className="fa-solid fa-arrow-left"></i> 이벤트 목록
              </Link>
            </div>
          )}
          {/* 가상기업 로고 — 히어로 왼쪽 위 빈자리에 둔다. 제목 블록은 아래에 붙어 있어 밀리지 않는다.
              로고만 둔다 — 옆에 글자를 붙이지 않는다(2026-09-30).
              ⚠️ 바로 위 GNB 의 Supercoder 로고와 심볼·서체가 같다. 흰색 반전형이라 구분되는 것이므로
                 파란 원색 로고로 바꾸지 않는다. */}
          {e.brandLogo && (
            <div className="ev-hero__brand">
              <img src={e.brandLogo.src} alt={e.brandLogo.alt} width={e.brandLogo.width} height={e.brandLogo.height} />
            </div>
          )}
          <div className="ev-hero__body">
            {/* 상태 뱃지('모집 예정'·'모집 중')는 뺐다(2026-10-06).
                첫 화면에서 가장 먼저 읽히는 자리인데 '모집 예정'이 '아직 아니다'로 읽혀
                제목보다 먼저 사람을 돌려보냈다. 상태는 오른쪽 패널 칩('10월 8일 모집 시작'·'D-n'·'마감')과
                좁은 화면 하단 바가 말한다. */}
            <h1 className="ev-hero__title">{e.title}</h1>
            <p className="ev-hero__excerpt">{e.lead ?? e.excerpt}</p>
            {/* 가상기업 고지 — 요약 문장의 '슈퍼전자' 바로 아래에 둔다. 유의사항까지 내려가야
                가상 기업인 걸 알던 문제를 첫 화면에서 끝낸다(2026-10-02). 전문은 유의사항에 그대로 있다 */}
            {e.heroNote && (
              <p className="ev-hero__note">
                <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
                {e.heroNote}
              </p>
            )}
            {/* 공유 버튼은 메타 줄 끝에 둔다. 히어로 오른쪽 위에 얹으면 제목으로 내려가는
                시선을 먼저 가로채고, 마미톡처럼 오른쪽 끝으로 밀면 밝은 그래픽 위에 놓여
                흰 아이콘이 보이지 않는다. 읽는 순서(제목 → 요약 → 메타)의 끝이자
                배경이 짙은 자리가 여기다. */}
            <div className="ev-hero__meta">
              <span>주최 슈퍼코더</span>
              {/* 대상과 제한 없음을 붙여 둔다 — 둘 다 '누가 지원할 수 있나' 에 대한 답이다 */}
              <span>대학·대학원 재학생 및 졸업생</span>
              <span>전공·학년 제한 없음</span>
              <span>참가비 무료</span>
              <ShareButton
                path={`/event/${e.slug}`}
                title={`${e.title} 참가자 모집`}
                text={e.excerpt}
                campaign={e.slug}
                position="hero"
                variant="text"
                icon="link"
                label="공유하기"
              />
            </div>
          </div>
        </div>
      </section>

      <article className="ev-detail">
        <div className="ev-detail__main">
          <div className="post-content">
            <Body e={e} dday={dday} />
          </div>

          <aside className="post-cta">
            <p className="post-cta__label">
              <i className="fa-solid fa-circle-check"></i> {e.title}
            </p>
            <h2 className="post-cta__title">첫 AI 면접을 실전에서 보지 마세요.</h2>
            {/* 기간은 시작·마감을 함께 쓴다 — 마감만 쓰면 모집 전에 읽는 사람이 지금 지원할 수 있는지 모른다 */}
            <p className="post-cta__desc">
              참가비는 없고 전공·학년 제한도 없습니다.
              <br />
              {applyPeriodLabel(e)}
            </p>
            <div className="post-cta__actions">
              <ApplyCta e={e} status={status} />
              <Link href="/" className="btn btn-out">
                슈퍼코더 AI면접 알아보기
              </Link>
            </div>
          </aside>
        </div>

        {/* 스크롤을 따라오는 지원 패널 — 일정과 지원 버튼을 항상 손 닿는 곳에 둔다.
            1080 아래에서는 통째로 사라지고 아래 .ev-bar 가 지원 버튼을 대신 받는다. */}
        <aside className="ev-detail__side">
          <div className="ev-side">
            {/* 상태 글자('모집 예정')는 뺐다 — 옆 칩이 이미 '10월 6일 모집 시작'·'D-n'·'마감'으로 상태를 말한다 */}
            <div className="ev-side__head">
              <span className="ev-tag ev-tag--dday">{ddayLong}</span>
            </div>
            <dl className="ev-side__list">
              <div>
                <dt>모집</dt>
                <dd>
                  {e.applyFrom}
                  <br />~ {withoutYear(e.applyTo)}
                </dd>
              </div>
              <div>
                {/* 아래 '오프라인 AI 역량 검사' 와 짝이 되게 '온라인'을 붙이고 같은 자리에서 끊는다 */}
                <dt>
                  온라인
                  <br />
                  직무 AI 면접
                </dt>
                <dd>{withoutYear(e.interview)}</dd>
              </div>
              <div>
                <dt>Finalist 발표</dt>
                <dd>{withoutYear(e.announce)}</dd>
              </div>
              {/* 참가비 행은 뺐다 — 이 목록은 일정이고, 무료라는 말은 히어로 메타와 하단 배너에 있다 */}
              <div>
                {/* 라벨 칸(108px)에 한 줄로 들지 않아 '검사'만 떨어졌다. 전형 절차 원과 같은 자리에서 끊는다 */}
                <dt>
                  오프라인
                  <br />
                  AI 역량 검사
                </dt>
                <dd>{withoutYear(e.final)}</dd>
              </div>
            </dl>
            <ApplyCta e={e} status={status} className="ev-side__cta" openBefore />
            <p className="ev-side__note">한 직군만 선택해 지원합니다.</p>
          </div>
        </aside>
      </article>

      {/* 좁은 화면 하단 고정 바 — 오른쪽 패널이 사라진 자리를 받는다.
          공고 상세(.jd-bar)와 같은 구조·높이로 둬서 두 페이지의 손 위치가 같다. */}
      <div className="ev-bar">
        <div className="ev-bar__info">
          <b>{ddayLong}</b>
          <span>{STATUS_LABEL[status]} · 참가비 무료</span>
        </div>
        {status === "closed" ? (
          <span className="ev-bar__off">접수 마감</span>
        ) : (
          <ApplyCta e={e} status={status} />
        )}
      </div>
    </>
  );
}
