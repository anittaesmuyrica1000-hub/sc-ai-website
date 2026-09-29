import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../../event.css";
import "../jobs.css";
import ShareButton from "@/components/ShareButton";
import { EVENTS, findEvent, statusOf, ddayLabel, withoutYear, applyRange, STATUS_LABEL } from "@/lib/events";
import {
  EVENT_JOBS,
  EVENT_STEPS,
  EVENT_VALUES,
  FICTION_NOTICE,
  COMPANY_INTRO,
  JOB_DETAIL_EVENT,
  findJob,
} from "@/lib/eventApply";
import { buildPageMetadata } from "@/lib/pageSeo";

/* 가상기업 슈퍼전자의 채용공고 상세.
   공고 목록(/apply) → 이 화면 → 지원서(/apply?job=) 순서다. 실제 채용 사이트가 그렇고,
   지원자가 겪는 것이 '이벤트 신청'이 아니라 '채용 지원'이어야 행사의 전제가 산다.

   ⚠️ 이 화면에 쓰면 안 되는 것(기획안 제약):
      · 문항 수·소요시간 — "5문항", "약 O분" (slide 14)
      · 모델 직무의 설계 근거가 된 실존 기업명 (slide 13)
      · 합격·입사·연봉·처우 (브랜드북 §6 표현 게이트)

   ⚠️ JobPosting 구조화 데이터를 넣지 않는다.
      가상기업의 공고가 Google for Jobs에 실제 채용으로 등록되면 정책 위반이고,
      구직자가 실재하지 않는 자리에 지원하게 된다. Event 스키마는 행사 안내 페이지가 갖는다. */

export const revalidate = 120;

export function generateStaticParams() {
  return EVENTS.filter((e) => e.slug === JOB_DETAIL_EVENT).flatMap((e) =>
    EVENT_JOBS.map((j) => ({ slug: e.slug, job: j.v }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; job: string }>;
}): Promise<Metadata> {
  const { slug, job } = await params;
  const e = findEvent(slug);
  const j = findJob(job);
  if (!e || !j) return { title: "공고를 찾을 수 없습니다" };

  const title = `${j.l} 신입사원 모집 · ${e.title}`;
  // ⚠️ 카톡 공유 카드에 "슈퍼전자 채용"만 보이면 실제 채용으로 오인된다.
  //    제목과 설명 양쪽에 행사명과 주최 표기를 함께 둔다.
  const description = `가상기업 슈퍼전자의 채용 전형을 지원서부터 2차 면접까지. 참가비 무료, 전공·학년 제한 없음. ${e.applyTo}까지 접수. 주최 슈퍼코더`;
  const url = `/event/${e.slug}/jobs/${j.v}`;
  const fallback: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      // TODO(포스터 확정 후): 직군별 OG 이미지 2종으로 교체한다
      images: [{ url: "/og-image.png?v=3", width: 1200, height: 630 }],
    },
  };
  return buildPageMetadata(url, fallback);
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string; job: string }>;
}) {
  const { slug, job } = await params;
  const e = findEvent(slug);
  const j = findJob(job);
  if (!e || !j || e.slug !== JOB_DETAIL_EVENT) notFound();

  const status = statusOf(e);
  const dday = ddayLabel(e);
  const open = status === "open";
  const other = EVENT_JOBS.find((x) => x.v !== j.v);
  const listUrl = `/event/${e.slug}/apply`;
  const applyUrl = `${e.applyUrl}?job=${j.v}`;
  const share = {
    path: `/event/${e.slug}/jobs/${j.v}`,
    title: `${j.l} 신입사원 모집 · ${e.title}`,
    text: "가상기업 슈퍼전자의 채용 전형을 그대로. 참가비 무료, 전공·학년 제한 없습니다.",
    campaign: e.slug,
    content: j.v,
  };

  // 상태별 지원 버튼.
  // 모집 전에도 지원서로 보낸다 — 입력이 잠긴 폼을 미리 볼 수 있게 열어 뒀다.
  // 마감 뒤에만 누를 것을 주지 않고 이유를 쓴다.
  const upcoming = status === "upcoming";
  const ctaLabel = open ? "지원하기" : "지원서 미리 보기";

  return (
    <div className="jd-page">
      {/* ⚠️ header 태그로 쓰면 안 된다 — globals.css 의 GNB 규칙이 태그 선택자라
          position:sticky 와 hover 배경까지 그대로 먹는다. */}
      <section className="jd-head">
        <div className="jd-head__inner">
          <div className="jd-head__top">
            <Link href={listUrl} className="jd-back">
              <i className="fa-solid fa-arrow-left"></i> 공고 목록
            </Link>
            <ShareButton {...share} position="header" variant="icon" label="이 공고 링크 공유하기" />
          </div>

          <h1 className="jd-title">{j.l} 신입사원 모집</h1>
          <p className="jd-org">슈퍼전자</p>

          <div className="jd-meta">
            <span className="ev-tag ev-tag--dday">{dday}</span>
            <span className="jd-meta__dates">
              {applyRange(e)}
            </span>
            <span>신입</span>
            <span>서울</span>
            <span>학력·전공 무관</span>
          </div>
        </div>
      </section>

      <article className="jd">
        <div className="jd__main">
          {/* 고지는 본문 맨 위에 둔다 — 접히거나 아래로 밀리면 고지가 아니다 */}
          <div className="jd-notice">
            <i className="fa-solid fa-circle-info"></i>
            <span>
              <b>안내</b> {FICTION_NOTICE}
            </span>
          </div>

          {/* 섹션 제목은 실제 기업 채용공고의 라벨을 쓴다 — 공고소개 · 주요업무 · 자격요건 · 우대사항 · 채용절차.
              지원자가 이미 다른 공고에서 읽어 본 순서라 어디에 무엇이 있는지 찾지 않아도 된다. */}
          <section className="jd-sec jd-sec--first">
            <h2>공고소개</h2>
            <p className="jd-intro">{j.intro}</p>
          </section>

          <section className="jd-sec">
            <h2>주요업무</h2>
            <ul className="jd-list">
              {j.duties.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>

          <section className="jd-sec">
            <h2>이런 분을 찾습니다</h2>
            <ul className="jd-list">
              {j.evaluates.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="jd-sec">
            <h2>자격요건</h2>
            <ul className="jd-list">
              <li>취업을 준비하고 있는 대학·대학원 재학생 및 졸업생</li>
              <li>전공, 학년, 졸업 시기 제한 없음</li>
              <li>두 직군 중 한 곳에만 지원할 수 있습니다</li>
            </ul>
          </section>

          <section className="jd-sec">
            <h2>우대사항</h2>
            <p>
              <b>없습니다.</b> {j.notFor} 무엇을 갖췄는지가 아니라 무엇을 해 봤는지를 묻고, 답변으로 판단합니다.
            </p>
          </section>

          <section className="jd-sec">
            <h2>채용절차</h2>
            <ol className="ev-flow">
              {EVENT_STEPS.map(([name, desc, when]) => (
                <li key={name}>
                  <span className="ev-flow__dot">{name}</span>
                  <span className="ev-flow__when">{when}</span>
                  <p>{desc}</p>
                </li>
              ))}
            </ol>
            <p className="jd-note">
              1차 직무 AI 면접은 응시 기간 안에서 원하는 시간을 골라 응시합니다. 자격증이나 스펙을 직접 묻지 않고 직무
              역량에 연결된 본인의 경험을 질문하며, 답변에 따라 후속 질문이 이어집니다. 답변 시간에 제한은 없습니다.
            </p>
          </section>

          <section className="jd-sec">
            <h2>회사소개</h2>
            <p>{COMPANY_INTRO}</p>
            <h3>인재상</h3>
            <p className="jd-note">2차 인재상 AI 면접은 아래 네 가지를 기준으로 진행합니다.</p>
            <ul className="ev-values">
              {EVENT_VALUES.map(([en, ko, def]) => (
                <li key={en}>
                  <b>{en}</b>
                  <span>{ko}</span>
                  <p>{def}</p>
                </li>
              ))}
            </ul>
            <p className="jd-note">
              <Link href={`/event/${e.slug}`}>행사 안내에서 인재상 정의와 FAQ 보기</Link>
            </p>
          </section>

          <section className="jd-sec">
            <h2>참가 혜택</h2>
            <ul className="jd-list">
              <li>1차 직무 AI 면접 완료 선착순 100명 · 스타벅스 모바일 쿠폰 5,000원권</li>
              <li>Finalist 3인 · 슈퍼코더 주최 상장과 수료증, 2차 인재상 AI 면접 참여, 교통 실비 3만원</li>
            </ul>
          </section>

          {other && (
            <section className="jd-sec">
              <h2>다른 공고</h2>
              <Link href={`/event/${e.slug}/jobs/${other.v}`} className="jd-other">
                <span>
                  <b>{other.l} 신입사원 모집</b>
                  <em>{other.desc}</em>
                </span>
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </Link>
            </section>
          )}

          <section className="jd-sec jd-sec--last">
            <h2>유의사항</h2>
            <ul className="jd-list">
              <li>
                <b>{FICTION_NOTICE}</b> 본 행사는 슈퍼코더가 주최합니다.
              </li>
              <li>
                지원서에 적어 주신 정보는 참가 자격 확인, 행사 안내와 면접 링크 발송, 참가 혜택 발송, Finalist
                선발과 안내, 행사 운영 통계 작성에만 사용하며 2027년 2월 28일까지 전량 파기합니다.
              </li>
              <li>문의 · {e.contact}</li>
            </ul>
            <p className="jd-note">
              <Link href={`/event/${e.slug}#apply-notice`}>유의사항 전문 보기</Link>
            </p>
          </section>
        </div>

        {/* 스크롤을 따라오는 지원 패널 — 일정과 지원 버튼을 항상 손 닿는 곳에 둔다.
            .ev-side 는 행사 안내 페이지와 같은 컴포넌트다(event.css). */}
        <aside className="jd__side">
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
                <dt>
                  1차 직무
                  <br />
                  AI 면접
                </dt>
                <dd>{withoutYear(e.interview)}</dd>
              </div>
              <div>
                <dt>Finalist 발표</dt>
                <dd>{withoutYear(e.announce)}</dd>
              </div>
              <div>
                <dt>
                  2차 인재상
                  <br />
                  AI 면접
                </dt>
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
            {open || upcoming ? (
              <>
                <Link href={applyUrl} className={`btn ${open ? "btn-blue" : "btn-out"} ev-side__cta`}>
                  {ctaLabel} <i className="fa-solid fa-arrow-right"></i>
                </Link>
                {upcoming && <p className="jd-cta-note">{e.applyFrom}부터 제출할 수 있어요</p>}
              </>
            ) : (
              <p className="jd-cta-off">접수가 마감되었습니다</p>
            )}
            <div className="jd-side__share">
              <ShareButton {...share} position="side" variant="line" label="공고 공유하기" />
            </div>
          </div>
        </aside>
      </article>

      {/* 모바일 하단 고정 바 — 본문이 길어 사이드 패널이 화면 밖으로 나간 뒤를 받는다 */}
      <div className="jd-bar">
        <div className="jd-bar__info">
          <b>{dday}</b>
          <span>{j.l}</span>
        </div>
        {open || upcoming ? (
          <Link href={applyUrl} className={`btn ${open ? "btn-blue" : "btn-out"}`}>
            {open ? "지원하기" : "지원서 미리 보기"}
          </Link>
        ) : (
          <span className="jd-bar__off">접수 마감</span>
        )}
      </div>
    </div>
  );
}
