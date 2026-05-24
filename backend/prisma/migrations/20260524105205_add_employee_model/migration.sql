-- AlterTable
ALTER TABLE "users"
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastLogin" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "createdById" TEXT;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "salary_payments"
ADD COLUMN "employeeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- AddForeignKey
ALTER TABLE "users"
ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees"
ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments"
ADD CONSTRAINT "salary_payments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
