-- 메인 프로젝트 카드를 2027 새 사업 4개로 교체 (기존 4개 카드 내용을 덮어씀)
delete from public.projects;
insert into public.projects (title, description, link_url, sort_order) values
  ('거투르드 스타인 프로젝트', '글을 쓰고, 그림을 그리고, 문화운동을 기획하는 모든 크리스천 창작자들의 지원을 환대합니다.', 'gertrude-stein.html', 1),
  ('오바댜 문학상', '짧은 서사로 창조주 하나님의 세계관을 담는 기독교 문학상입니다.', 'projects.html#award', 2),
  ('Film 15''', '기독교 정신을 바탕으로 사회, 문화, 환경, 교육 등 다양한 분야에서 하나님의 사랑을 담은 15분 분량의 다큐멘터리 제작 팀을 지원합니다.', 'projects.html#film', 3),
  ('빈 방 있수다.', '전통적인 성탄 이야기를 현대적으로 재해석하거나, 예수님의 탄생이 오늘날 우리의 삶에 주는 의미를 깊이 있게 성찰하는 작품들을 기다리고 있습니다.', 'projects.html#christmas', 4);

-- 영역 제목 (새 디자인: 큰 제목 / 아래 작은 글씨)
insert into public.site_settings (key, value)
values ('projects_section', '{"title":"2027'' FCO PROJECT","label":"CREATIVE ON ORIGINALITY"}')
on conflict (key) do update set value = excluded.value, updated_at = now();
