-- 메인 프로젝트 카드 '자세히 보기' → 각 사업 상세 페이지
update public.projects set link_url = 'obadiah.html'   where title = '오바댜 문학상';
update public.projects set link_url = 'film15.html'    where title = 'Film 15''';
update public.projects set link_url = 'christmas.html' where title = '빈 방 있수다.';
update public.projects set link_url = 'gertrude-stein.html' where title = '거투르드 스타인 프로젝트';
select title, link_url from public.projects order by sort_order;
