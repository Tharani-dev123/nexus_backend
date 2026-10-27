-- CreateTable
CREATE TABLE "Gratuity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "leavingDate" TIMESTAMP(3) NOT NULL,
    "lastDrawnSalary" DECIMAL(15,2) NOT NULL,
    "completedService" DOUBLE PRECISION NOT NULL,
    "gratuityAmount" DECIMAL(15,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gratuity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LWP" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYear" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lwpDays" INTEGER NOT NULL,
    "reason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LWP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gratuity_companyId_employeeId_key" ON "Gratuity"("companyId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LWP_companyId_employeeId_financialYear_month_key" ON "LWP"("companyId", "employeeId", "financialYear", "month");

-- AddForeignKey
ALTER TABLE "Gratuity" ADD CONSTRAINT "Gratuity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gratuity" ADD CONSTRAINT "Gratuity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LWP" ADD CONSTRAINT "LWP_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LWP" ADD CONSTRAINT "LWP_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
