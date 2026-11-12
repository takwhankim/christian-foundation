# FCO 기독교창의지원재단 홈페이지 — 작업 안내

## 작업 규칙 (두 대의 Mac에서 번갈아 작업)
- **작업 시작 전 항상 `git pull`**, 작업 단위가 끝나면 **바로 commit + push** (따로 요청을 기다리지 않음).
- main 에 push 하면 GitHub Actions 가 GitHub Pages 로 자동 배포 → https://takwhankim.github.io/christian-foundation/
- 미리보기: 프로젝트 폴더에서 `python3 -m http.server 8765` → http://localhost:8765 (브라우저 캐시 주의: ⌘⇧R)

## 구조
- 정적 HTML: `index.html` `about.html` `projects.html` `news.html` `support.html` `apply.html` `hackathon.html`, 관리자 `admin/`
- `js/supabase-config.js` (Supabase URL + publishable key — 공개 가능한 값), `js/fco-db.js` (공통 헬퍼), `js/fco-edit.js` (관리자 페이지 직접 편집)
- `supabase/*.sql` — DB 스키마. **DB 변경은 사용자가 Supabase 대시보드 SQL Editor 에서 실행**(service key·DB 비밀번호는 받지 않음). 새 SQL 은 `pbcopy` 로 클립보드에 넣어 안내.
  - `schema.sql`(테이블·RLS·권한) → `02_hero_projects.sql`(히어로·프로젝트·storage `site-media`) → `03_page_content.sql`(페이지 글 편집)
  - 새 Supabase 프로젝트는 테이블 GRANT 가 자동이 아님 → 새 테이블마다 grant 필수
- 이미지: 사이트용 사본은 `images/`, 원본은 `참고이미지/`(gitignore)

## 관리자가 직접 바꾸는 것 (코드로 덮어쓰지 말 것)
- 관리자 화면: 메인 히어로(1~5 슬라이드, `site_settings.hero`), 프로젝트 카드(`projects`), 공지·보도자료(`posts`), 재단 정보(`site_settings.org`), 응모·신청 관리
- 공개 페이지 **✏️ 페이지 편집**: 글·크기·색상 → `page_content` (키 = 원래 문구 해시 + 순번, `original` 이 HTML 원문과 같을 때만 적용).
  ⚠️ HTML 원문 문구를 바꾸면 그 문구에 대한 관리자 수정본은 적용되지 않음 → 문구 변경 전 `page_content` 확인.

## 디자인 기준 (사용자 확정)
- 본문 기본 **17px**, 작은 회색 글씨 지양
- GNB: 메뉴 19px 굵게(700), 자간 0.06em / 헤더 높이 88px / 로고 36px / 해커톤2027 = 파란 캡슐 버튼(#2563EB, 흰 글씨)
- 섹션 제목 40px, 영문 부제 20px, 섹션 라벨·부제 14px / 항목표는 제목만 굵게
- 이모지 아이콘 사용하지 않음
- 브랜드 보라 #6B2D8C, 남색 #1a1f3c, 폰트 Pretendard
- **블루 위계·라운드 박스 규칙**(11-11 맥미니): 카테고리·영문 라벨·연도·번호 등 보조 강조는 블루, 태그는 블루 라운드 박스
- 메인 프로젝트 섹션 제목 대형(clamp 64px), 카드 h3 아래 구분선

## 콘텐츠
- 문학상 명칭은 **오바댜 문학상 (Obadiah Literary Award)** — "오버다" 아님
- 오바댜 문학상: 5~1200자, 소설·시·카피라이트·에세이·시나리오, 격월 연 6회(2·4·6·8·10·12월), 오바댜상 1명 30만원·2등 2명 각 10만원, 상패·도서
- 사업 4개 + 상세 페이지: 거투르드 스타인(`gertrude-stein.html`), 오바댜 문학상(`obadiah.html`, 공개 당선작 자동 표시), Film 15'(`film15.html`), 빈 방 있수다(`christmas.html`). 메인 카드·사업소개 '자세히 보기'는 각 상세 페이지로. **GNB '사업소개'는 이 4개 사업 드롭다운**(모든 페이지)
- 해커톤2027(`hackathon.html`): 5탭(소개·도전과제·참여하기·운영방식·FAQ), 폼 3개 → `hackathon_challenges`·`hackathon_applications`·`hackathon_mentors`, 히어로 색상은 `site_settings.hackathon_hero`(관리자 편집)
- 원본 자료: `~/Library/CloudStorage/OneDrive-개인/기독교창의지원재단` (로고, 포스터 PSD, 키비주얼, 해커톤 참고자료, 4K 바다 영상)

## 다음에 할 일
- (11-12 완료) `06_project_links.sql` 실행됨 → 메인 카드 4개 모두 상세 페이지로 연결
- Film 15'·빈 방 있수다 상세: 지원 내용·일정·신청 방법이 "추후 공지됩니다" → 사용자가 ✏️ 페이지 편집으로 채우거나 자료 받아 작성
- (11-12) 지원하기 탭 = 4개 사업(gertrude/award/film15/christmas), 각 상세 페이지에 지원·응모 버튼. `07_programs_2027.sql` 실행·검증 완료
- 개인정보처리방침·이용약관 페이지 / 오바댜 포스터 PSD로 2027판 재제작(포스터 하단 안내가 예전 '매월·20만원') / 히어로 4K 바다 영상 검토
