# Admin 운영 가이드

관리자가 수동으로 실행하는 명령어와 운영 절차를 정리합니다.

## 두 가지 관리자 권한 체계

CodeXray 는 용도에 따라 서로 다른 인증 체계를 씁니다.

| 용도 | 인증 방식 | 대상 |
|---|---|---|
| 데이터 관리 CLI/API (문제 일괄 갱신, 티어 재계산 등) | `X-Admin-Key` 헤더 (`.env` 의 `ADMIN_KEY`) | 로컬 관리자 (스크립트/curl) |
| 서비스 내 관리 UI (신고 처리, 건의사항 답변, 게시글 숨김 등) | JWT 의 `role=ADMIN` | 로그인한 관리자 사용자 |

---

## 관리자 계정 만들기

JWT 기반 관리자 권한은 **OAuth (Google / Naver) 전용** 입니다.
`ADMIN_EMAIL` 과 동일한 이메일로 비밀번호 가입하는 경로는 차단되어 있습니다 (선점 공격 방어).

1. `.env` 에 `ADMIN_EMAIL=당신의_대표이메일` 설정
2. OAuth 앱 등록:
   - Google: https://console.cloud.google.com/apis/credentials — redirect URI `http://localhost:3000/api/auth/google/callback`
   - Naver: https://developers.naver.com/apps — callback `http://localhost:3000/api/auth/naver/callback`, 제공 정보에 "이메일" 필수 체크
3. 서비스 로그인 페이지에서 "Google/네이버로 계속하기" 클릭 → 해당 계정으로 로그인
4. OAuth 응답의 이메일이 `ADMIN_EMAIL` 과 일치하면 role 이 자동 ADMIN 으로 승격됩니다.

> **ADMIN_EMAIL 매칭**: provider 가 돌려주는 이메일과 **정확히** 같아야 승격됩니다. 네이버는 네이버 계정 프로필의 이메일을, 구글은 해당 Gmail 을 반환합니다.

이미 비밀번호 경로로 `ADMIN_EMAIL` 을 썼던 경우 (migrate 이전 가입) 수동 승격:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

---

## 이메일 인증 + OAuth 환경변수

### 필수 (`.env`)

| 변수 | 용도 |
|---|---|
| `DATABASE_URL` | Postgres 연결 |
| `JWT_SECRET` | JWT 서명 키 |
| `FRONTEND_URL` | 메일 인증 링크 + OAuth redirect 베이스 URL (예: `http://localhost:5173`) |
| `ADMIN_EMAIL` | 자동 ADMIN 승격 기준 이메일 |
| `ADMIN_KEY` | `X-Admin-Key` 헤더용 (데이터 관리 API) |
| `ANTHROPIC_API_KEY` | AI 분석 / 태그 분류 |

### OAuth (선택 — 해당 프로바이더 쓸 때만)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/naver/callback
```

### SMTP (이메일 인증)

비우면 dev 모드로 작동 — 백엔드 콘솔에 인증 링크가 출력되니 복붙으로 테스트 가능.

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

운영 시엔 Resend / Gmail app password / SendGrid / Mailgun 중 택일.

---

## 서비스 내 관리자 작업 (JWT ADMIN)

로그인 후 Navbar 에 나타나는 링크로 접근합니다.

### 신고 관리 (`/admin/reports`)

- 사용자가 게시글에 🚩 신고를 남기면 여기에 자동 수집됨
- 한 게시글에 여러 신고가 쌓이면 그룹핑되어 한 카드로 표시
- 액션:
  - **게시글 숨김**: 작성자/관리자 외 비공개 처리 (`CommunityPost.hidden = true`)
  - **신고 처리** (HANDLED): 신고가 정당한 것으로 인정
  - **기각** (DISMISSED): 문제 없음으로 종결
- 숨김 처리된 게시글은 작성자에게 "관리자에 의해 숨김됨" 안내 배너가 표시됩니다.

### 건의사항 처리 (`/suggestions/:id`)

관리자로 로그인하면 건의사항 상세 페이지에 추가 UI 가 나타납니다.
- 상태 변경 (처리 중 / 해결됨)
- 관리자 공식 답변 등록/수정 (녹색 박스로 일반 댓글과 구분 표시)
- 비공개 건의(`isPrivate`)도 관리자는 조회 가능

---

## 데이터 관리 CLI (X-Admin-Key 방식)

### 문제 데이터 파이프라인

순서: `fetch-problems` → `seed` → `scrape-descriptions` → `tag-problems`

#### 1. 프로그래머스에서 문제 목록 가져오기

로컬의 `prisma/problems-data.json` 파일을 갱신합니다. 이 파일은 `.gitignore` 에 등록되어 있어 로컬에서만 관리됩니다.

```bash
npm run fetch-problems
```

주기: 신규 문제가 추가됐을 때 수동 실행.

#### 2. DB 에 문제 시드 주입

`problems-data.json` 의 문제들을 DB 에 삽입합니다. 이미 있는 문제는 `skipDuplicates` 로 건너뜁니다.

```bash
npm run seed
```

#### 3. 문제 본문 스크래핑

프로그래머스 각 문제 URL 을 puppeteer 로 열어 본문 텍스트를 `prisma/problem-descriptions.json` 에 캐싱합니다. 이미 캐싱된 문제는 건너뜁니다 (중단 후 재실행 가능).

```bash
npm run scrape-descriptions
```

소요 시간: 문제당 약 1.5~4초 (1.2초 딜레이 포함). 689개 기준 약 20~40분.
주기: 신규 문제 추가 후 한 번만.

#### 4. AI 알고리즘 태그 분류

본문 + 제목을 `claude-sonnet-4-6` 에 넘겨 고정 taxonomy 안에서 태그를 1~3개 선택하고 `ProblemTag` 에 반영합니다.

```bash
npm run tag-problems
```

- 결과는 `prisma/problem-tags.json` 에 캐싱 → 재실행 시 AI 호출 스킵, DB 반영만 수행
- 필수: `ANTHROPIC_API_KEY`
- 프롬프트 캐싱 적용 (시스템 + taxonomy 구간 재사용)

### 난이도 티어 재계산

사용자 피드백 + 정답률 + 원본 레벨을 기반으로 모든 문제의 `adjustedLevel` 과 `tier` 를 다시 계산합니다.

```bash
curl -X POST http://localhost:3000/api/ratings/recompute-all \
  -H "X-Admin-Key: $ADMIN_KEY"
```

주기: 수동 트리거. 데이터 쌓이면 주간 크론 고려.

계산 방식 (Bayesian shrinkage):
```
adjustedLevel = (α × origLevel + β × arLevel + Σfeedback) / (α + β + n)
```
- `α=2`, `β=2` (prior strength)
- `arLevel`: 정답률 기반 환산 레벨 (`5 × (1 - 정답률/100)`)
- `n`: 사용자 피드백 개수

개별 문제 재계산은 사용자가 피드백을 제출할 때 자동으로 수행됩니다.

---

## DB 마이그레이션

Prisma v7 은 `migrate dev` 가 인터랙티브 TTY 를 요구하므로 마이그레이션 SQL 을 수동 작성합니다.

### 새 마이그레이션 만들기

```bash
# 1. prisma/migrations/<timestamp>_<name>/migration.sql 작성
# 2. 적용
npx prisma migrate deploy
# 3. 클라이언트 재생성
npx prisma generate
```

### 스키마 확인

```bash
npx prisma studio
```

### 현재 적용된 마이그레이션 히스토리

```bash
npx prisma migrate status
```

---

## 개발 서버

```bash
npm run start:dev   # watch 모드
npm run start       # 일반
npm run build       # 빌드
```

프론트엔드는 `cd ../frontend && npm run dev` 로 따로 띄웁니다 (기본 `http://localhost:5173`, Vite proxy 로 `/api` → `localhost:3000` 프록시).
