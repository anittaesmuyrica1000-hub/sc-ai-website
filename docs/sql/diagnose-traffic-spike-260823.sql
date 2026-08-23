-- 8/21~8/22 트래픽 급증이 사람인지 크롤러인지 판별 (2026-08-23 점검)
--
-- 배경: 8/21 43세션·8/22 30세션으로 평소(2~12)의 3~10배가 찍혔는데
--       참여율이 61% → 4.7%/3.3%로 폭락했다. 같은 날 서버측 조회는
--       8/21 200회(경로 27개) → 8/22 83회로 요동쳤고 GA4 포착률도 28% → 93%로 튀었다.
--       "배너 제거로 실방문자가 다 잡히기 시작했다"면 참여율이 이렇게까지 떨어질 이유가 없다.
--
-- 판별 원리: 사람과 크롤러는 '경로 분포 모양'이 다르다.
--   · 사람   → 랜딩(/)과 특정 글 몇 개에 조회가 몰린다. 경로당 평균 조회수가 높다.
--   · 크롤러 → 사이트맵을 따라 오래된 글까지 골고루 1~2회씩 훑는다.
--             경로 수가 급증하고 경로당 평균이 1에 수렴한다.
--
-- 실행: Supabase 대시보드 → SQL Editor에 붙여넣고 실행.
--       읽기 전용(select)이라 데이터가 바뀌지 않는다. ①~④ 결과를 그대로 회신하면 된다.


-- ────────────────────────────────────────────────────────────
-- ① 일자별 요약 — 급증일의 '모양'을 한눈에
--    views_per_path 가 8/21에만 1에 가깝게 떨어지면 크롤러 신호.
--    반대로 평소와 비슷하거나 더 높으면 실제 방문 증가 쪽.
-- ────────────────────────────────────────────────────────────
select
  view_date,
  sum(count)                                                       as views,
  count(distinct path)                                             as paths,
  round(sum(count)::numeric / nullif(count(distinct path), 0), 2)   as views_per_path,
  max(count)                                                       as top_path_views,
  -- 상위 1개 경로가 전체에서 차지하는 비중. 사람일수록 높다(랜딩 쏠림).
  round(100.0 * max(count) / nullif(sum(count), 0), 1)             as top_path_pct
from public.page_views
where view_date between date '2026-08-13' and date '2026-08-23'
group by view_date
order by view_date;


-- ────────────────────────────────────────────────────────────
-- ② 8/20·8/21·8/22 경로별 대조 — 급증분이 어디서 왔나
--    d21 열에만 값이 서고 d20·d22가 비어 있는 경로가 우수수 나오면
--    = 그날 하루만 훑고 간 크롤러. 특히 오래된 블로그 글이 줄줄이 뜨는지 본다.
-- ────────────────────────────────────────────────────────────
select
  path,
  coalesce(sum(count) filter (where view_date = date '2026-08-20'), 0) as d20,
  coalesce(sum(count) filter (where view_date = date '2026-08-21'), 0) as d21,
  coalesce(sum(count) filter (where view_date = date '2026-08-22'), 0) as d22
from public.page_views
where view_date between date '2026-08-20' and date '2026-08-22'
group by path
order by d21 desc, d22 desc
limit 60;


-- ────────────────────────────────────────────────────────────
-- ③ 8/21 하루만 등장한 경로의 규모
--    onlyday_paths 가 전체 경로의 큰 비중이고 onlyday_views 가 1~2회씩이면
--    크롤러가 확정적이다.
-- ────────────────────────────────────────────────────────────
with d21 as (
  select path, sum(count) as c from public.page_views
  where view_date = date '2026-08-21' group by path
),
other as (
  select distinct path from public.page_views
  where view_date in (date '2026-08-19', date '2026-08-20', date '2026-08-22')
)
select
  count(*)                                          as onlyday_paths,
  sum(d21.c)                                        as onlyday_views,
  round(avg(d21.c), 2)                              as avg_views_per_onlyday_path,
  (select count(*) from d21)                        as total_paths_d21,
  (select sum(c) from d21)                          as total_views_d21
from d21
where not exists (select 1 from other o where o.path = d21.path);


-- ────────────────────────────────────────────────────────────
-- ④ 동의 상태 분해 — 배너 제거 전후 경계 확인용
--    8/21에 none(미클릭)이 남아 있고 8/22부터 granted 일색이면 정상.
-- ────────────────────────────────────────────────────────────
select view_date, consent, sum(count) as views, count(distinct path) as paths
from public.page_views
where view_date between date '2026-08-19' and date '2026-08-23'
group by view_date, consent
order by view_date, consent;
