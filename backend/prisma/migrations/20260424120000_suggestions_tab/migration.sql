-- User role
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Suggestion status
CREATE TYPE "SuggestionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- Extend PostType with suggestion types
ALTER TYPE "PostType" ADD VALUE 'BUG_REPORT';
ALTER TYPE "PostType" ADD VALUE 'FEATURE_REQUEST';
ALTER TYPE "PostType" ADD VALUE 'PROBLEM_REQUEST';

-- CommunityPost new columns
ALTER TABLE "CommunityPost"
  ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" "SuggestionStatus",
  ADD COLUMN "adminReply" TEXT,
  ADD COLUMN "adminReplyAt" TIMESTAMP(3);

-- Backfill: 기존 FEEDBACK 게시글은 기본 상태 OPEN 으로
UPDATE "CommunityPost" SET "status" = 'OPEN' WHERE "type" = 'FEEDBACK' AND "status" IS NULL;
