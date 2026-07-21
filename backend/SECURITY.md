# 보안 개요 (CodeXray Backend)

이 문서는 백엔드의 인증/인가 설계와 보안 점검 결과를 정리한다.

## 인증 아키텍처 — Access / Refresh Token

세션은 **단기 access token + 장기 refresh token** 조합으로 관리한다.

| 토큰 | 형태 | 유효기간 | 저장 |
|------|------|----------|------|
| Access token | JWT (HS256) | **15분** | 클라이언트 메모리/localStorage |
| Refresh token | 랜덤 40바이트 hex | **30일** | 클라이언트 + 서버(**SHA-256 해시만**) |

- Access token 이 짧아 **탈취되어도 노출 시간이 15분**으로 제한된다.
- Refresh token 의 **raw 값은 서버에 저장하지 않고 SHA-256 해시만 보관** → DB 유출 시에도 토큰 자체는 복원 불가.

### 로테이션 + 재사용 감지 (Reuse Detection)

`RefreshToken` 은 `family`(로그인 세션 식별자)를 가진다.

1. 로그인 시 새 `family` 로 refresh token 발급.
2. `POST /auth/refresh` 호출 시 기존 토큰을 **폐기(revoke)하고 같은 family 로 새 토큰을 발급**(rotation).
3. **이미 폐기된 토큰이 다시 들어오면 = 탈취 의심** → 해당 `family` 전체를 폐기하고 재로그인을 강제한다.
4. `POST /auth/logout` 은 해당 `family` 전체를 폐기한다.

> 공격자가 refresh token 을 탈취해 사용하면, 정상 사용자의 다음 rotation 때 "이미 폐기된 토큰 재사용"이 감지되어 세션 전체가 무효화된다.

관련 코드: [`src/auth/refresh-token.service.ts`](src/auth/refresh-token.service.ts) · 테스트: [`src/auth/refresh-token.service.spec.ts`](src/auth/refresh-token.service.spec.ts)

### 프론트엔드 연동

- `axios` 응답 인터셉터가 **401 발생 시 자동으로 refresh 후 원 요청을 1회 재시도**한다.
- 동시에 여러 요청이 401 을 받아도 refresh 는 **한 번만** 수행한다(single-flight, thundering herd 방지).
- refresh 실패(만료/재사용 감지) 시 토큰을 비우고 `/login` 으로 이동.

관련 코드: `frontend/src/api/client.ts`, `frontend/src/lib/tokens.ts`

### ⚠️ 배포 시 필요한 마이그레이션

`RefreshToken` 테이블 추가 마이그레이션이 포함되어 있다. 적용 필요:

```bash
npx prisma migrate deploy   # 운영
# 또는 개발 DB 세팅 시
npx prisma migrate dev
```

## 점검 항목 및 조치

### 수정 완료
- **관리자 가드 우회 버그**: `X-Admin-Key` 미설정(`undefined`) 시 가드가 통과되던 문제 → 키 미설정이면 무조건 차단 + `crypto.timingSafeEqual` 상수시간 비교. ([`admin.guard.ts`](src/auth/guards/admin.guard.ts))
- **보안 HTTP 헤더**: `helmet` 적용. ([`main.ts`](src/main.ts))
- **입력 길이 제한(DoS/저장 남용 방어)**: 게시글·댓글·노트·풀이 코드·AI 코드 등 모든 자유 텍스트 DTO 에 `MaxLength` 적용. 비밀번호는 bcrypt 72바이트 한계에 맞춰 상한.
- **Refresh token 로테이션 + 재사용 감지** 도입 (위 참조), access token 7일 → 15분 단축.

### 점검 후 양호
- **인가(IDOR)**: 사용자 소유 리소스(notes/solutions/bookmarks)는 모두 `userId` 스코프 + 소유권 검증.
- **비밀번호**: bcrypt(10 rounds), 변경 시 현재 비밀번호 재검증.
- **이메일 인증 토큰**: `randomBytes(32)` 암호학적 토큰, 1회용, 24h TTL, 트랜잭션 원자성.
- **주입(injection)**: raw SQL 없음 — Prisma 파라미터 바인딩만 사용.
- **Mass assignment**: DTO 에 role/권한 필드 없음 + 전역 `ValidationPipe({ whitelist, forbidNonWhitelisted })`.
- **Rate limiting**: 로그인 10/분, 회원가입 5/시간, 인증메일 재전송 1/분, refresh 30/분, AI 분석 2/일(사용자 단위).
- **시크릿 관리**: JWT secret 은 `ConfigService.getOrThrow`, `.env` 는 gitignore(`.env.example` 만 추적).

### 알려진 트레이드오프 (의도적 선택)
- **로그인 시 provider 노출**: OAuth 로 가입된 이메일에 비밀번호 로그인 시 "다른 방식으로 가입됨"을 안내 → 이메일 존재가 드러나지만, 이는 대부분 서비스가 UX 를 위해 채택하는 방식이다.
- **OAuth 콜백의 토큰 전달**: access/refresh 토큰을 프론트 콜백 URL 쿼리로 전달한다. 표준 리다이렉트 패턴이며, 콜백 페이지에서 즉시 저장 후 URL 을 정리한다.
