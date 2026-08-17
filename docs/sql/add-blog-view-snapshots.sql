-- 블로그 누적 조회수 일별 스냅샷 테이블
-- 목적: posts.views 는 누적값이라 추이를 볼 수 없다. 매일 오전 크론(/api/cron/daily-analytics)이
--       한 행을 남겨, 그 차이를 "동의와 무관한 실측 트래픽 증가분"으로 쓴다.
--       (2026-08-17 점검: GA4는 쿠키 동의 미클릭 방문자를 놓쳐 실제의 5~23%만 집계)
-- 적용: Supabase 대시보드 → SQL Editor 에 붙여넣고 실행. 재실행 안전(idempotent).

create table if not exists public.blog_view_snapshots (
  snapshot_date date        primary key,
  snapshot_at   timestamptz not null default now(),
  views_total   integer     not null,
  posts_count   integer     not null,
  created_at    timestamptz not null default now()
);

comment on table public.blog_view_snapshots is
  '블로그 누적 조회수(posts.views 합계)의 일별 스냅샷. 크론이 하루 1행 upsert. 증가분 = 동의 무관 실측 트래픽.';

-- RLS 활성 + 정책 없음 = anon/authenticated 접근 전면 차단.
-- 크론은 service_role 키로 접근하므로 RLS를 우회한다(정책 불필요).
alter table public.blog_view_snapshots enable row level security;

-- 조회 예시 — 일별 증가분
-- select snapshot_date,
--        views_total,
--        views_total - lag(views_total) over (order by snapshot_date) as delta
-- from public.blog_view_snapshots
-- order by snapshot_date desc;
