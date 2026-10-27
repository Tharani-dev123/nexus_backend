-- Collapse Employee.firstName + Employee.lastName into a single `name` column,
-- preserving existing data instead of dropping it.

-- 1. Add the new column as nullable so the backfill can run.
ALTER TABLE "Employee" ADD COLUMN "name" TEXT;

-- 2. Backfill from the old columns ("First Last", trimmed; lastName may be null).
UPDATE "Employee"
SET "name" = NULLIF(TRIM(BOTH ' ' FROM COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')), '');

-- 3. Guard against any row that somehow ended up empty (schema requires NOT NULL).
UPDATE "Employee" SET "name" = "employeeCode" WHERE "name" IS NULL;

-- 4. Enforce the NOT NULL contract now that every row has a value.
ALTER TABLE "Employee" ALTER COLUMN "name" SET NOT NULL;

-- 5. Drop the old columns.
ALTER TABLE "Employee" DROP COLUMN "firstName";
ALTER TABLE "Employee" DROP COLUMN "lastName";
