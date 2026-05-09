-- 탈퇴한 사용자의 커뮤니티 글/댓글을 익명화하여 보존하기 위해
-- 외래키를 SET NULL 정책 + 컬럼을 nullable 로 전환

-- CommunityPost.userId
ALTER TABLE "CommunityPost" DROP CONSTRAINT "CommunityPost_userId_fkey";
ALTER TABLE "CommunityPost" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "CommunityPost"
  ADD CONSTRAINT "CommunityPost_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comment.userId
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";
ALTER TABLE "Comment" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
