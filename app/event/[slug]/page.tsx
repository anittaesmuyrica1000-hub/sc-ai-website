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
  STATUS_LABEL,
  type EventItem,
} from "@/lib/events";
import { EVENT_JOBS, EVENT_STEPS, EVENT_VALUES, COMPANY_INTRO, FICTION_NOTICE } from "@/lib/eventApply";
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

   ⚠️ 사실관계의 출처는 03_회의자료/2026-슈퍼전자-AI면접챌린지-기획안.pptx 다.
      고칠 때 함께 지켜야 하는 제약 세 가지:
      1) 문항 수·소요시간을 쓰지 않는다 — "5문항", "약 O분" 금지(slide 14).
      2) 모델 직무의 설계 근거가 된 실존 기업명을 쓰지 않는다(slide 13).
      3) 가상기업 고지는 고정 문구다. 포스터·지원 폼·보도자료와 같은 문장을 쓴다(slide 4). */

/* 자주 묻는 질문 — 7문에서 5문으로 줄였다.
   뺀 것: "참가비가 있나요"(히어로 메타·사이드 패널·하단 지원 배너에 이미 나온다),
         "전공·학년 제한"(반도체 문항에 합쳤다). */
const FAQS = [
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
    "1차 직무 AI 면접은 온라인으로 진행하며, 응시 기간 안에서 원하는 시간을 골라 응시합니다. 자격증이나 스펙을 직접 묻는 대신 직무 역량에 연결된 본인의 경험을 질문하고, 답변에 따라 후속 질문이 이어집니다. 답변 시간에 제한은 없습니다.",
  ],
  ["두 직군에 모두 지원할 수 있나요?", "한 직군만 선택해 지원할 수 있습니다."],
  [
    "2차 인재상 AI 면접에 꼭 참석해야 하나요?",
    "1차 직무 AI 면접까지만 참여하셔도 괜찮습니다. 2차 인재상 AI 면접은 선발된 Finalist 3인을 대상으로 오프라인에서 진행하며, 지원서에서 참석 가능 여부를 미리 확인합니다.",
  ],
];

/* ⚠️ 이 페이지는 '행사 전체', 공고 상세(/jobs/[job])는 '직군 하나'를 맡는다.
   직군별 하는 일·자격·우대사항은 공고 상세에만 둔다 — 두 곳에 같은 문장을 두면 반드시 어긋난다.
   그래서 여기서 뺀 것: 모집 직군(931px), 모집 요강 표(586px).
   모집 요강의 항목은 전부 다른 자리에 있다 — 일정·참가비·문의는 사이드 패널,
   참가 대상·주최는 히어로 메타, 전형은 아래 전형 절차, 지원 자격은 공고 상세 자격요건. */
function MockChallengeBody({ e, dday }: { e: EventItem; dday: string }) {
  return (
    <>
      {/* 제목은 전부 명사형으로 맞춘다(행사 소개 · 전형 절차 · 참가 혜택 …) */}
      <h2>행사 소개</h2>
      <p>
        실제 채용에서 AI 면접을 처음 만나는 경우가 많습니다. 무엇을 어떻게 말해야 할지 모른 채로 첫 전형을 치르면,
        답변 내용과 무관한 이유로 실력을 보이지 못하게 됩니다.
      </p>
      <p>
        슈퍼코더는 취업 전에 AI 면접을 실전처럼 겪어 볼 자리를 만들었습니다. 이 행사를 위해 만든 가상기업 슈퍼전자의
        채용 전형을 지원서부터 2차 면접까지 그대로 진행합니다.
      </p>
      <p>결과는 어떠한 기업의 채용에도 영향을 주지 않습니다. 연습용으로 편하게 보셔도 됩니다.</p>

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

      <h2>슈퍼전자와 인재상</h2>
      <p>{COMPANY_INTRO}</p>
      <p className="post-src">
        기업을 상대로 파는 회사라 &lsquo;고객이 누구인가&rsquo;를 묻는 질문이 자연스럽게 나옵니다. 다만 반도체 지식은
        묻지 않습니다. 2차 인재상 AI 면접은 아래 네 가지를 기준으로 진행합니다.
      </p>
      <ul className="ev-values">
        {EVENT_VALUES.map(([en, ko, def]) => (
          <li key={en}>
            <b>{en}</b>
            <span>{ko}</span>
            <p>{def}</p>
          </li>
        ))}
      </ul>

      {/* 혜택은 인재상 뒤, FAQ 앞에 둔다. 앞쪽(전형 바로 뒤)에 두면 혜택이 먼저 읽혀
          '쿠폰 받는 행사'로 보이고, 더 뒤로 밀면 지원 여부를 정할 때 보지 못한다. */}
      <h2>참가 혜택</h2>
      {/* '지급' 열을 둔 이유 — 받는 시점과 경로를 표 밖 문장으로 빼 두면 표를 읽고도
          다시 찾아 내려가야 한다. 대상·혜택·지급을 한 줄에서 끝낸다.
          ⚠️ 수료증은 Finalist 3인에게만 준다(2026-09-29 확인). 완주자 전원 발급은
             05_시상물/상장-수료증-문구.md §2-A 에 안으로 남아 있을 뿐 채택되지 않았다. */}
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
              <td>1차 직무 AI 면접 완료 선착순 100명</td>
              <td>스타벅스 모바일 쿠폰 5,000원권</td>
              <td>11월 13일 · 문자</td>
            </tr>
            <tr>
              <td>Finalist 3인</td>
              <td>슈퍼코더 주최 상장·수료증, 2차 인재상 AI 면접 참여, 교통 실비 3만원</td>
              <td>11월 20일 · 현장</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* 표 아래 보조 설명 — 표 본문보다 작게 둔다(.ev-notes). 유의사항의 post-list 는 그대로다 */}
      <ul className="post-list ev-notes">
        <li>Finalist 3인은 마케팅 부문 1인, 개발 부문 1인, 전체 부문 1인으로 선발합니다.</li>
        <li>선착순은 1차 직무 AI 면접을 끝까지 마친 시각을 기준으로 합니다.</li>
      </ul>

      <h2>자주 묻는 질문</h2>
      <div className="ev-faq">
        {FAQS.map(([q, a]) => (
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
          1차 직무 AI 면접 답변은 결과를 검토하고 집계하는 데 씁니다. 누구 답변인지 알 수 없게 처리해 콘텐츠에
          쓰는 것은 지원서에서 따로 동의를 받고, 동의하지 않아도 참가에는 지장이 없습니다.
        </li>
        <li>
          11월 20일 현장에서는 면접과 인터뷰, 상장 받는 장면을 사진·영상으로 찍습니다. 이 사진·영상과 이름·소속을
          홍보에 쓰는 것은 Finalist가 정해진 뒤 따로 동의를 받고, 동의하지 않아도 그대로 참여하실 수 있습니다.
        </li>
        <li>
          중복 지원, 사실과 다르게 적은 지원서, 참가 대상이 아닌 신청은 취소되고 다음 순서로 넘어갑니다. 쿠폰은
          지원서에 적은 휴대폰 번호로 보냅니다. 번호를 잘못 적어 못 받으셨다면 11월 27일까지 알려 주세요.
        </li>
      </ul>
    </>
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
          <div className="ev-hero__body">
            <span className="ev-hero__status">{STATUS_LABEL[status]}</span>
            <h1 className="ev-hero__title">{e.title}</h1>
            <p className="ev-hero__excerpt">{e.excerpt}</p>
            {/* 공유 버튼은 메타 줄 끝에 둔다. 히어로 오른쪽 위에 얹으면 제목으로 내려가는
                시선을 먼저 가로채고, 마미톡처럼 오른쪽 끝으로 밀면 밝은 그래픽 위에 놓여
                흰 아이콘이 보이지 않는다. 읽는 순서(제목 → 요약 → 메타)의 끝이자
                배경이 짙은 자리가 여기다. */}
            <div className="ev-hero__meta">
              <span>주최 슈퍼코더</span>
              <span>대학·대학원 재학생 및 졸업생</span>
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
            <p className="post-cta__desc">
              참가비는 없고 전공·학년 제한도 없습니다. {e.applyTo}까지 지원할 수 있습니다.
            </p>
            <div className="post-cta__actions">
              <Link href={e.applyUrl} className="btn btn-blue">
                지원 신청하기 <i className="fa-solid fa-arrow-right"></i>
              </Link>
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
            <div className="ev-side__head">
              <span className="ev-tag ev-tag--dday">{dday}</span>
              <span className="ev-side__status">{STATUS_LABEL[status]}</span>
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
                <dt>1차 직무 AI 면접</dt>
                <dd>{withoutYear(e.interview)}</dd>
              </div>
              <div>
                <dt>Finalist 발표</dt>
                <dd>{withoutYear(e.announce)}</dd>
              </div>
              <div>
                <dt>2차 인재상 AI 면접</dt>
                <dd>{withoutYear(e.final)}</dd>
              </div>
              <div>
                <dt>참가비</dt>
                <dd>무료</dd>
              </div>
              <div>
                <dt>문의</dt>
                <dd>{e.contact}</dd>
              </div>
            </dl>
            <Link href={e.applyUrl} className="btn btn-blue ev-side__cta">
              지원 신청하기 <i className="fa-solid fa-arrow-right"></i>
            </Link>
            <p className="ev-side__note">한 직군만 선택해 지원합니다.</p>
          </div>
        </aside>
      </article>

      {/* 좁은 화면 하단 고정 바 — 오른쪽 패널이 사라진 자리를 받는다.
          공고 상세(.jd-bar)와 같은 구조·높이로 둬서 두 페이지의 손 위치가 같다. */}
      <div className="ev-bar">
        <div className="ev-bar__info">
          <b>{dday}</b>
          <span>{STATUS_LABEL[status]} · 참가비 무료</span>
        </div>
        {status === "closed" ? (
          <span className="ev-bar__off">접수 마감</span>
        ) : (
          <Link href={e.applyUrl} className="btn btn-blue">
            지원 신청하기 <i className="fa-solid fa-arrow-right"></i>
          </Link>
        )}
      </div>
    </>
  );
}
