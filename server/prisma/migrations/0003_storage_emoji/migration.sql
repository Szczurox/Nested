CREATE TABLE "Emoji" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Emoji_groupId_createdAt_idx" ON "Emoji"("groupId", "createdAt");
CREATE UNIQUE INDEX "Emoji_groupId_name_key" ON "Emoji"("groupId", "name");

ALTER TABLE "Emoji" ADD CONSTRAINT "Emoji_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
