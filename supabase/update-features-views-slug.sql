-- 업데이트 기능: 조회수 + slug (한 번에 실행) — 기존 데이터 무손실(add column if not exists)

-- ① 조회수
alter table public.updates add column if not exists views bigint not null default 0;
create or replace function public.increment_update_views(pid uuid)
returns void language sql security definer set search_path = public as $$
  update public.updates set views = views + 1 where id = pid and published = true;
$$;
grant execute on function public.increment_update_views(uuid) to anon, authenticated;

-- ② slug(자유 URL)
alter table public.updates add column if not exists slug text;
create unique index if not exists updates_slug_key on public.updates (slug) where slug is not null;
