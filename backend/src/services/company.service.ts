import { ExpenseCategory, Prisma, TransactionType } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { cashRegisterService } from './cashregister.service';
import { prisma } from '../utils/prismaClient';

export interface CompanyInput {
  name: string;
  phone?: string;
  address?: string;
}

export interface PurchaseMedicineInput {
  medicineId?: string;
  name: string;
  barcode?: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  minQuantity?: number;
  expiryDate: string;
}

export interface RecordPurchaseInput {
  billNumber?: string;
  note?: string;
  date?: string;
  userId: string;
  items: PurchaseMedicineInput[];
}

export interface RecordPaymentInput {
  amount: number;
  note?: string;
  date?: string;
}

const normalizeOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseDateOrNow = (value?: string): Date => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date provided', 400);
  }

  return parsed;
};

const buildPurchaseNote = (note: string | undefined, items: PurchaseMedicineInput[]): string | null => {
  const itemSummary = items
    .map((item) => `${item.name} x${item.quantity} @ ${item.buyPrice}`)
    .join('; ');

  const parts = [normalizeOptionalString(note), itemSummary ? `Items: ${itemSummary}` : null].filter(
    (part): part is string => Boolean(part)
  );

  return parts.length > 0 ? parts.join(' | ') : null;
};

const buildPurchaseExpenseDescription = (
  companyName: string,
  billNumber: string | undefined,
  note: string | undefined,
  items: PurchaseMedicineInput[]
): string => {
  const itemSummary = items
    .map((item) => `${item.name} x${item.quantity}`)
    .join(', ');
  const parts = [
    `Medicine purchase from ${companyName}`,
    normalizeOptionalString(billNumber) ? `Bill: ${billNumber?.trim()}` : null,
    normalizeOptionalString(note),
    itemSummary ? `Items: ${itemSummary}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(' | ');
};

const getCompanyOrThrow = async (
  tx: Prisma.TransactionClient,
  companyId: string
) => {
  const company = await tx.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  return company;
};

export const companyService = {
  async getAll() {
    const companies = await prisma.company.findMany({
      orderBy: [{ balance: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return companies.map((company) => ({
      ...company,
      transactionCount: company._count.transactions,
    }));
  },

  async getById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return {
      ...company,
      transactionCount: company._count.transactions,
    };
  },

  async create(data: CompanyInput) {
    return prisma.company.create({
      data: {
        name: data.name.trim(),
        phone: normalizeOptionalString(data.phone),
        address: normalizeOptionalString(data.address),
      },
    });
  },

  async update(id: string, data: Partial<CompanyInput>) {
    await companyService.getById(id);

    return prisma.company.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: normalizeOptionalString(data.phone) } : {}),
        ...(data.address !== undefined ? { address: normalizeOptionalString(data.address) } : {}),
      },
    });
  },

  async getTransactions(companyId: string) {
    await companyService.getById(companyId);

    return prisma.companyTransaction.findMany({
      where: { companyId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async recordPurchase(companyId: string, data: RecordPurchaseInput) {
    if (data.items.length === 0) {
      throw new AppError('At least one medicine is required for a purchase', 400);
    }

    return prisma.$transaction(async (tx) => {
      const company = await getCompanyOrThrow(tx, companyId);
      const purchaseDate = parseDateOrNow(data.date);
      let totalAmount = 0;

      const affectedMedicines = [];

      for (const item of data.items) {
        totalAmount += item.quantity * item.buyPrice;

        const expiryDate = parseDateOrNow(item.expiryDate);
        let medicine =
          item.medicineId
            ? await tx.medicine.findUnique({ where: { id: item.medicineId } })
            : null;

        if (item.medicineId && !medicine) {
          throw new AppError(`Selected medicine not found: ${item.name}`, 404);
        }

        if (!medicine && item.barcode) {
          medicine = await tx.medicine.findUnique({
            where: { barcode: item.barcode },
          });
        }

        if (medicine) {
          const updatedMedicine = await tx.medicine.update({
            where: { id: medicine.id },
            data: {
              name: item.name.trim(),
              barcode: normalizeOptionalString(item.barcode) ?? medicine.barcode,
              company: company.name,
              buyPrice: item.buyPrice,
              sellPrice: item.sellPrice,
              minQuantity: item.minQuantity ?? medicine.minQuantity,
              expiryDate,
              quantity: {
                increment: item.quantity,
              },
            },
          });

          affectedMedicines.push(updatedMedicine);
          continue;
        }

        const createdMedicine = await tx.medicine.create({
          data: {
            name: item.name.trim(),
            barcode: normalizeOptionalString(item.barcode),
            company: company.name,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            quantity: item.quantity,
            minQuantity: item.minQuantity ?? 10,
            expiryDate,
          },
        });

        affectedMedicines.push(createdMedicine);
      }

      const transaction = await tx.companyTransaction.create({
        data: {
          companyId,
          type: TransactionType.PURCHASE,
          amount: totalAmount,
          billNumber: normalizeOptionalString(data.billNumber),
          note: buildPurchaseNote(data.note, data.items),
          date: purchaseDate,
        },
      });

      const expense = await tx.expense.create({
        data: {
          userId: data.userId,
          category: ExpenseCategory.OTHER,
          amount: totalAmount,
          description: buildPurchaseExpenseDescription(
            company.name,
            data.billNumber,
            data.note,
            data.items
          ),
          date: purchaseDate,
        },
      });

      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: {
          totalPurchased: {
            increment: totalAmount,
          },
          balance: {
            increment: totalAmount,
          },
        },
      });

      await cashRegisterService.syncRegisterTotalsForDate(purchaseDate, tx);

      return {
        company: updatedCompany,
        transaction,
        expense,
        medicines: affectedMedicines,
        totalAmount,
      };
    });
  },

  async recordPayment(companyId: string, data: RecordPaymentInput) {
    if (data.amount <= 0) {
      throw new AppError('Payment amount must be greater than 0', 400);
    }

    return prisma.$transaction(async (tx) => {
      await getCompanyOrThrow(tx, companyId);

      const paymentDate = parseDateOrNow(data.date);

      const transaction = await tx.companyTransaction.create({
        data: {
          companyId,
          type: TransactionType.PAYMENT,
          amount: data.amount,
          note: normalizeOptionalString(data.note),
          date: paymentDate,
        },
      });

      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: {
          totalPaid: {
            increment: data.amount,
          },
          balance: {
            decrement: data.amount,
          },
        },
      });

      return {
        company: updatedCompany,
        transaction,
      };
    });
  },

  async getReport(companyId: string) {
    const company = await companyService.getById(companyId);
    const transactions = await prisma.companyTransaction.findMany({
      where: { companyId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const purchaseCount = transactions.filter(
      (transaction) => transaction.type === TransactionType.PURCHASE
    ).length;
    const paymentCount = transactions.filter(
      (transaction) => transaction.type === TransactionType.PAYMENT
    ).length;

    const lastPurchase = transactions.find(
      (transaction) => transaction.type === TransactionType.PURCHASE
    );
    const lastPayment = transactions.find(
      (transaction) => transaction.type === TransactionType.PAYMENT
    );

    return {
      company,
      transactions,
      summary: {
        totalPurchased: company.totalPurchased,
        totalPaid: company.totalPaid,
        balance: company.balance,
        purchaseCount,
        paymentCount,
        lastPurchaseDate: lastPurchase?.date ?? null,
        lastPaymentDate: lastPayment?.date ?? null,
      },
    };
  },
};
