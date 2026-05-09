-- CreateEnum
CREATE TYPE "Tier" AS ENUM (
  'BRONZE_III', 'BRONZE_II', 'BRONZE_I',
  'SILVER_III', 'SILVER_II', 'SILVER_I',
  'GOLD_III', 'GOLD_II', 'GOLD_I',
  'PLATINUM_III', 'PLATINUM_II', 'PLATINUM_I',
  'DIAMOND_III', 'DIAMOND_II', 'DIAMOND_I'
);

-- AlterTable: add acceptanceRate, tier to Problem
ALTER TABLE "Problem" ADD COLUMN "acceptanceRate" DOUBLE PRECISION;
ALTER TABLE "Problem" ADD COLUMN "tier" "Tier";

-- CreateTable: LevelFeedback
CREATE TABLE "LevelFeedback" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "problemId" INTEGER NOT NULL,
  "level" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LevelFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelFeedback_userId_problemId_key" ON "LevelFeedback"("userId", "problemId");

-- AddForeignKey
ALTER TABLE "LevelFeedback" ADD CONSTRAINT "LevelFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LevelFeedback" ADD CONSTRAINT "LevelFeedback_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
