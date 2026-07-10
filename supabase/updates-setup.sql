-- 제품 업데이트(릴리즈 노트/체인지로그) 테이블 — /update 페이지 + 어드민 등록용.
-- 비공개(GNB·검색 노출 없음, 링크로만 접근). published=true 항목은 익명 읽기 허용(링크 공유용).
-- 쓰기(insert/update/delete)는 관리자(admins)만 — 기존 public.is_admin() 재사용.
-- Supabase → SQL Editor에 붙여넣고 실행.

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,                              -- 신규 기능 / 개선 / 버그 수정 / 공지
  content text not null,                      -- 본문(HTML, RichEditor 저장)
  excerpt text,                               -- 리스트 한 줄 요약
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists updates_created_idx on public.updates (created_at desc);

alter table public.updates enable row level security;

-- 게시된 항목은 익명 읽기 허용(링크로만 도달 — 페이지는 noindex, GNB 없음, 사이트맵 제외)
drop policy if exists "updates public read" on public.updates;
create policy "updates public read" on public.updates
  for select using (published = true);

-- 관리자만 쓰기 (posts와 동일 패턴: public.is_admin())
drop policy if exists "updates admin insert" on public.updates;
create policy "updates admin insert" on public.updates
  for insert to authenticated with check (public.is_admin());

drop policy if exists "updates admin update" on public.updates;
create policy "updates admin update" on public.updates
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "updates admin delete" on public.updates;
create policy "updates admin delete" on public.updates
  for delete to authenticated using (public.is_admin());
