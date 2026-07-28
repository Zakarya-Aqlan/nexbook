CREATE TYPE "ActivityType" AS ENUM (
  'booked',
  'updated',
  'cancelled',
  'completed'
);

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "bookingId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "resourceName" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "studentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dedupeKey" TEXT,
  "clientEventKey" TEXT,

  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Activity_dedupeKey_key" ON "Activity"("dedupeKey");
CREATE UNIQUE INDEX "Activity_clientEventKey_key" ON "Activity"("clientEventKey");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX "Activity_bookingId_idx" ON "Activity"("bookingId");
