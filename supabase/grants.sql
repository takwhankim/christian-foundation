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
