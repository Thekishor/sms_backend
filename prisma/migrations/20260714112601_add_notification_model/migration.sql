/*
  Warnings:

  - The values [ADVANCDE] on the enum `PaymentPlan` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentPlan_new" AS ENUM ('INSTALLMENT', 'ADVANCED', 'FULL');
ALTER TABLE "fee_accounts" ALTER COLUMN "paymentPlan" TYPE "PaymentPlan_new" USING ("paymentPlan"::text::"PaymentPlan_new");
ALTER TYPE "PaymentPlan" RENAME TO "PaymentPlan_old";
ALTER TYPE "PaymentPlan_new" RENAME TO "PaymentPlan";
DROP TYPE "public"."PaymentPlan_old";
COMMIT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");
