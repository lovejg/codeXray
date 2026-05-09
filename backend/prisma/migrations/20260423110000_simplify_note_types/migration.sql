-- Drop Note table (verified empty) and recreate with new enum
DROP TABLE IF EXISTS "Note";
DROP TYPE IF EXISTS "NoteType";

CREATE TYPE "NoteType" AS ENUM ('CODE', 'PATTERN', 'MISTAKE', 'OTHER');

CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'CODE',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "language" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
