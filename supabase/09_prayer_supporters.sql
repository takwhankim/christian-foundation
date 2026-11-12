-- ============================================================
-- 09. 기도후원 (이름 · 전화번호 · 출석교회)
-- 방문자는 제출만, 조회·수정·삭제는 관리자만. 여러 번 실행해도 안전합니다.
-- ============================================================
create table if not exists public.prayer_supporters (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 50),
  phone text not null check (char_length(phone) between 5 and 30),
  church text not null check (char_length(church) between 1 and 100),
  status text not null default '접수',
  admin_memo text,
  created_at timestamptz not null default now()
);
alter table public.prayer_supporters enable row level security;

drop policy if exists "prayer_supporters: public insert" on public.prayer_supporters;
create policy "prayer_supporters: public insert" on public.prayer_supporters
  for insert to anon, authenticated with check (true);
drop policy if exists "prayer_supporters: admin all" on public.prayer_supporters;
create policy "prayer_supporters: admin all" on public.prayer_supporters
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert on public.prayer_supporters to anon, authenticated;
grant select, update, delete on public.prayer_supporters to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

drop trigger if exists trg_reset_admin_fields on public.prayer_supporters;
create trigger trg_reset_admin_fields before insert on public.prayer_supporters
  for each row execute function public.reset_admin_fields();
