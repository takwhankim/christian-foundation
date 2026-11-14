# FCO 기독교창의지원재단 홈페이지 — 작업 안내

## 작업 규칙 (두 대의 Mac에서 번갈아 작업)
- **작업 시작 전 항상 `git pull`**, 작업 단위가 끝나면 **바로 commit + push** (따로 요청을 기다리지 않음).
- main 에 push 하면 GitHub Actions 가 GitHub Pages 로 자동 배포 → https://takwhankim.github.io/christian-foundation/
- JS/CSS 주소에 `?v=해시` 버전 태그(브라우저 10분 캐시 방지) — **배포 시 `tools/bust-cache.py`가 자동 실행**. 로컬에서도 JS 수정 후 실행해 두면 미리보기와 저장소가 일치
- 미리보기: 프로젝트 폴더에서 `python3 -m http.server 8765` → http://localhost:8765 (브라우저 캐시 주의: ⌘⇧R)

## 구조
- 정적 HTML: `index.html` `about.html` `projects.html` `news.html` `support.html` `apply.html` `hackathon.html`, 관리자 `admin/`
- `js/supabase-config.js` (Supabase URL + publishable key — 공개 가능한 값), `js/fco-db.js` (공통 헬퍼), `js/fco-edit.js` (관리자 페이지 직접 편집)
- `supabase/*.sql` — DB 스키마. **DB 변경은 사용자가 Supabase 대시보드 SQL Editor 에서 실행**(service key·DB 비밀번호는 받지 않음). 새 SQL 은 `pbcopy` 로 클립보드에 넣고 **채팅에도 SQL 전문을 함께 보여줄 것**(클립보드는 그 컴퓨터에만 있음 — 다른 Mac에서 ⌘V 하면 엉뚱한 SQL이 들어감, 11-14 사례). 실행 후 반드시 DB에서 적용 여부 확인.
  - `schema.sql`(테이블·RLS·권한) → `02_hero_projects.sql`(히어로·프로젝트·storage `site-media`) → `03_page_content.sql`(페이지 글 편집)
  - 새 Supabase 프로젝트는 테이블 GRANT 가 자동이 아님 → 새 테이블마다 grant 필수
  - ⚠️ **DB 컬럼/테이블이 새로 필요한 변경은 사용자가 SQL을 실행한 것을 확인한 뒤에 페이지를 push** (먼저 push하면 폼이 오류 남 — 11-13 기도후원 이메일 사례)
- 이미지: 사이트용 사본은 `images/`, 원본은 `참고이미지/`(gitignore)

## 관리자가 직접 바꾸는 것 (코드로 덮어쓰지 말 것)
- 관리자 화면: 메인 히어로(1~5 슬라이드, `site_settings.hero`; 세로 높이 % = (화면−헤더)×값, CSS 최소 640px도 같은 비율로 낮춤; 영상 슬라이드는 끝까지 재생 후 다음으로, 전환 간격은 이미지·색상에만), 프로젝트 카드(`projects`), 공지·보도자료(`posts`), 재단 정보(`site_settings.org`), 응모·신청 관리
- 공개 페이지 **✏️ 페이지 편집**: 글·크기·색상 → `page_content` (키 = 원래 문구 해시 + 순번, `original` 이 HTML 원문과 같을 때만 적용).
  제목+부제 묶음은 **한 덩어리(`h1/h2.tm.tm-<page>-N`, 줄은 <br>)** — 첫 줄 모양은 `::first-line`(em 비율)이라 크기 조절 시 함께 커짐. 새 제목도 이 방식으로.
  편집 도구: 크기·**행간(줄 사이만 변경 — 첫 줄 위치·박스 아래·아래 콘텐츠는 고정, `compensateLineHeight`. 사용자 확정 동작)**·아래 간격(음수 허용)·굵기·이탤릭·색·**글꼴(구글 웹폰트 11종, 쓸 때만 로드)**
  깜빡임 방지: 각 공개 페이지 `<head>`의 `fco-wait`(최대 1.5초 숨김) + `fco-edit.js`가 수정본을 localStorage(`fco_pc:<page>`)에 기억해 재방문 시 즉시 적용.
  ⚠️ HTML 원문 문구를 바꾸면 그 문구에 대한 관리자 수정본은 적용되지 않음 → 문구 변경 전 `page_content` 확인.

## 디자인 기준 (사용자 확정)
- **모바일 공통 보정**: `css/mobile.css` + `js/fco-fit.js`(모든 공개 페이지 `</head>` 직전). 900px 이하에서 한글 제목 keep-all, 모바일 메뉴 왼쪽 정렬, 탭메뉴 가로 스크롤, 합친 제목(.tm·#psHead) 첫 줄이 넘치면 **첫 줄 크기만** 줄여 한 줄 유지. 새 페이지에도 두 줄 연결할 것
- 본문 기본 **17px**, 작은 회색 글씨 지양. 단, 폼의 동의·체크박스 안내 문구는 **14px**(사용자 지정)
- GNB: 메뉴 19px 굵게(700), 자간 0.06em / 헤더 높이 88px / 로고 36px / 해커톤2027 = 파란 캡슐 버튼(#2563EB, 흰 글씨)
- 섹션 제목 40px, 영문 부제 20px, 섹션 라벨·부제 14px / 항목표는 제목만 굵게
- 이모지 아이콘 사용하지 않음
- **키컬러 = 옐로우 #fff71a + 블루 글씨 #2563EB** (11-12 사용자 지정, 보라 사용 안 함 — 로고 이미지만 보라). `--brand`=블루, `--key`=옐로우. 각 페이지 `<style>` 끝의 `THEME: 옐로우 + 블루` 블록이 덮어씀
- 서브 히어로(.page-hero / 상세 .gs-hero) **높이 300px로 통일**, 노란 바탕 + 파란 글씨
- 남색 #1a1f3c 는 푸터·일부 CTA에만, 폰트 Pretendard
- **블루 위계·라운드 박스 규칙**(11-11 맥미니): 카테고리·영문 라벨·연도·번호 등 보조 강조는 블루, 태그는 블루 라운드 박스
- 메인 프로젝트 섹션 제목 대형(clamp 64px), 카드 h3 아래 구분선

## 콘텐츠
- **'세계관' 단어 사용 금지**(사용자 지정) → 문맥에 따라 '메시지', '가치', '신앙' 등으로
- 문학상 명칭은 **오바댜 문학상 (Obadiah Literary Award)** — "오버다" 아님
- 오바댜 문학상: 5~1200자, 소설·시·카피라이트·에세이·시나리오, 격월 연 6회(2·4·6·8·10·12월), 오바댜상 1명 30만원·2등 2명 각 10만원, 상패·도서
- 사업 4개 + 상세 페이지: 거투르드 스타인(`gertrude-stein.html`), 오바댜 문학상(`obadiah.html`, 공개 당선작 자동 표시), Film 15'(`film15.html`), 빈 방 있수다(`christmas.html`). 메인 카드·사업소개 '자세히 보기'는 각 상세 페이지로. **GNB '사업소개'는 이 4개 사업 드롭다운**(모든 페이지)
- GNB '후원' 드롭다운: 재정후원(`support.html`) / 기도후원(`prayer.html`: 소개 2줄 + [신청하기]로 입력창 펼침, 이름·전화번호·교회/소속 → `prayer_supporters`. 공개 명단 = `prayer_wall` 뷰(이름·교회/소속만), 관리자 '기도후원' 메뉴에서 명단 공개 체크)
- 해커톤2027(`hackathon.html`): 5탭(소개·도전과제·참여하기·운영방식·FAQ), 폼 3개 → `hackathon_challenges`·`hackathon_applications`·`hackathon_mentors`, 히어로 색상은 `site_settings.hackathon_hero`(관리자 편집)
- 원본 자료: `~/Library/CloudStorage/OneDrive-개인/기독교창의지원재단` (로고, 포스터 PSD, 키비주얼, 해커톤 참고자료, 4K 바다 영상)

## 다음에 할 일
- (11-12 완료) `09_prayer_supporters.sql` + `10_prayer_wall.sql` 실행·검증됨 (공개 명단 이름·교회/소속만, 전화번호 비공개)
- 재정후원 '후원링크': 외부 결제/정기후원 링크가 있으면 support.html 에 연결 (사용자 확인 필요)
- (11-12 완료) `06_project_links.sql` 실행됨 → 메인 카드 4개 모두 상세 페이지로 연결
- Film 15'·빈 방 있수다 상세: 지원 내용·일정·신청 방법이 "추후 공지됩니다" → 사용자가 ✏️ 페이지 편집으로 채우거나 자료 받아 작성
- (11-12) 지원하기 탭 = 4개 사업(gertrude/award/film15/christmas), 각 상세 페이지에 지원·응모 버튼. `07_programs_2027.sql` 실행·검증 완료
- 개인정보처리방침·이용약관 페이지 / 오바댜 포스터 PSD로 2027판 재제작(포스터 하단 안내가 예전 '매월·20만원') / 히어로 4K 바다 영상 검토
