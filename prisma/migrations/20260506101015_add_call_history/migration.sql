-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('audio', 'video');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ringing', 'answered', 'missed');

-- CreateTable
CREATE TABLE "CallHistory" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "streamCallId" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "participantIds" TEXT[],
    "type" "CallType" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'ringing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,

    CONSTRAINT "CallHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Participants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Participants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "CallHistory_callerId_idx" ON "CallHistory"("callerId");

-- CreateIndex
CREATE INDEX "CallHistory_channelId_idx" ON "CallHistory"("channelId");

-- CreateIndex
CREATE INDEX "_Participants_B_index" ON "_Participants"("B");

-- AddForeignKey
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Participants" ADD CONSTRAINT "_Participants_A_fkey" FOREIGN KEY ("A") REFERENCES "CallHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Participants" ADD CONSTRAINT "_Participants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
