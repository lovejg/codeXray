-- 기존 데이터 정리: 제거할 enum 값이 사용 중이면 안전한 값으로 치환
UPDATE "CommunityPost" SET "type" = 'FEEDBACK' WHERE "type" = 'PROBLEM_REQUEST';
UPDATE "CommunityPost" SET "status" = NULL WHERE "status" IN ('OPEN', 'REJECTED');

-- PostType 에서 PROBLEM_REQUEST 제거
CREATE TYPE "PostType_new" AS ENUM ('QUESTION', 'SOLUTION_SHARE', 'FEEDBACK', 'BUG_REPORT', 'FEATURE_REQUEST');
ALTER TABLE "CommunityPost" ALTER COLUMN "type" TYPE "PostType_new" USING "type"::text::"PostType_new";
DROP TYPE "PostType";
ALTER TYPE "PostType_new" RENAME TO "PostType";

-- SuggestionStatus 에서 OPEN, REJECTED 제거
CREATE TYPE "SuggestionStatus_new" AS ENUM ('IN_PROGRESS', 'RESOLVED');
ALTER TABLE "CommunityPost" ALTER COLUMN "status" TYPE "SuggestionStatus_new" USING "status"::text::"SuggestionStatus_new";
DROP TYPE "SuggestionStatus";
ALTER TYPE "SuggestionStatus_new" RENAME TO "SuggestionStatus";
