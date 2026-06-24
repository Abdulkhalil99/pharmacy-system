import { prisma } from '../utils/prismaClient';
import { AppError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';

const drugKinds = [
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
  'INHALER',
] as const;

export interface MedicineFilters {
  search?: string;
  status?: 'all' | 'low_stock' | 'expiring_soon' | 'expired';
  page?: number;
  limit?: number;
}

export interface CreateMedicineDto {
  name: string;
  kind?: Prisma.MedicineCreateInput['kind'];
  barcode?: string;
  company: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  expiryDate: string;
}

export const medicineService = {
  async getAll(filters: MedicineFilters) {
    const { search, status = 'all', page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const where: Prisma.MedicineWhereInput = {};

    if (search) {
      const normalizedSearch = search.trim().toUpperCase();
      const kindMatch = drugKinds.find((kind) => kind === normalizedSearch);
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        ...(kindMatch ? [{ kind: kindMatch }] : []),
      ];
    }

    if (status === 'expiring_soon') {
      where.expiryDate = { gte: now, lte: in30Days };
    }
    if (status === 'expired') {
      where.expiryDate = { lt: now };
    }

    if (status === 'low_stock') {
      // Prisma can't compare quantity <= minQuantity directly, so filter in JS
      // first and paginate the matching result set afterwards.
      const matchingMedicines = await prisma.medicine.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      const lowStockMedicines = matchingMedicines.filter(
        (medicine) => medicine.quantity <= medicine.minQuantity
      );

      return {
        medicines: lowStockMedicines.slice(skip, skip + limit),
        meta: {
          total: lowStockMedicines.length,
          page,
          limit,
          totalPages: Math.ceil(lowStockMedicines.length / limit),
        },
      };
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicine.count({ where }),
    ]);

    return {
      medicines,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getLowStock() {
    const allMedicines = await prisma.medicine.findMany({ orderBy: { quantity: 'asc' } });
    return allMedicines.filter((medicine) => medicine.quantity <= medicine.minQuantity);
  },

  async getExpiringSoon(days = 30) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return prisma.medicine.findMany({
      where: { expiryDate: { gte: now, lte: future } },
      orderBy: { expiryDate: 'asc' },
    });
  },

  async getById(id: string) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new AppError('Medicine not found', 404);
    return medicine;
  },

  async create(data: CreateMedicineDto) {
    if (data.barcode) {
      const existingMedicine = await prisma.medicine.findUnique({ where: { barcode: data.barcode } });
      if (existingMedicine) throw new AppError('A medicine with this barcode already exists', 409);
    }

    return prisma.medicine.create({
      data: { ...data, expiryDate: new Date(data.expiryDate) },
    });
  },

  async update(id: string, data: Partial<CreateMedicineDto>) {
    await medicineService.getById(id);

    if (data.barcode) {
      const existingMedicine = await prisma.medicine.findFirst({
        where: { barcode: data.barcode, NOT: { id } },
      });
      if (existingMedicine) throw new AppError('A medicine with this barcode already exists', 409);
    }

    return prisma.medicine.update({
      where: { id },
      data: {
        ...data,
        ...(data.expiryDate ? { expiryDate: new Date(data.expiryDate) } : {}),
      },
    });
  },

  async delete(id: string) {
    await medicineService.getById(id);
    return prisma.medicine.delete({ where: { id } });
  },

  async returnStock(id: string, quantity: number, _reason?: string) {
    await medicineService.getById(id);
    if (quantity <= 0) throw new AppError('Quantity must be greater than 0', 400);

    return prisma.medicine.update({
      where: { id },
      data: { quantity: { increment: quantity } },
    });
  },

  async getSummary() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const allMedicines = await prisma.medicine.findMany();

    const statusBreakdown = {
      normal: 0,
      lowStock: 0,
      expiringSoon: 0,
      expired: 0,
    };

    const companyMap = new Map<string, { company: string; quantity: number; medicines: number }>();

    const expiryBucketCounts = {
      expired: 0,
      within30Days: 0,
      within90Days: 0,
      later: 0,
    };

    for (const medicine of allMedicines) {
      const isExpired = medicine.expiryDate < now;
      const isExpiringSoon = medicine.expiryDate >= now && medicine.expiryDate <= in30Days;
      const isLowStock = medicine.quantity <= medicine.minQuantity;

      if (isExpired) {
        statusBreakdown.expired += 1;
      } else if (isExpiringSoon) {
        statusBreakdown.expiringSoon += 1;
      } else if (isLowStock) {
        statusBreakdown.lowStock += 1;
      } else {
        statusBreakdown.normal += 1;
      }

      if (isExpired) {
        expiryBucketCounts.expired += 1;
      } else if (medicine.expiryDate <= in30Days) {
        expiryBucketCounts.within30Days += 1;
      } else if (medicine.expiryDate <= in90Days) {
        expiryBucketCounts.within90Days += 1;
      } else {
        expiryBucketCounts.later += 1;
      }

      const companyEntry = companyMap.get(medicine.company) ?? {
        company: medicine.company,
        quantity: 0,
        medicines: 0,
      };

      companyEntry.quantity += medicine.quantity;
      companyEntry.medicines += 1;
      companyMap.set(medicine.company, companyEntry);
    }

    const companyBreakdown = Array.from(companyMap.values()).sort((a, b) => {
      if (b.quantity !== a.quantity) {
        return b.quantity - a.quantity;
      }

      return b.medicines - a.medicines;
    });

    return {
      total: allMedicines.length,
      lowStock: allMedicines.filter((medicine) => medicine.quantity <= medicine.minQuantity).length,
      expiringSoon: allMedicines.filter(
        (medicine) => medicine.expiryDate >= now && medicine.expiryDate <= in30Days
      ).length,
      expired: allMedicines.filter((medicine) => medicine.expiryDate < now).length,
      statusBreakdown,
      companyBreakdown,
      expiryBuckets: [
        { key: 'expired', count: expiryBucketCounts.expired },
        { key: 'within30Days', count: expiryBucketCounts.within30Days },
        { key: 'within90Days', count: expiryBucketCounts.within90Days },
        { key: 'later', count: expiryBucketCounts.later },
      ],
    };
  },
};
