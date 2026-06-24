-- CreateEnum
CREATE TYPE "DrugKind" AS ENUM (
    'SYRUP',
    'TABLET',
    'CAPSULE',
    'INJECTION',
    'DROPS',
    'CREAM',
    'OINTMENT',
    'GEL',
    'POWDER',
    'SPRAY',
    'LOTION',
    'SUPPOSITORY',
    'SUSPENSION',
    'SOLUTION',
    'INHALER'
);

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN "kind" "DrugKind" NOT NULL DEFAULT 'TABLET';
