-- AuthProvider enum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'NAVER');

-- User: password nullable, emailVerified, provider, providerId
ALTER TABLE "User"
  ALTER COLUMN "password" DROP NOT NULL,
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "providerId" TEXT;

-- 기존 유저는 이미 비번으로 가입한 상태로 간주 → emailVerified = true 로 승격
-- (운영 중 스키마 변경이면 true 로 주는 게 UX 상 맞음. 깨끗이 리셋할 거면 이 줄 지우면 됨.)
UPDATE "User" SET "emailVerified" = true;

-- ADMIN 승격 기준과 일관성 확보: 이미 ADMIN 으로 들어있는 계정은 그대로 둠

CREATE UNIQUE INDEX "User_provider_providerId_key"
  ON "User"("provider", "providerId")
  WHERE "providerId" IS NOT NULL;

-- EmailVerificationToken table
CREATE TABLE "EmailVerificationToken" (
  "id"         SERIAL       PRIMARY KEY,
  "token"      TEXT         NOT NULL,
  "userId"     INTEGER      NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "usedAt"     TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
