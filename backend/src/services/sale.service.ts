import { CustomerTransactionType, PrescriptionStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { cashRegisterService } from './cashregister.service';
import { prisma } from '../utils/prismaClient';

export interface SaleItemInput {
  medicineId: string;
  quantity: number;
}

export interface CreatePrescriptionSaleInput {
  customerId?: string;
  items: SaleItemInput[];
  paidAmount: number;
}

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
}

export interface ReturnMedicineInput {
  prescriptionItemId: string;
  quantity: number;
  reason?: string;
  userId: string;
}

type SummaryPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PHARMACY_NAME = process.env.PHARMACY_NAME?.trim() || 'Pharmacy Management System';
const AFGHAN_WEEK_START = 6;

const saleInclude = {
  prescription: {
    include: {
      customer: true,
      items: {
        include: {
          medicine: true,
          returnedMeds: true,
        },
      },
      customerTransactions: true,
    },
  },
} as const;

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    prescription: {
      include: {
        customer: true;
        items: {
          include: {
            medicine: true;
            returnedMeds: true;
          };
        };
        customerTransactions: true;
      };
    };
  };
}>;

const normalizeOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseDateInput = (value: string, endOfDayValue = false): Date => {
  const trimmed = value.trim();
  const simpleDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (simpleDateMatch) {
    const [, year, month, day] = simpleDateMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      endOfDayValue ? 23 : 0,
      endOfDayValue ? 59 : 0,
      endOfDayValue ? 59 : 0,
      endOfDayValue ? 999 : 0
    );
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date provided', 400);
  }

  return parsed;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const startOfWeek = (date: Date, weekStartsOn = AFGHAN_WEEK_START): Date => {
  const dayStart = startOfDay(date);
  const diff = (dayStart.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(dayStart);
  start.setDate(start.getDate() - diff);
  return startOfDay(start);
};

const endOfWeek = (date: Date, weekStartsOn = AFGHAN_WEEK_START): Date => {
  const start = startOfWeek(date, weekStartsOn);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
};

const getPrescriptionStatus = (
  paidAmount: number,
  debtAmount: number
): PrescriptionStatus => {
  if (debtAmount <= 0) {
    return PrescriptionStatus.PAID;
  }

  if (paidAmount <= 0) {
    return PrescriptionStatus.DEBT;
  }

  return PrescriptionStatus.PARTIAL;
};

const getSaleOrThrow = async (
  client: Prisma.TransactionClient | typeof prisma,
  saleId: string
): Promise<SaleWithRelations> => {
  const sale = await client.sale.findUnique({
    where: { id: saleId },
    include: saleInclude,
  });

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  return sale;
};

const getReturnedAmount = (sale: SaleWithRelations): number =>
  sale.prescription.items.reduce(
    (sum, item) =>
      sum +
      item.returnedMeds.reduce((itemSum, returned) => itemSum + returned.quantity * item.unitPrice, 0),
    0
  );

const buildReceipt = (sale: SaleWithRelations) => {
  const originalTotalAmount = sale.prescription.items.reduce((sum, item) => sum + item.total, 0);
  const totalReturnedAmount = getReturnedAmount(sale);
  const items = sale.prescription.items.map((item) => {
    const returnedQuantity = item.returnedMeds.reduce((sum, returned) => sum + returned.quantity, 0);
    const unitProfit = item.unitPrice - item.medicine.buyPrice;

    return {
      prescriptionItemId: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicine.name,
      barcode: item.medicine.barcode,
      company: item.medicine.company,
      quantity: item.quantity,
      returnedQuantity,
      availableQuantity: item.quantity - returnedQuantity,
      unitPrice: item.unitPrice,
      total: item.total,
      currentTotal: item.total - returnedQuantity * item.unitPrice,
      unitProfit,
      totalProfit: (item.quantity - returnedQuantity) * unitProfit,
    };
  });

  const returns = sale.prescription.items
    .flatMap((item) =>
      item.returnedMeds.map((returned) => ({
        id: returned.id,
        prescriptionItemId: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine.name,
        quantity: returned.quantity,
        reason: returned.reason,
        date: returned.date.toISOString(),
        userId: returned.userId,
        amount: returned.quantity * item.unitPrice,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    pharmacyName: PHARMACY_NAME,
    saleId: sale.id,
    prescriptionId: sale.prescriptionId,
    date: sale.date.toISOString(),
    createdAt: sale.createdAt.toISOString(),
    status: sale.prescription.status,
    customer: sale.prescription.customer
      ? {
          id: sale.prescription.customer.id,
          name: sale.prescription.customer.name,
          phone: sale.prescription.customer.phone,
          totalDebt: sale.prescription.customer.totalDebt,
        }
      : null,
    totals: {
      originalTotalAmount,
      totalAmount: sale.totalAmount,
      paidAmount: sale.prescription.paidAmount,
      debtAmount: sale.prescription.debtAmount,
      profit: sale.profit,
      totalReturnedAmount,
    },
    items,
    returns,
  };
};

const buildSaleHistoryRow = (sale: SaleWithRelations) => ({
  id: sale.id,
  prescriptionId: sale.prescriptionId,
  date: sale.date.toISOString(),
  status: sale.prescription.status,
  customer: sale.prescription.customer
    ? {
        id: sale.prescription.customer.id,
        name: sale.prescription.customer.name,
        phone: sale.prescription.customer.phone,
      }
    : null,
  itemCount: sale.prescription.items.length,
  returnedUnits: sale.prescription.items.reduce(
    (sum, item) => sum + item.returnedMeds.reduce((itemSum, returned) => itemSum + returned.quantity, 0),
    0
  ),
  returnAmount: getReturnedAmount(sale),
  originalTotalAmount: sale.prescription.items.reduce((sum, item) => sum + item.total, 0),
  totalAmount: sale.totalAmount,
  paidAmount: sale.prescription.paidAmount,
  debtAmount: sale.prescription.debtAmount,
  profit: sale.profit,
});

const buildSummary = (sales: SaleWithRelations[]) => ({
  salesCount: sales.length,
  grossSales: sales.reduce(
    (sum, sale) => sum + sale.prescription.items.reduce((itemSum, item) => itemSum + item.total, 0),
    0
  ),
  totalSales: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
  totalPaid: sales.reduce((sum, sale) => sum + sale.prescription.paidAmount, 0),
  totalDebt: sales.reduce((sum, sale) => sum + sale.prescription.debtAmount, 0),
  totalProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
  totalReturns: sales.reduce((sum, sale) => sum + getReturnedAmount(sale), 0),
});

const buildDateWhere = (filters: SalesFilters): Prisma.SaleWhereInput => {
  const start = filters.startDate ? parseDateInput(filters.startDate) : null;
  const end = filters.endDate ? parseDateInput(filters.endDate, true) : null;

  if (start && end && start > end) {
    throw new AppError('Start date cannot be after end date', 400);
  }

  if (!start && !end) {
    return {};
  }

  return {
    date: {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    },
  };
};

const getPeriodRange = (period: SummaryPeriod) => {
  const now = new Date();

  switch (period) {
    case 'daily':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'weekly':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
    case 'monthly':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case 'yearly':
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
};

export const saleService = {
  async createPrescriptionSale(data: CreatePrescriptionSaleInput) {
    if (data.items.length === 0) {
      throw new AppError('At least one medicine item is required', 400);
    }

    const customerId = normalizeOptionalString(data.customerId) ?? undefined;
    const paidAmount = Number(data.paidAmount);

    if (Number.isNaN(paidAmount) || paidAmount < 0) {
      throw new AppError('Paid amount must be zero or greater', 400);
    }

    const mergedItems = new Map<string, number>();

    for (const item of data.items) {
      mergedItems.set(item.medicineId, (mergedItems.get(item.medicineId) ?? 0) + item.quantity);
    }

    const normalizedItems = Array.from(mergedItems.entries()).map(([medicineId, quantity]) => ({
      medicineId,
      quantity,
    }));

    return prisma.$transaction(async (tx) => {
      const customer = customerId
        ? await tx.customer.findUnique({
            where: { id: customerId },
          })
        : null;

      if (customerId && !customer) {
        throw new AppError('Customer not found', 404);
      }

      const medicines = await tx.medicine.findMany({
        where: {
          id: {
            in: normalizedItems.map((item) => item.medicineId),
          },
        },
      });

      if (medicines.length !== normalizedItems.length) {
        const existingIds = new Set(medicines.map((medicine) => medicine.id));
        const missingId = normalizedItems.find((item) => !existingIds.has(item.medicineId))?.medicineId;
        throw new AppError(`Medicine not found: ${missingId ?? 'unknown'}`, 404);
      }

      const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
      const preparedItems = normalizedItems.map((item) => {
        const medicine = medicineMap.get(item.medicineId);

        if (!medicine) {
          throw new AppError(`Medicine not found: ${item.medicineId}`, 404);
        }

        if (medicine.quantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${medicine.name}`, 400);
        }

        const unitPrice = medicine.sellPrice;
        const total = unitPrice * item.quantity;
        const lineProfit = (medicine.sellPrice - medicine.buyPrice) * item.quantity;

        return {
          medicineId: medicine.id,
          medicineName: medicine.name,
          quantity: item.quantity,
          unitPrice,
          total,
          lineProfit,
        };
      });

      const totalAmount = preparedItems.reduce((sum, item) => sum + item.total, 0);

      if (paidAmount > totalAmount) {
        throw new AppError('Paid amount cannot be greater than total amount', 400);
      }

      const debtAmount = totalAmount - paidAmount;

      if (debtAmount > 0 && !customer) {
        throw new AppError('A customer is required when the prescription has debt', 400);
      }

      for (const item of preparedItems) {
        const result = await tx.medicine.updateMany({
          where: {
            id: item.medicineId,
            quantity: {
              gte: item.quantity,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        if (result.count === 0) {
          throw new AppError(`Unable to reserve stock for ${item.medicineName}`, 409);
        }
      }

      const prescription = await tx.prescription.create({
        data: {
          customerId: customer?.id,
          totalAmount,
          paidAmount,
          debtAmount,
          status: getPrescriptionStatus(paidAmount, debtAmount),
          items: {
            create: preparedItems.map((item) => ({
              medicineId: item.medicineId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

      if (debtAmount > 0 && customer) {
        await tx.customerTransaction.create({
          data: {
            customerId: customer.id,
            prescriptionId: prescription.id,
            type: CustomerTransactionType.DEBT,
            amount: debtAmount,
            note: `Debt created from prescription ${prescription.id}`,
          },
        });

        await tx.customer.update({
          where: { id: customer.id },
          data: {
            totalDebt: {
              increment: debtAmount,
            },
          },
        });
      }

      const sale = await tx.sale.create({
        data: {
          prescriptionId: prescription.id,
          totalAmount,
          profit: preparedItems.reduce((sum, item) => sum + item.lineProfit, 0),
        },
        include: saleInclude,
      });

      await cashRegisterService.syncRegisterTotalsForDate(sale.date, tx);

      return buildReceipt(sale);
    });
  },

  async getAll(filters: SalesFilters) {
    const sales = await prisma.sale.findMany({
      where: buildDateWhere(filters),
      include: saleInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      sales: sales.map(buildSaleHistoryRow),
      summary: buildSummary(sales),
      filters: {
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
      },
    };
  },

  async getPeriodSummary(period: SummaryPeriod) {
    const range = getPeriodRange(period);
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      include: saleInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      period,
      weekStartsOn: 'SATURDAY',
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      summary: buildSummary(sales),
      recentSales: sales.slice(0, 5).map(buildSaleHistoryRow),
    };
  },

  async getById(id: string) {
    const sale = await getSaleOrThrow(prisma, id);
    return buildReceipt(sale);
  },

  async returnMedicine(data: ReturnMedicineInput) {
    return prisma.$transaction(async (tx) => {
      const prescriptionItem = await tx.prescriptionItem.findUnique({
        where: { id: data.prescriptionItemId },
        include: {
          medicine: true,
          returnedMeds: true,
          prescription: {
            include: {
              customer: true,
              sale: true,
              customerTransactions: {
                where: {
                  type: CustomerTransactionType.DEBT,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          },
        },
      });

      if (!prescriptionItem) {
        throw new AppError('Prescription item not found', 404);
      }

      if (!prescriptionItem.prescription.sale) {
        throw new AppError('Sale not found for this prescription item', 404);
      }

      const alreadyReturnedQuantity = prescriptionItem.returnedMeds.reduce(
        (sum, returned) => sum + returned.quantity,
        0
      );
      const availableToReturn = prescriptionItem.quantity - alreadyReturnedQuantity;

      if (data.quantity > availableToReturn) {
        throw new AppError(
          `Only ${availableToReturn} unit(s) can still be returned for this prescription item`,
          400
        );
      }

      const returnAmount = prescriptionItem.unitPrice * data.quantity;
      const returnProfit = (prescriptionItem.unitPrice - prescriptionItem.medicine.buyPrice) * data.quantity;
      const currentTotalAmount = prescriptionItem.prescription.totalAmount;
      const currentPaidAmount = prescriptionItem.prescription.paidAmount;
      const currentDebtAmount = prescriptionItem.prescription.debtAmount;
      const nextTotalAmount = Math.max(currentTotalAmount - returnAmount, 0);
      const nextPaidAmount = Math.min(currentPaidAmount, nextTotalAmount);
      const nextDebtAmount = Math.max(nextTotalAmount - nextPaidAmount, 0);
      const debtReduction = currentDebtAmount - nextDebtAmount;

      await tx.medicine.update({
        where: { id: prescriptionItem.medicineId },
        data: {
          quantity: {
            increment: data.quantity,
          },
        },
      });

      const returnedMedicine = await tx.returnedMedicine.create({
        data: {
          prescriptionItemId: prescriptionItem.id,
          medicineId: prescriptionItem.medicineId,
          userId: data.userId,
          quantity: data.quantity,
          reason: normalizeOptionalString(data.reason),
        },
      });

      await tx.prescription.update({
        where: { id: prescriptionItem.prescriptionId },
        data: {
          totalAmount: nextTotalAmount,
          paidAmount: nextPaidAmount,
          debtAmount: nextDebtAmount,
          status: getPrescriptionStatus(nextPaidAmount, nextDebtAmount),
        },
      });

      await tx.sale.update({
        where: { id: prescriptionItem.prescription.sale.id },
        data: {
          totalAmount: nextTotalAmount,
          profit: prescriptionItem.prescription.sale.profit - returnProfit,
        },
      });

      if (prescriptionItem.prescription.customer) {
        if (debtReduction > 0) {
          await tx.customer.update({
            where: { id: prescriptionItem.prescription.customer.id },
            data: {
              totalDebt: Math.max(prescriptionItem.prescription.customer.totalDebt - debtReduction, 0),
            },
          });
        }

        const debtTransaction = prescriptionItem.prescription.customerTransactions[0];

        if (debtTransaction) {
          if (nextDebtAmount > 0) {
            await tx.customerTransaction.update({
              where: { id: debtTransaction.id },
              data: {
                amount: nextDebtAmount,
                note: debtTransaction.note ?? 'Debt adjusted after medicine return',
              },
            });
          } else {
            await tx.customerTransaction.delete({
              where: { id: debtTransaction.id },
            });
          }
        }
      }

      const updatedSale = await getSaleOrThrow(tx, prescriptionItem.prescription.sale.id);

      await cashRegisterService.syncRegisterTotalsForDate(updatedSale.date, tx);

      return {
        returnedMedicine: {
          ...returnedMedicine,
          amount: returnAmount,
          refundedAmount: currentPaidAmount - nextPaidAmount,
          reducedDebtAmount: debtReduction,
        },
        receipt: buildReceipt(updatedSale),
      };
    });
  },

  async searchCustomers(query?: string, limit = 10) {
    const trimmedQuery = normalizeOptionalString(query);
    const safeLimit = Math.min(Math.max(limit, 1), 20);

    return prisma.customer.findMany({
      where: trimmedQuery
        ? {
            OR: [
              {
                name: {
                  contains: trimmedQuery,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains: trimmedQuery,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined,
      orderBy: [{ totalDebt: 'desc' }, { name: 'asc' }],
      take: safeLimit,
      select: {
        id: true,
        name: true,
        phone: true,
        totalDebt: true,
        createdAt: true,
      },
    });
  },
};
