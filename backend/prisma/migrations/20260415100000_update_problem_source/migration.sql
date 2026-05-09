-- AlterEnum: Replace ProblemSource with updated values (remove SAMSUNG, add KAKAO_CODE, MONTHLY_CHALLENGE, WEEKLY_CHALLENGE, PCCE, SQL)
BEGIN;
CREATE TYPE "ProblemSource_new" AS ENUM (
  'PRACTICE',
  'KAKAO_BLIND',
  'KAKAO_INTERNSHIP',
  'KAKAO_CODE',
  'MONTHLY_CHALLENGE',
  'WEEKLY_CHALLENGE',
  'SUMMER_WINTER',
  'PCCE',
  'PCCP',
  'SQL',
  'OTHER'
);
ALTER TABLE "Problem" ALTER COLUMN "source" TYPE "ProblemSource_new" USING ("source"::text::"ProblemSource_new");
DROP TYPE "ProblemSource";
ALTER TYPE "ProblemSource_new" RENAME TO "ProblemSource";
COMMIT;
