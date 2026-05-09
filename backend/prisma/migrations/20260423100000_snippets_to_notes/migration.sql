-- Drop old Snippet table (verified empty)
DROP TABLE IF EXISTS "Snippet";

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CODE', 'PATTERN', 'MISTAKE', 'TIP', 'CHEATSHEET');

-- CreateTable
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

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
