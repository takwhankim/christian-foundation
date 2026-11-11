-- ============================================================
-- 02. 메인 히어로 · 프로젝트 카드 관리 + 이미지/영상 저장소
-- SQL Editor 에 전체 붙여넣고 Run. 여러 번 실행해도 안전합니다.
-- ============================================================

-- ── 프로젝트 카드 (메인 "CREATIVE ON ORIGINALITY" 영역) ──
create table if not exists public.projects (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  link_url text,
  image_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.projects enable row level security;

drop policy if exists "projects: public read published" on public.projects;
create policy "projects: public read published" on public.projects
  for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "projects: admin write" on public.projects;
create policy "projects: admin write" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

-- 현재 홈페이지에 있는 카드 4개를 처음 한 번만 넣어 둡니다.
insert into public.projects (title, description, link_url, sort_order)
select * from (values
  ('기독교 도서 지원사업', '기독교 창의 작가들의 출판을 지원하여 양질의 기독교 문학이 세상에 나올 수 있도록 돕습니다.', 'projects.html#book', 1),
  ('오바댜 문학상', '짧은 서사로 창조주 하나님의 세계관을 담는 기독교 문학상입니다.', 'projects.html#award', 2),
  ('Film・드라마', '기독교적 가치를 담은 영상 콘텐츠 제작을 지원하여 미디어 선교의 새 길을 열어갑니다.', 'projects.html#film', 3),
  ('문장 강사 양성', '기독교 작가와 강사를 양성하는 교육 프로그램으로 차세대 창의 인재를 키웁니다.', 'projects.html#edu', 4)
) as v(title, description, link_url, sort_order)
where not exists (select 1 from public.projects);

-- 프로젝트 영역 제목
insert into public.site_settings (key, value) values
  ('projects_section', '{"label":"2027 FCO PROJECT","title":"CREATIVE ON ORIGINALITY","desc":"기독교 창의성을 세상 속으로"}')
on conflict (key) do nothing;

-- ── 이미지·영상 저장소 (공개 읽기, 관리자만 업로드) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site-media: public read" on storage.objects;
create policy "site-media: public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-media');
drop policy if exists "site-media: admin insert" on storage.objects;
create policy "site-media: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "site-media: admin update" on storage.objects;
create policy "site-media: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "site-media: admin delete" on storage.objects;
create policy "site-media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-media' and public.is_admin());
