-- Add costPrice to Product
ALTER TABLE "Product" ADD COLUMN "costPrice" DOUBLE PRECISION;

-- Add actualCost to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "actualCost" DOUBLE PRECISION;

-- Add accounting fields to JournalEntry
ALTER TABLE "JournalEntry" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EGP';
ALTER TABLE "JournalEntry" ADD COLUMN "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "JournalEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "JournalEntry" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN "approvedAt" TIMESTAMPTZ;
ALTER TABLE "JournalEntry" ADD COLUMN "rejectedReason" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN "reversesId" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN "fxGainLoss" DOUBLE PRECISION;

-- Foreign keys for JournalEntry
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Admin"(id) ON DELETE SET NULL;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "JournalEntry"(id) ON DELETE SET NULL;

-- Indexes for JournalEntry
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");
CREATE INDEX "JournalEntry_approvedById_idx" ON "JournalEntry"("approvedById");

-- Create ScheduledReport table
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "schedule" TEXT NOT NULL,
    "cronExpression" TEXT,
    "recipients" TEXT NOT NULL DEFAULT '[]',
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "lastSentAt" TIMESTAMPTZ,
    "nextRunAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScheduledReport_nextRunAt_idx" ON "ScheduledReport"("nextRunAt");
CREATE INDEX "ScheduledReport_isActive_idx" ON "ScheduledReport"("isActive");

-- Create Employee table
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- Create PayrollRun table
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "totalSalaries" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "processedById" TEXT,
    "paidAt" TIMESTAMPTZ,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "Admin"(id) ON DELETE SET NULL;
CREATE INDEX "PayrollRun_status_idx" ON "PayrollRun"("status");

-- Create PayrollItem table
CREATE TABLE "PayrollItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"(id) ON DELETE CASCADE;
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"(id) ON DELETE RESTRICT;
CREATE INDEX "PayrollItem_runId_idx" ON "PayrollItem"("runId");
