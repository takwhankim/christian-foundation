-- 기도후원: 이메일 필수 추가 (이름 · 교회/소속 · 전화번호 · 이메일)
alter table public.prayer_supporters add column if not exists email text;
update public.prayer_supporters set email = '' where email is null;
alter table public.prayer_supporters alter column email set not null;
alter table public.prayer_supporters drop constraint if exists prayer_supporters_email_check;
alter table public.prayer_supporters add constraint prayer_supporters_email_check
  check (char_length(email) between 3 and 200) not valid;  -- 기존 행은 검사 제외, 새 신청부터 적용
