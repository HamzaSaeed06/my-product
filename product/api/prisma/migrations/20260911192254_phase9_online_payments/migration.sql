-- CreateEnum
CREATE TYPE "PaymentGatewayProvider" AS ENUM ('EASYPAISA', 'JAZZCASH', 'SIMULATED');

-- CreateEnum
CREATE TYPE "GatewayTransactionStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "gatewayRefundReference" TEXT;

-- CreateTable
CREATE TABLE "payment_gateways" (
    "id" TEXT NOT NULL,
    "provider" "PaymentGatewayProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "webhookSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gateway_transactions" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "gatewayTxnId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "GatewayTransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_callbacks" (
    "id" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayTxnId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "rawBody" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_callbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gateway_transactions_attemptId_key" ON "gateway_transactions"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_transactions_gatewayTxnId_key" ON "gateway_transactions"("gatewayTxnId");

-- AddForeignKey
ALTER TABLE "gateway_transactions" ADD CONSTRAINT "gateway_transactions_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "payment_gateways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gateway_transactions" ADD CONSTRAINT "gateway_transactions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "payment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_callbacks" ADD CONSTRAINT "payment_callbacks_gatewayTransactionId_fkey" FOREIGN KEY ("gatewayTransactionId") REFERENCES "gateway_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

