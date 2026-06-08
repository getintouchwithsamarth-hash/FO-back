-- DropIndex
DROP INDEX "CurrencyRate_baseCurrency_targetCurrency_rateDate_key";

-- AlterTable
ALTER TABLE "CurrencyRate" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'MMM d, yyyy',
ADD COLUMN     "numberFormat" TEXT NOT NULL DEFAULT 'en-IN',
ADD COLUMN     "preferredCurrency" TEXT NOT NULL DEFAULT 'INR';

-- CreateIndex
CREATE INDEX "CurrencyRate_organizationId_baseCurrency_targetCurrency_rat_idx" ON "CurrencyRate"("organizationId", "baseCurrency", "targetCurrency", "rateDate");

-- AddForeignKey
ALTER TABLE "CurrencyRate" ADD CONSTRAINT "CurrencyRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
