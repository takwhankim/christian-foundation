-- ============================================================
-- 05. 해커톤2027 문제 제안 / 멘토·협력 신청
-- (11-11 맥미니에서 대시보드로 만든 테이블을 기록하고, 관리자 관리용 컬럼·권한을 보강)
-- 여러 번 실행해도 안전합니다.
-- ============================================================
create table if not exists public.hackathon_challenges (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text not null,
  organization text,
  challenge_category text,
  challenge_title text,
  description text,
  location text,
  urgency text,
  created_at timestamptz not null default now()
);
alter table public.hackathon_challenges add column if not exists status text not null default '접수';
alter table public.hackathon_challenges add column if not exists admin_memo text;
alter table public.hackathon_challenges add column if not exists created_at timestamptz not null default now();

create table if not exists public.hackathon_mentors (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text not null,
  organization text,
  partnership_type text,
  expertise text,
  bio text,
  created_at timestamptz not null default now()
);
alter table public.hackathon_mentors add column if not exists status text not null default '접수';
alter table public.hackathon_mentors add column if not exists admin_memo text;
alter table public.hackathon_mentors add column if not exists created_at timestamptz not null default now();

-- 방문자는 제출만, 조회·수정·삭제는 관리자만
do $$
declare t text;
begin
  foreach t in array array['hackathon_challenges', 'hackathon_mentors'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s: public insert" on public.%1$I', t);
    execute format('create policy "%1$s: public insert" on public.%1$I for insert to anon, authenticated with check (true)', t);
    execute format('drop policy if exists "%1$s: admin all" on public.%1$I', t);
    execute format('create policy "%1$s: admin all" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant insert on public.%I to anon, authenticated', t);
    execute format('grant select, update, delete on public.%I to authenticated', t);
    execute format('drop trigger if exists trg_reset_admin_fields on public.%I', t);
    execute format('create trigger trg_reset_admin_fields before insert on public.%I for each row execute function public.reset_admin_fields()', t);
  end loop;
end $$;
grant usage, select on all sequences in schema public to anon, authenticated;
