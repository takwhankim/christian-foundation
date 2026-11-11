-- ============================================================
-- FCO 기독교창의지원재단 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하도록 작성되어 있습니다.
-- ============================================================

-- ── 관리자 ───────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins: self read" on public.admins;
create policy "admins: self read" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ── 게시물 (공지사항 / 보도자료 / 시상) ─────────────────
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  category text not null default 'notice' check (category in ('notice', 'press', 'award')),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text,
  content text,
  emoji text,
  is_new boolean not null default false,
  published boolean not null default true,
  published_on date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;

drop policy if exists "posts: public read published" on public.posts;
create policy "posts: public read published" on public.posts
  for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "posts: admin write" on public.posts;
create policy "posts: admin write" on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── 사업 지원 신청 (도서 / Film / 문장강사) ─────────────
create table if not exists public.applications (
  id bigint generated always as identity primary key,
  program text not null check (program in ('book', 'film', 'edu')),
  program_name text not null,
  name text not null check (char_length(name) between 1 and 50),
  phone text not null check (char_length(phone) between 5 and 30),
  email text not null check (char_length(email) between 3 and 200),
  project_title text not null check (char_length(project_title) between 1 and 200),
  genre text,
  summary text not null check (char_length(summary) between 1 and 3000),
  plan text check (plan is null or char_length(plan) <= 3000),
  status text not null default '검토중',
  admin_memo text,
  created_at timestamptz not null default now()
);
alter table public.applications enable row level security;

-- ── 오바댜 문학상 응모 ───────────────────────────────────
create table if not exists public.obadiah_entries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 50),
  pen_name text check (pen_name is null or char_length(pen_name) <= 50),
  phone text not null check (char_length(phone) between 5 and 30),
  email text not null check (char_length(email) between 3 and 200),
  genre text not null,
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 5 and 1200),
  status text not null default '접수' check (status in ('접수', '오바댜상', '2등', '미선정')),
  is_public boolean not null default false,
  admin_memo text,
  created_at timestamptz not null default now()
);
alter table public.obadiah_entries enable row level security;

-- 홈페이지에 공개되는 당선작 (연락처 등 개인정보는 제외)
create or replace view public.obadiah_winners as
  select id, coalesce(nullif(pen_name, ''), left(name, 1) || '○○') as author,
         genre, title, body, status, created_at
  from public.obadiah_entries
  where is_public and status in ('오바댜상', '2등');
grant select on public.obadiah_winners to anon, authenticated;

-- ── 해커톤2027 참가 신청 ─────────────────────────────────
create table if not exists public.hackathon_applications (
  id bigint generated always as identity primary key,
  team_name text check (team_name is null or char_length(team_name) <= 100),
  name text not null check (char_length(name) between 1 and 50),
  phone text not null check (char_length(phone) between 5 and 30),
  email text not null check (char_length(email) between 3 and 200),
  organization text check (organization is null or char_length(organization) <= 100),
  member_count int check (member_count is null or member_count between 1 and 20),
  role text,
  idea text check (idea is null or char_length(idea) <= 3000),
  status text not null default '접수',
  admin_memo text,
  created_at timestamptz not null default now()
);
alter table public.hackathon_applications enable row level security;

-- ── 후원 신청 ────────────────────────────────────────────
create table if not exists public.supporters (
  id bigint generated always as identity primary key,
  support_type text not null default '정기',
  amount int not null check (amount >= 1000),
  name text not null check (char_length(name) between 1 and 50),
  phone text not null check (char_length(phone) between 5 and 30),
  email text check (email is null or char_length(email) <= 200),
  status text not null default '신청',
  admin_memo text,
  created_at timestamptz not null default now()
);
alter table public.supporters enable row level security;

-- 신청/응모 테이블 공통 정책: 방문자는 "제출"만, 조회·수정·삭제는 관리자만
do $$
declare t text;
begin
  foreach t in array array['applications', 'obadiah_entries', 'hackathon_applications', 'supporters'] loop
    execute format('drop policy if exists "%1$s: public insert" on public.%1$I', t);
    execute format('create policy "%1$s: public insert" on public.%1$I for insert to anon, authenticated with check (true)', t);
    execute format('drop policy if exists "%1$s: admin all" on public.%1$I', t);
    execute format('create policy "%1$s: admin all" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- 방문자가 상태/메모 같은 관리용 값을 직접 넣지 못하게 막기
create or replace function public.reset_admin_fields()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    new.admin_memo := null;
    new.created_at := now();
    if tg_table_name = 'obadiah_entries' then
      new.status := '접수'; new.is_public := false;
    elsif tg_table_name = 'supporters' then
      new.status := '신청';
    elsif tg_table_name = 'applications' then
      new.status := '검토중';
    else
      new.status := '접수';
    end if;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['applications', 'obadiah_entries', 'hackathon_applications', 'supporters'] loop
    execute format('drop trigger if exists trg_reset_admin_fields on public.%I', t);
    execute format('create trigger trg_reset_admin_fields before insert on public.%I for each row execute function public.reset_admin_fields()', t);
  end loop;
end $$;

-- ── 재단 정보 (푸터 연락처 등) ───────────────────────────
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "settings: public read" on public.site_settings;
create policy "settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "settings: admin write" on public.site_settings;
create policy "settings: admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('org', '{"name":"(재)기독교창의지원재단","tel":"","email":"info@fco.or.kr","address":"","bizno":""}')
on conflict (key) do nothing;

-- ============================================================
-- 테이블 접근 권한 (새 Supabase 프로젝트는 자동으로 부여되지 않음)
-- 실제로 무엇을 볼 수 있는지는 RLS 정책이 다시 한 번 제한합니다.
-- ============================================================
grant usage on schema public to anon, authenticated;

-- 방문자: 공개 글·재단 정보 읽기, 신청/응모 제출
grant select on public.posts, public.site_settings to anon, authenticated;
grant select on public.obadiah_winners to anon, authenticated;
grant insert on public.applications, public.obadiah_entries,
                public.hackathon_applications, public.supporters to anon, authenticated;

-- 로그인한 관리자: 전체 관리 (RLS가 관리자만 허용)
grant select, insert, update, delete on public.posts, public.site_settings,
  public.applications, public.obadiah_entries,
  public.hackathon_applications, public.supporters to authenticated;
grant select on public.admins to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ============================================================
-- 관리자 지정 방법
-- 1) Authentication → Users → "Add user" 로 관리자 이메일/비밀번호 생성
-- 2) 아래 이메일을 바꿔서 실행
--
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'admin@example.com'
-- on conflict do nothing;
-- ============================================================
