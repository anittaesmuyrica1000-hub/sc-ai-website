-- 약관 용어 메모장 — 어드민 #glossary 탭 (2026-10-15)
-- 처리방침·이용약관 업데이트를 맡은 담당자가 용어를 익히려고 쓰는 내부 학습 도구다. 공개 페이지에는 노출하지 않는다.
--
-- glossary_terms    : 용어 본문. 관리자(admins) 공용 — 누가 고쳐도 모두에게 같은 설명이 보인다.
-- glossary_progress : 숙지 체크·내 메모. 관리자 본인 행만 읽고 쓴다(다른 관리자의 메모는 안 보인다).
--
-- 관리자 판별은 기존 public.is_admin() 재사용(supabase/admins-management-rls.sql).
-- anon 은 두 테이블 모두 읽기·쓰기 불가.

create table if not exists public.glossary_terms (
  id          text primary key,                -- 시드는 슬러그(예: cross-border), 어드민에서 추가한 용어는 uuid 문자열
  cat         text not null default '내가 추가', -- 분류(역할 / 개인정보 기본 / 동의·국외이전 …)
  term        text not null,
  aka         text not null default '',        -- 다른 이름·영문
  short       text not null,                   -- 한 줄 뜻
  body        text not null default '',        -- 쉽게 말하면
  refs        text[] not null default '{}',    -- 약관에서 (조문 위치 목록)
  ours        text not null default '',        -- 우리 서비스에선
  watch       text not null default '',        -- 이번 개정에서 볼 점 (비어 있지 않으면 '개정 관련')
  sort_order  int  not null default 0,
  source      text not null default 'me',      -- claude(시드) | me(어드민에서 추가)
  asked       boolean not null default false,  -- 담당자가 대화에서 직접 물어본 개념 ('물어본 개념' 필터)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- 이미 테이블이 있던 경우 대비
alter table public.glossary_terms add column if not exists asked boolean not null default false;

alter table public.glossary_terms enable row level security;

drop policy if exists "glossary_terms admin all" on public.glossary_terms;
create policy "glossary_terms admin all" on public.glossary_terms
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.glossary_progress (
  term_id     text not null references public.glossary_terms(id) on delete cascade,
  email       text not null,                   -- 로그인한 관리자 이메일(auth.jwt() email)
  learned     boolean not null default false,
  memo        text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (term_id, email)
);

alter table public.glossary_progress enable row level security;

drop policy if exists "glossary_progress own" on public.glossary_progress;
create policy "glossary_progress own" on public.glossary_progress
  for all to authenticated
  using (public.is_admin() and email = (auth.jwt() ->> 'email'))
  with check (public.is_admin() and email = (auth.jwt() ->> 'email'));
