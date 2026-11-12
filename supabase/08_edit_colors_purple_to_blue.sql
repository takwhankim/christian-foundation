-- 페이지 편집으로 지정했던 보라색(#6B2D8C) 글자를 파란색(#2563EB)으로
update public.page_content
   set style = jsonb_set(style, '{color}', '"#2563EB"'), updated_at = now()
 where upper(style->>'color') = '#6B2D8C';
select page, original, style from public.page_content where style ? 'color' order by page;
