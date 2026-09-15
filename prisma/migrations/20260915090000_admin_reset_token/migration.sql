-- CreateTable
CREATE TABLE "AdminResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminResetToken_tokenHash_key" ON "AdminResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminResetToken_expiresAt_idx" ON "AdminResetToken"("expiresAt");