-- CommunityPost.hidden
ALTER TABLE "CommunityPost" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- ReportStatus enum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'HANDLED', 'DISMISSED');

-- PostVote
CREATE TABLE "PostVote" (
  "userId"    INTEGER      NOT NULL,
  "postId"    INTEGER      NOT NULL,
  "value"     INTEGER      NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PostVote_pkey" PRIMARY KEY ("userId", "postId"),
  CONSTRAINT "PostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PostVote_postId_idx" ON "PostVote"("postId");

-- PostReport
CREATE TABLE "PostReport" (
  "id"        SERIAL          PRIMARY KEY,
  "userId"    INTEGER         NOT NULL,
  "postId"    INTEGER         NOT NULL,
  "reason"    TEXT            NOT NULL,
  "status"    "ReportStatus"  NOT NULL DEFAULT 'OPEN',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "PostReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PostReport_userId_postId_key" ON "PostReport"("userId", "postId");
CREATE INDEX "PostReport_postId_idx" ON "PostReport"("postId");
CREATE INDEX "PostReport_status_idx" ON "PostReport"("status");
