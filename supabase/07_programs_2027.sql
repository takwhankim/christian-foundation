-- 지원하기 페이지 사업 탭을 2027 사업(거투르드 스타인 / Film 15' / 빈 방 있수다)으로 변경
-- (오바댜 문학상 응모는 obadiah_entries 테이블에 따로 저장)
alter table public.applications drop constraint if exists applications_program_check;
alter table public.applications add constraint applications_program_check
  check (program in ('gertrude', 'film15', 'christmas', 'book', 'film', 'edu'));
