UPDATE "Expense"
SET "approvedAt" = "expenseDate"
WHERE "status" = 'APPROVED'
  AND "approvedAt" IS NULL;
