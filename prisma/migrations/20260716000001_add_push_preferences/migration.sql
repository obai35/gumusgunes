-- CreateTable
CREATE TABLE "PushPreference" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "newConversation" BOOLEAN NOT NULL DEFAULT true,
    "newMessage" BOOLEAN NOT NULL DEFAULT true,
    "assignmentChanged" BOOLEAN NOT NULL DEFAULT true,
    "sound" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursFrom" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursTo" TEXT NOT NULL DEFAULT '08:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushPreference_adminId_key" ON "PushPreference"("adminId");

-- AddForeignKey
ALTER TABLE "PushPreference" ADD CONSTRAINT "PushPreference_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
