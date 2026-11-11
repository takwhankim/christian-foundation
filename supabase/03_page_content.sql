-- ============================================================
-- 03. 페이지 글 직접 편집 (관리자 로그인 후 홈페이지에서 ✏️ 페이지 편집)
-- SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전합니다.
-- ============================================================
create table if not exists public.page_content (
  page text not null,                 -- 예: index.html, projects.html
  key text not null,                  -- 원래 문구 기준으로 만든 고유값
  original text not null,             -- 원래 문구 (사이트 개편 시 엉뚱한 곳에 적용되지 않게 확인용)
  content text not null check (char_length(content) <= 5000),
  style jsonb,                        -- 글자 크기·색상·굵기 (예: {"fontSize":"20px","color":"#6B2D8C"})
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (page, key)
);
alter table public.page_content add column if not exists style jsonb;  -- 이전 버전으로 이미 만든 경우
alter table public.page_content enable row level security;

drop policy if exists "page_content: public read" on public.page_content;
create policy "page_content: public read" on public.page_content
  for select to anon, authenticated using (true);
drop policy if exists "page_content: admin write" on public.page_content;
create policy "page_content: admin write" on public.page_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.page_content to anon, authenticated;
grant insert, update, delete on public.page_content to authenticated;
