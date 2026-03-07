-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "postcode" TEXT,
    "propertyType" TEXT,
    "service" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "message" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT NOT NULL,
    "timeline" TEXT,
    "timelineDetails" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_token_key" ON "Consultation"("token");

-- CreateIndex
CREATE INDEX "Consultation_token_idx" ON "Consultation"("token");

-- CreateIndex
CREATE INDEX "Consultation_email_idx" ON "Consultation"("email");
