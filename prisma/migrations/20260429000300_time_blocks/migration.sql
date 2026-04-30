-- CreateTable: TimeBlock for schedule blocking (vacations, holidays, events)
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL,
    "staffId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeBlock_startAt_endAt_idx" ON "TimeBlock"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "TimeBlock_staffId_idx" ON "TimeBlock"("staffId");

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
