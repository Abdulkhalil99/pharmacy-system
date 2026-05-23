import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Language, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const connectionLabel = process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL';

if (!connectionString) {
  throw new Error('DATABASE_URL or DIRECT_URL must be set before running the seed script.');
}

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 0,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');
  console.log(`🔌 Using ${connectionLabel} for database connection`);

  // ─── 1. Admin User ────────────────────────────────────────────────────────
  // We use upsert instead of create so running seed twice doesn't crash.
  // upsert = "create if not exists, update if exists"
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},  // Don't change anything if user already exists
    create: {
      name: 'Admin کاربر',
      username: 'admin',
      password: hashedPassword,
      role: Role.ADMIN,
      language: Language.fa,
    },
  });
  console.log(`✅ Admin user created: ${admin.username}`);

  // Also create a sample pharmacist
  const pharmacistPassword = await bcrypt.hash('pharma123', 12);
  await prisma.user.upsert({
    where: { username: 'pharmacist1' },
    update: {},
    create: {
      name: 'احمد داروساز',
      username: 'pharmacist1',
      password: pharmacistPassword,
      role: Role.PHARMACIST,
      language: Language.fa,
    },
  });
  console.log('✅ Pharmacist user created');

  // ─── 2. Sample Companies ──────────────────────────────────────────────────
  await Promise.all([
    prisma.company.upsert({
      where: { name: 'داروسازی افغان' },
      update: {},
      create: {
        name: 'داروسازی افغان',
        phone: '+93700000001',
        address: 'کابل، ناحیه سوم',
        totalPurchased: 0,
        totalPaid: 0,
        balance: 0,
      },
    }),
    prisma.company.upsert({
      where: { name: 'شرکت دارویی سینا' },
      update: {},
      create: {
        name: 'شرکت دارویی سینا',
        phone: '+93700000002',
        address: 'مزار شریف، سرک اصلی',
        totalPurchased: 0,
        totalPaid: 0,
        balance: 0,
      },
    }),
  ]);
  console.log('✅ 2 companies created');

  // ─── 3. Sample Medicines ──────────────────────────────────────────────────
  // We use createMany for efficiency — one DB round-trip for all 5
  // skipDuplicates: true means re-running seed won't fail on existing barcodes
  const medicines = await prisma.medicine.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Amoxicillin 500mg',
        barcode: '6001010000001',
        company: 'GlaxoSmithKline',
        buyPrice: 15,
        sellPrice: 25,
        quantity: 200,
        minQuantity: 30,
        expiryDate: new Date('2026-12-31'),
      },
      {
        name: 'Paracetamol 500mg',
        barcode: '6001010000002',
        company: 'Afghan Pharma',
        buyPrice: 5,
        sellPrice: 10,
        quantity: 500,
        minQuantity: 50,
        expiryDate: new Date('2027-06-30'),
      },
      {
        name: 'Metformin 850mg',
        barcode: '6001010000003',
        company: 'Sina Pharma',
        buyPrice: 20,
        sellPrice: 35,
        quantity: 150,
        minQuantity: 25,
        expiryDate: new Date('2026-09-30'),
      },
      {
        name: 'Omeprazole 20mg',
        barcode: '6001010000004',
        company: 'Novartis',
        buyPrice: 18,
        sellPrice: 30,
        quantity: 100,
        minQuantity: 20,
        expiryDate: new Date('2026-03-31'),
      },
      {
        name: 'Vitamin C 1000mg',
        barcode: '6001010000005',
        company: 'Afghan Pharma',
        buyPrice: 8,
        sellPrice: 15,
        quantity: 300,
        minQuantity: 40,
        expiryDate: new Date('2027-12-31'),
      },
    ],
  });
  console.log(`✅ ${medicines.count} medicines created`);

  // ─── 4. Sample Customer ───────────────────────────────────────────────────
  await prisma.customer.upsert({
    where: { phone: '+93700111222' },
    update: {},
    create: {
      name: 'محمد علی',
      phone: '+93700111222',
      totalDebt: 0,
    },
  });
  console.log('✅ Sample customer created');

  console.log('\n🎉 Seed complete! Login with:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
}

// Run main(), and if it throws, log the error and exit with code 1
// (non-zero exit code = failure, important for CI/CD pipelines)
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect the Prisma client when done
    // If you forget this, the Node process hangs forever
    await prisma.$disconnect();
    await pool.end();
  });
