# Supabase 연결 가이드

## 1. 프로젝트 만들기 (재단 담당자)
1. https://supabase.com 가입 → **New project**
   - Region: **Northeast Asia (Seoul)**
   - Database password: 안전한 곳에 보관
2. **Project Settings → API** 에서 두 값을 복사
   - Project URL
   - `anon` `public` key

## 2. 사이트에 연결
`js/supabase-config.js` 에 위 두 값을 넣습니다. (공개되어도 되는 값입니다)

## 3. DB 만들기
Supabase **SQL Editor** 에서 아래 파일을 순서대로 붙여넣고 **Run**
1. `supabase/schema.sql` (기본 테이블·보안 규칙·권한)
2. `supabase/02_hero_projects.sql` (메인 히어로·프로젝트 카드·이미지/영상 저장소)

## 4. 관리자 계정
1. **Authentication → Users → Add user** (이메일·비밀번호 입력, *Auto Confirm* 체크)
2. SQL Editor 에서 실행:
   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = '관리자@이메일';
   ```
3. `/admin/login.html` 에서 해당 이메일로 로그인

관리자 해제: `delete from public.admins where user_id = (select id from auth.users where email = '...');`

## 5. 권장 설정
- **Authentication → Providers → Email**: *Allow new users to sign up* 끄기
  (관리자는 대시보드에서만 추가하도록)

## 데이터 구조
| 테이블 | 용도 | 방문자 | 관리자 |
|---|---|---|---|
| posts | 공지·보도자료·시상 | 공개 글 읽기 | 전체 |
| obadiah_entries | 오바댜 문학상 응모 | 제출만 | 전체 |
| obadiah_winners (view) | 공개 당선작 (개인정보 제외) | 읽기 | — |
| hackathon_applications | 해커톤2027 참가 신청 | 제출만 | 전체 |
| applications | 도서·Film·문장강사 지원신청 | 제출만 | 전체 |
| supporters | 후원 신청 | 제출만 | 전체 |
| site_settings | 재단 정보·메인 히어로·프로젝트 영역 제목 | 읽기 | 전체 |
| projects | 메인 프로젝트 카드 | 공개 카드 읽기 | 전체 |
| storage: site-media | 히어로·프로젝트 이미지/영상 | 읽기 | 업로드·삭제 |
