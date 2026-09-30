import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../../event.css";
import "../jobs.css";
import { EVENTS, findEvent, statusOf, ddayLabel, withoutYear, applyRange } from "@/lib/events";
import { EVENT_JOBS, FICTION_NOTICE, JOB_DETAIL_EVENT, findJob } from "@/lib/eventApply";
import { buildPageMetadata } from "@/lib/pageSeo";

/* 가상기업 슈퍼닉스의 채용공고 상세.
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
  // ⚠️ 카톡 공유 카드에 "슈퍼닉스 채용"만 보이면 실제 채용으로 오인된다.
  //    제목과 설명 양쪽에 행사명과 주최 표기를 함께 둔다.
  const description = `가상기업 슈퍼닉스의 채용 전형을 지원서부터 2차 면접까지. 참가비 무료, 전공·학년 제한 없음. ${e.applyTo}까지 접수. 주최 슈퍼코더`;
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
  // 제목 아래 칩은 short("10.06 오픈"), 지원 패널·하단 바는 long("10월 6일 모집 시작") — 행사 안내와 같다
  const dday = ddayLabel(e);
  const ddayLong = ddayLabel(e, "long");
  const open = status === "open";
  const other = EVENT_JOBS.find((x) => x.v !== j.v);
  const listUrl = `/event/${e.slug}/apply`;
  const applyUrl = `${e.applyUrl}?job=${j.v}`;
  // 상태별 지원 버튼.
  // 모집 전에도 지원서로 보낸다 — 입력이 잠긴 폼을 미리 볼 수 있게 열어 뒀다.
  // 마감 뒤에만 누를 것을 주지 않고 이유를 쓴다.
  const upcoming = status === "upcoming";
  const ctaLabel = open ? "지원 신청하기" : "지원서 미리 보기";

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
          </div>

          {/* 모의채용 고지 — 제목보다 먼저 둔다. 공고소개·팀 소개가 실제 공고처럼 구체적이라
              유의사항까지 내려가야 가상 기업인 걸 알던 문제를 막는다(2026-09-30) */}
          <p className="jd-mock">
            <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>
              이 공고는 모의채용 행사 <Link href={`/event/${e.slug}`}>{e.title}</Link>의 가상 공고입니다. 슈퍼닉스는 실제
              회사가 아닙니다.
            </span>
          </p>

          <h1 className="jd-title">{j.l} 신입사원 모집</h1>
          <p className="jd-org">슈퍼닉스</p>

          <div className="jd-meta">
            <span className="ev-tag ev-tag--dday">{dday}</span>
            <span className="jd-meta__dates">
              {applyRange(e)}
            </span>
            <span>신입</span>
            <span>학력·전공 무관</span>
          </div>
        </div>
      </section>

      <article className="jd">
        <div className="jd__main">
          {/* 이 화면은 '이 직군이 무슨 일을 하는가'만 맡는다. 채용절차·회사소개·인재상·참가 혜택은
              행사 안내(/event/[slug])에 있고, 두 곳에 같은 내용을 두면 반드시 한쪽이 먼저 낡는다.
              섹션 제목은 실제 기업 채용공고의 라벨을 쓴다 — 공고소개 · 주요업무 · 자격요건.
              읽고 나면 바로 지원서로 넘어가도록 중간에 다른 읽을거리를 두지 않는다. */}
          <section className="jd-sec jd-sec--first">
            <h2>공고소개</h2>
            <p className="jd-intro">{j.intro}</p>
          </section>

          <section className="jd-sec jd-team">
            <h2>팀 소개</h2>
            {j.teamIntro.map((para) => (
              <p key={para}>{para}</p>
            ))}
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
            {/* 이 목록은 1차 면접 채점의 직무 역량 기준과 짝이다(lib/eventApply.ts evaluates 주석).
                지원자에게도 그 연결을 말해 준다. 문항 수는 쓰지 않는다 */}
            <p className="jd-note">1차 직무 AI 면접에서 이 경험을 중심으로 질문합니다.</p>
          </section>

          <section className="jd-sec">
            <h2>자격요건</h2>
            <ul className="jd-list">
              <li>취업을 준비하고 있는 대학·대학원 재학생 및 졸업생</li>
              <li>전공, 학년, 졸업 시기 제한 없음</li>
              <li>두 직군 중 한 곳에만 지원할 수 있습니다</li>
            </ul>
            {/* 목록은 '되는 조건', 이 문장은 '보지 않는 것'. 반도체 회사 공고라 물러서기 쉬운 자리에 둔다 */}
            <p className="jd-note">{j.notFor}</p>
          </section>

          {other && (
            <section className="jd-sec">
              <h2>다른 공고</h2>
              {/* 두 공고를 다 열어 본 사람이 둘 다 낼 수 있다고 읽지 않게 카드 바로 위에서 한 번 더 말한다 */}
              <p className="jd-other-note">두 직군 중 한 곳에만 지원할 수 있고, 지원 후에는 직군을 바꿀 수 없습니다.</p>
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
              <li>{FICTION_NOTICE} 본 행사는 슈퍼코더가 주최합니다.</li>
              {/* 행사 안내(/event/[slug])의 유의사항과 같은 문장을 쓴다 — 한쪽만 고치면 어긋난다 */}
              <li>
                지원서에 적어 주신 정보는 참가 자격 확인, 안내 발송, Finalist 선발, 행사 결과 정리에만 씁니다.
                2027년 2월 28일까지 모두 지웁니다.
              </li>
              <li>문의 · {e.contact}</li>
            </ul>
            <p className="jd-note">
              <Link href={`/event/${e.slug}#apply-notice`} className="jd-more">
                유의사항 전문 보기 <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </Link>
            </p>
          </section>
        </div>

        {/* 스크롤을 따라오는 지원 패널 — 일정과 지원 버튼을 항상 손 닿는 곳에 둔다.
            .ev-side 는 행사 안내 페이지와 같은 컴포넌트다(event.css). */}
        <aside className="jd__side">
          <div className="ev-side">
            {/* 상태 글자('모집 예정')는 뺐다 — 칩 하나가 상태와 날짜를 함께 말한다. 행사 안내 패널과 같다 */}
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
                <dt>1차 직무 AI 면접</dt>
                <dd>{withoutYear(e.interview)}</dd>
              </div>
              <div>
                <dt>Finalist 발표</dt>
                <dd>{withoutYear(e.announce)}</dd>
              </div>
              {/* 참가비 행은 행사 안내 패널과 함께 뺐다 — 이 목록은 일정이다 */}
              <div>
                <dt>2차 인재상 AI 면접</dt>
                <dd>{withoutYear(e.final)}</dd>
              </div>
            </dl>
            {open || upcoming ? (
              <>
                {/* 모집 전이라도 파란 버튼으로 둔다 — 흰 버튼이면 패널에서 가장 먼저 눌러야 할 것이
                    보이지 않고, 행사 안내 상세의 지원 버튼(항상 파랑)과도 어긋난다.
                    '아직 제출할 수 없다'는 바로 아래 .jd-cta-note 가 말한다. */}
                <Link href={applyUrl} className="btn btn-blue ev-side__cta">
                  {ctaLabel} <i className="fa-solid fa-arrow-right"></i>
                </Link>
                {upcoming && <p className="jd-cta-note">{e.applyFrom}부터 제출할 수 있어요</p>}
              </>
            ) : (
              <p className="jd-cta-off">접수가 마감되었습니다</p>
            )}
          </div>
        </aside>
      </article>

      {/* 모바일 하단 고정 바 — 본문이 길어 사이드 패널이 화면 밖으로 나간 뒤를 받는다 */}
      <div className="jd-bar">
        <div className="jd-bar__info">
          <b>{ddayLong}</b>
          <span>{j.l}</span>
        </div>
        {open || upcoming ? (
          <Link href={applyUrl} className="btn btn-blue">
            {open ? "지원 신청하기" : "지원서 미리 보기"}
          </Link>
        ) : (
          <span className="jd-bar__off">접수 마감</span>
        )}
      </div>
    </div>
  );
}
