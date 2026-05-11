# CodeXray

> 프로그래머스 풀이를 등록하고, 커스텀 티어 시스템 + AI 분석 + 커뮤니티로 학습을 보강하는 풀스택 코딩테스트 트래커.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🎯 만든 이유

프로그래머스에서 푼 문제를 단순히 "체크" 하는 게 아니라, **티어 / 알고리즘 / 메모 / AI 분석** 같은 부가 정보를 한 곳에 쌓아 학습 효율을 높이는 도구가 필요했다. solved.ac 가 백준(BOJ)에 대해 제공하는 가치를 프로그래머스 쪽으로 가져오되, "수동 등록" 이라는 제약을 인정하고 그 안에서 차별점(커스텀 티어, AI, 커뮤니티)을 더한 형태로, 최근 백준 서비스가 종료됨에 따라 프로그래머스의 가치가 높아진다고 판단하여(백준과 함께 양대산맥처럼 코딩 테스트 부문을 대표하는 사이트이므로) 만들어보게 됨.

---

## ✨ 주요 기능

### 핵심

- **약 700개의 프로그래머스 문제** 메타데이터 (제목·출처·정답률·링크·태그)
- **커스텀 15단계 티어** (Bronze III ~ Diamond I) — Bayesian shrinkage 로 사용자 피드백 + 정답률 + 원본 레벨을 종합 산정
- **AI 알고리즘 태그 자동 분류** — Claude Sonnet 4.6 + prompt caching 으로 대량 분류 (taxonomy 고정 25개)
- **풀이 등록** — URL 붙여넣기 자동 매칭 / 코드 언어 자동 감지 / CodeMirror 에디터 / 메모 4가지 카테고리
- **북마클릿** — 프로그래머스 풀이 페이지에서 한 클릭으로 URL + 코드 + 언어 캡쳐 → codexray 폼 자동 채움
- **AI 풀이 분석** — Claude 가 코드를 읽고 "풀이 설명" 또는 "최적화" 모드로 마크다운 응답 (사용자당 1일 2회 제한)

### 커뮤니티 / 사회적 기능

- **커뮤니티 글** (질문, 풀이 공유) — 마크다운 + 코드 블록 syntax highlight + 작성자 통계 카드
- **건의사항** (레벨 의견, 버그 제보, 기능 요청) — 관리자 답변 + 상태 추적
- **추천 / 비추천 + 정렬** (최신순 / 추천순)
- **신고 + 모더레이션** — 관리자 대시보드에서 게시글 숨김 시 관련 신고 자동 종결
- **알림 시스템** (7종) — 댓글 / 관리자 답변 / 상태 변경 / 게시글 숨김 / 신고 결과 / 새 신고 (관리자) / 티어 진입 / 미해결 건의 다이제스트

### 인증 / 계정

- **3가지 가입 경로**: 비밀번호(이메일 인증) / Google OAuth / Naver OAuth
- **OAuth 기반 자동 관리자 승격** (`ADMIN_EMAIL` 매칭)
- **비밀번호 변경 / 회원 탈퇴** — 탈퇴 시 개인 자산은 cascade 삭제, 공동 자산(커뮤니티 글/댓글)은 익명화 보존
- **공개 프로필 페이지** — 다른 사용자의 풀이 수 / 티어 분포 / 알고리즘 분포 / 작성 글 조회

### 운영 / 인프라

- **API Rate Limiting** — 엔드포인트별 차등 적용 (예: AI 1일 2회, 로그인 1분 10회)
- **스케줄러** — 주간 티어 재계산 / 일간 만료 토큰 정리 / 미해결 건의 다이제스트
- **Swagger API 문서** — 56개 엔드포인트 인터랙티브 문서화 + JWT/X-Admin-Key 인증 테스트
- **테스트** — 34개 단위 테스트 + 1개 E2E 흐름 테스트

---

## 🛠 기술 스택

**Backend**

- NestJS 11 (TypeScript) + Express
- Prisma 7 + PostgreSQL
- JWT (Passport) + Google/Naver OAuth2
- bcrypt, class-validator, nodemailer
- @nestjs/throttler (rate limiting)
- @nestjs/schedule (cron)
- Jest + supertest (테스트)

**Frontend**

- React 19 + Vite 8 + TypeScript
- TanStack Query (서버 상태)
- Zustand (클라이언트 상태)
- Tailwind CSS 4
- CodeMirror 6 + VSCode 테마
- react-markdown + remark-gfm

**AI / 외부**

- Anthropic Claude SDK (`claude-sonnet-4-6` for tagging, `claude-opus-4-7` 호환)
- Puppeteer (CLI 스크립트로 본문 스크래핑)

---

## 🏗 주요 설계 결정

### 1. 커스텀 티어 산정 — Bayesian shrinkage

프로그래머스의 공식 레벨(0~5)은 너무 단조롭고, 사용자 체감 난이도와 종종 불일치하기 때문에 다음 공식으로 보정:

```
adjustedLevel = (α × origLevel + β × arLevel + ΣuserFeedbacks) / (α + β + n)
```

- `α=2`, `β=2` (prior 가중치 — 피드백 적을 때 원본 + 정답률에 의존)
- `arLevel` = 정답률 기반 환산 (`5 × (1 - rate/100)`)
- 피드백 누적 시 점진적으로 사용자 평균으로 수렴

15단계 티어 = 5 패밀리(Bronze/Silver/Gold/Platinum/Diamond) × 3 서브티어(III/II/I).

### 2. 회원 탈퇴 — 익명화 보존 vs Cascade 삭제

**개인 자산** (풀이, 노트, 메모, 북마크, 피드백, 투표, 신고) 은 `onDelete: Cascade` 로 즉시 삭제.
**공동 자산** (커뮤니티 글, 댓글) 은 `onDelete: SetNull` 로 익명화 보존 — 다른 사용자의 토론 맥락 / 관리자 답변이 함께 사라지는 손실 방지. GDPR right-to-be-forgotten 의 본질은 _식별 가능 정보 제거_ 이지 _기여 콘텐츠 제거_ 가 아니라는 해석.

### 3. 인증 정체성 단일화

**한 이메일 = 한 계정** 정책. LOCAL ↔ OAuth 같은 이메일로 둘 다 가입 불가. 미인증 LOCAL 계정만 OAuth 가입 시 자동 덮어쓰기 (선점 공격 방어).

### 4. Rate limit Tracker 차등화

인증 후엔 `user.id` 기반 추적, 익명 요청은 IP 기반. NAT 뒤 동일 IP 사용자들이 함께 차단되는 가짜 양성 완화.

### 5. 스케줄러는 In-Memory + 한계 인정

NestJS `@Schedule()` 의 in-memory cron 은 서버 다운 시 누락된다는 한계 인지. 진지한 운영에선 BullMQ + Redis 또는 OS-level cron 로 옮길 계획이지만 현 스코프엔 충분.

### 6. AI 비용 통제

사용자당 1일 2회 제한 (`@Throttle({ ttl: 24h, limit: 2 })`) — 봇/오용으로 인한 API 비용 폭주 방어.

### 7. 신고 ↔ 게시글 모더레이션 연계

관리자가 신고된 글을 숨기면 해당 글의 OPEN 신고들이 자동 HANDLED 로 전이. 신고자에게도 자동 알림 발송. 한 번의 액션으로 전체 사이클 종결.

### 8. 마크다운 + CodeMirror 코드 블록

커뮤니티 글 / 풀이 공유 / 관리자 답변 모두 마크다운 렌더링. 펜스드 코드 블록(```python)은 CodeMirror 로 실제 에디터 수준의 syntax highlight + 한 클릭 전체 복사 버튼.

---

## 📁 디렉토리 구조

```
codeXray/
├── backend/                          NestJS API 서버
│   ├── src/
│   │   ├── auth/                     로그인 / OAuth / 이메일 인증 / 가드 / 토큰
│   │   ├── users/                    프로필 / 비번 변경 / 탈퇴
│   │   ├── problems/                 문제 CRUD + 검색/필터
│   │   ├── solutions/                내 풀이 + 메모
│   │   ├── notes/                    개인 노트
│   │   ├── bookmarks/                북마크
│   │   ├── community/                커뮤니티 / 건의사항 / 투표 / 신고
│   │   ├── notifications/            알림 시스템
│   │   ├── ratings/                  티어 산정 (Bayesian)
│   │   ├── tags/                     알고리즘 태그
│   │   ├── ai/                       Claude 풀이 분석
│   │   ├── mail/                     인증 메일 발송 (SMTP / dev 콘솔)
│   │   ├── scheduler/                cron jobs + 수동 트리거
│   │   └── prisma/                   Prisma client wrapper
│   ├── prisma/
│   │   ├── schema.prisma             단일 스키마 파일
│   │   ├── migrations/               13개 SQL 마이그레이션
│   │   ├── seed.ts                   문제/태그 시드
│   │   ├── fetch-problems.ts         프로그래머스 문제 목록 갱신
│   │   ├── scrape-descriptions.ts    Puppeteer 본문 스크래핑
│   │   └── tag-problems.ts           Claude 배치 태그 분류 + caching
│   ├── test/                         E2E 테스트
│   └── ADMIN.md                      관리자 운영 가이드
└── frontend/                         React + Vite SPA
    ├── src/
    │   ├── pages/                    각 라우트 페이지 (20+)
    │   ├── components/
    │   │   ├── common/               공용 UI (PostContent, CopyButton, TierBadge, ...)
    │   │   └── layout/               Navbar / NotificationBell / Layout
    │   ├── api/                      axios 기반 API 클라이언트
    │   ├── store/                    Zustand auth store
    │   ├── utils/                    detectLanguage, formatNotification 등
    │   └── types/                    공유 TypeScript 타입
    └── public/
```

---

## 🧪 테스트

```bash
cd backend
npm test                         # 단위 테스트 (5 suites · 34 cases · ~1초)
npm run test:e2e                 # E2E 테스트 (회원가입 → 인증 → 로그인 흐름)
```

**테스트 전략**

- 단위 테스트: Prisma + 외부 의존성 mock. 비즈니스 로직 (Bayesian 공식, 익명화, 권한 분기, 알림 trigger 조건) 위주
- E2E: 실제 NestJS 앱 + Supertest, `MailService` 만 mock. 핵심 인증 흐름 한 개로 가입 → DB 검증 → 인증 → 로그인까지 통합 보장

---

## 🗺 향후 개선 사항 (스코프 외 의식)

| 항목                | 현재                          | 향후                                        |
| ------------------- | ----------------------------- | ------------------------------------------- |
| **배포**            | 로컬 only                     | AWS / Render 배포 + 도메인                  |
| **CI/CD**           | 없음                          | GitHub Actions 로 PR 시 typecheck + 테스트  |
| **컨테이너화**      | 없음                          | Dockerfile + docker-compose (postgres 포함) |
| **스케줄러 안정성** | in-memory (서버 다운 시 누락) | BullMQ + Redis 로 작업 영속화               |
| **알림 실시간성**   | 30초 폴링                     | SSE 또는 WebSocket                          |
| **계정 연결**       | 한 이메일 = 한 provider       | 같은 계정에 여러 provider 연결              |
| **관찰 가능성**     | Logger only                   | Pino 구조화 로그 + Sentry + 메트릭          |
| **에러 응답 통일**  | 컨트롤러별 분산               | Global ExceptionFilter                      |
| **API 버전 관리**   | 단일 prefix                   | `/api/v1` 명시                              |

---

## 📝 회고

### 잘된 점

- 단순 CRUD 를 넘어 **Bayesian shrinkage 같은 알고리즘** 을 핵심 가치로 가져옴
- **운영 측면** (rate limit, 스케줄러, 모더레이션, 알림 시스템) 까지 의식해서 설계
- **trade-off 의식적 선택** — 익명화 vs cascade, in-memory vs Redis 등 한계 인정하며 결정
- 실제 사용 가능한 수준의 기능들이 있는 서비스라는 점

### 아쉬운 점

- 실제 배포 전 단계 — 로컬에서만 동작
- 부하 테스트 / 메트릭 측정 미실시
- 프론트엔드 모바일 반응형 미점검 (백엔드가 메인이고 프론트는 바이브 코딩이라서 우선순위 낮춤)
- 프로그래머스 측 API가 없어서 풀이 등록을 북마클릿을 통해 해야 되는 등, 일부 기능들에 불편함이 어느정도 존재

### 배운 점

- **수동 등록의 본질적 한계** 를 외부 API 의존 회피로 해석하지 않고 "사용자 부담 줄이는 방향" (북마클릿, 자동 감지) 으로 풀어낸 게 가장 큰 학습
- 작은 기능 하나(예: 회원 탈퇴) 도 데이터 보존 정책까지 따져야 정합성 유지된다는 점
