-- Add demonstrable registration consent and link authenticated scheduling responses for GDPR erasure/export.
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

ALTER TABLE "SchedulingResponse" ADD COLUMN "userId" TEXT;

CREATE INDEX "SchedulingResponse_userId_idx" ON "SchedulingResponse"("userId");

ALTER TABLE "SchedulingResponse" ADD CONSTRAINT "SchedulingResponse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
