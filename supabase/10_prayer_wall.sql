-- ============================================================
-- 10. 기도후원 공개 명단 (이름 + 교회/소속만 공개, 전화번호는 비공개)
-- 09_prayer_supporters.sql 다음에 실행. 여러 번 실행해도 안전합니다.
-- ============================================================
alter table public.prayer_supporters add column if not exists is_public boolean not null default true;
comment on column public.prayer_supporters.church is '교회/소속';

create or replace view public.prayer_wall as
  select id, name, church, created_at
  from public.prayer_supporters
  where is_public
  order by created_at desc;
grant select on public.prayer_wall to anon, authenticated;
