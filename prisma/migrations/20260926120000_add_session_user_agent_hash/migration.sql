-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "userAgentHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_userAgentHash_key" ON "Session"("userId", "userAgentHash");

