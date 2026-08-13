-- Additive lockout + revocation fields for POS (Branch authenticates POS logins).
ALTER TABLE "Branch" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Branch" ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "Branch" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Single-use, index-addressable backup codes for 2FA recovery.
CREATE TABLE "BackupCode" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BackupCode_ownerId_ownerType_idx" ON "BackupCode"("ownerId", "ownerType");

CREATE UNIQUE INDEX "BackupCode_ownerId_ownerType_index_key" ON "BackupCode"("ownerId", "ownerType", "index");
