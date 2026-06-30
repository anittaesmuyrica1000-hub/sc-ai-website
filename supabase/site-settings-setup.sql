-- ============================================================
-- 사이트 전역 설정(key-value) 테이블 — 우선 Google Analytics 측정 ID 관리용
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 1회 실행하세요.
-- 관리자 판별: public.admins 테이블에 로그인 이메일이 있어야 함(기존 posts·faq·legal·page_seo와 동일).
-- ============================================================

create table if not exists public.site_settings (
  key        text primary key,            -- 예: 'ga_measurement_id'
  value      text,                        -- 설정 값(비우면 미설정)
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- 공개 읽기: GA 측정 ID는 공개 페이지에서 스크립트 주입에 필요 → 누구나 select 허용
drop policy if exists "site_settings public read" on public.site_settings;
create policy "site_settings public read" on public.site_settings
  for select using (true);

-- 관리자: 전체 CRUD
drop policy if exists "site_settings admin all" on public.site_settings;
create policy "site_settings admin all" on public.site_settings
  for all to authenticated
  using      (auth.jwt() ->> 'email' in (select email from public.admins))
  with check (auth.jwt() ->> 'email' in (select email from public.admins));

-- GA 측정 ID 행 시드(없을 때만, 빈 값)
insert into public.site_settings (key, value) values ('ga_measurement_id', '')
  on conflict (key) do nothing;
