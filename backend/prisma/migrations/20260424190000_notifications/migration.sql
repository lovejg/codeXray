-- NotificationType enum
CREATE TYPE "NotificationType" AS ENUM (
  'COMMENT',
  'ADMIN_REPLY',
  'STATUS_CHANGE',
  'POST_HIDDEN',
  'REPORT_RESOLVED',
  'NEW_REPORT',
  'TIER_UP'
);

-- Notification table
CREATE TABLE "Notification" (
  "id"        SERIAL              PRIMARY KEY,
  "userId"    INTEGER             NOT NULL,
  "type"      "NotificationType"  NOT NULL,
  "payload"   JSONB               NOT NULL,
  "isRead"    BOOLEAN             NOT NULL DEFAULT false,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
