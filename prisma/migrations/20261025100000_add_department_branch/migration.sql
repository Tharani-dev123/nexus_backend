ALTER TABLE "Department"
ADD COLUMN "branchId" TEXT;

DROP INDEX IF EXISTS "Department_companyId_name_deletedAt_key";

CREATE UNIQUE INDEX "Department_branchId_name_deletedAt_key"
ON "Department"("branchId", "name", "deletedAt");

CREATE INDEX "Department_companyId_idx"
ON "Department"("companyId");

ALTER TABLE "Department"
ADD CONSTRAINT "Department_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
