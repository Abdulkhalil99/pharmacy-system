import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prismaClient';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export interface OpenCashRegisterInput {
  openingBalance: number;
  note?: string;
  date?: string;
}

export interface CloseCashRegisterInput {
  closingBalance: number;
  note?: string;
  date?: string;
}

export interface TransferCashInput {
  amount: number;
  fromAccount: 'PHARMACY';
  toAccount: string;
  reason?: string;
  date?: string;
  userId: string;
}

export interface TransferFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface DailyCashReportFilters {
  date?: string;
}

export interface MonthlyCashReportFilters {
  month?: number;
  year?: number;
}

interface DayTotals {
  sales: number;
  expenses: number;
  transfers: number;
}

const normalizeOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const roundCurrency = (value: number): number => Number(value.toFixed(2));

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

const startOfMonth = (year: number, month: number): Date =>
  new Date(year, month - 1, 1, 0, 0, 0, 0);

const endOfMonth = (year: number, month: number): Date =>
  new Date(year, month, 0, 23, 59, 59, 999);

const getDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateRange = (day: Date) => ({
  start: startOfDay(day),
  end: endOfDay(day),
});

const parseOptionalDay = (value?: string): Date => {
  if (!value) {
    return startOfDay(new Date());
  }

  return startOfDay(parseDateInput(value));
};

const buildDateWhere = (startDate?: string, endDate?: string) => {
  const start = startDate ? parseDateInput(startDate) : null;
  const end = endDate ? parseDateInput(endDate, true) : null;

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

const mapTransfer = (
  transfer: Prisma.CashTransferGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          name: true;
          username: true;
          role: true;
        };
      };
    };
  }>
) => ({
  id: transfer.id,
  amount: roundCurrency(transfer.amount),
  fromAccount: transfer.fromAccount,
  toAccount: transfer.toAccount,
  reason: transfer.reason,
  date: transfer.date.toISOString(),
  createdAt: transfer.createdAt.toISOString(),
  user: transfer.user,
});

const mapExpense = (
  expense: Prisma.ExpenseGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          name: true;
          username: true;
          role: true;
        };
      };
    };
  }>
) => ({
  id: expense.id,
  amount: roundCurrency(expense.amount),
  category: expense.category,
  description: expense.description,
  date: expense.date.toISOString(),
  createdAt: expense.createdAt.toISOString(),
  user: expense.user,
});

const mapSaleMovement = (
  sale: Prisma.SaleGetPayload<{
    include: {
      prescription: {
        include: {
          customer: true;
        };
      };
    };
  }>
) => ({
  id: sale.id,
  prescriptionId: sale.prescriptionId,
  date: sale.date.toISOString(),
  totalAmount: roundCurrency(sale.totalAmount),
  paidAmount: roundCurrency(sale.prescription.paidAmount),
  debtAmount: roundCurrency(sale.prescription.debtAmount),
  status: sale.prescription.status,
  customer: sale.prescription.customer
    ? {
        id: sale.prescription.customer.id,
        name: sale.prescription.customer.name,
        phone: sale.prescription.customer.phone,
      }
    : null,
});

const buildRegisterSnapshot = (
  register:
    | Prisma.CashRegisterGetPayload<Record<string, never>>
    | null,
  day: Date,
  totals: DayTotals
) => {
  const openingBalance = roundCurrency(register?.openingBalance ?? 0);
  const totalSales = roundCurrency(totals.sales);
  const totalExpenses = roundCurrency(totals.expenses);
  const totalTransfersOut = roundCurrency(totals.transfers);
  const expectedClosingBalance = roundCurrency(
    openingBalance + totalSales - totalExpenses - totalTransfersOut
  );
  const recordedClosingBalance =
    register?.closingBalance === null || register?.closingBalance === undefined
      ? null
      : roundCurrency(register.closingBalance);
  const currentCashInHand = roundCurrency(
    register?.closedAt && recordedClosingBalance !== null
      ? recordedClosingBalance
      : expectedClosingBalance
  );

  return {
    registerId: register?.id ?? null,
    date: getDayKey(day),
    openingBalance,
    totalSales,
    totalExpenses,
    totalTransfersOut,
    expectedClosingBalance,
    recordedClosingBalance,
    currentCashInHand,
    variance:
      recordedClosingBalance === null
        ? null
        : roundCurrency(recordedClosingBalance - expectedClosingBalance),
    note: register?.note ?? null,
    openedAt: register?.openedAt?.toISOString() ?? null,
    closedAt: register?.closedAt?.toISOString() ?? null,
    isOpened: Boolean(register),
    isOpen: Boolean(register && !register.closedAt),
    isClosed: Boolean(register?.closedAt),
    canOpen: !register,
    canClose: Boolean(register && !register.closedAt),
  };
};

const calculateDayTotals = async (
  client: PrismaClientLike,
  day: Date
): Promise<DayTotals> => {
  const range = getDateRange(day);

  const [salesAggregate, expensesAggregate, transfersAggregate] = await Promise.all([
    client.prescription.aggregate({
      _sum: { paidAmount: true },
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    client.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
    client.cashTransfer.aggregate({
      _sum: { amount: true },
      where: {
        fromAccount: 'PHARMACY',
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
    }),
  ]);

  return {
    sales: salesAggregate._sum.paidAmount ?? 0,
    expenses: expensesAggregate._sum.amount ?? 0,
    transfers: transfersAggregate._sum.amount ?? 0,
  };
};

export const cashRegisterService = {
  async syncRegisterTotalsForDate(date: Date, client: PrismaClientLike = prisma) {
    const day = startOfDay(date);
    const totals = await calculateDayTotals(client, day);
    const register = await client.cashRegister.findUnique({
      where: { date: day },
    });

    if (!register) {
      return {
        register: null,
        totals,
        snapshot: buildRegisterSnapshot(null, day, totals),
      };
    }

    const updatedRegister = await client.cashRegister.update({
      where: { id: register.id },
      data: {
        totalSales: roundCurrency(totals.sales),
        totalExpenses: roundCurrency(totals.expenses),
        totalTransfers: roundCurrency(totals.transfers),
      },
    });

    return {
      register: updatedRegister,
      totals,
      snapshot: buildRegisterSnapshot(updatedRegister, day, totals),
    };
  },

  async getTodayStatus() {
    const today = startOfDay(new Date());
    const result = await this.syncRegisterTotalsForDate(today);
    return result.snapshot;
  },

  async openRegister(data: OpenCashRegisterInput) {
    const openingBalance = Number(data.openingBalance);

    if (Number.isNaN(openingBalance) || openingBalance < 0) {
      throw new AppError('Opening balance must be zero or greater', 400);
    }

    const day = parseOptionalDay(data.date);
    const note = normalizeOptionalString(data.note);

    return prisma.$transaction(async (tx) => {
      const existingRegister = await tx.cashRegister.findUnique({
        where: { date: day },
      });

      if (existingRegister) {
        throw new AppError(`Cash register is already opened for ${getDayKey(day)}`, 409);
      }

      const totals = await calculateDayTotals(tx, day);
      const register = await tx.cashRegister.create({
        data: {
          date: day,
          openingBalance: roundCurrency(openingBalance),
          note,
          totalSales: roundCurrency(totals.sales),
          totalExpenses: roundCurrency(totals.expenses),
          totalTransfers: roundCurrency(totals.transfers),
        },
      });

      return buildRegisterSnapshot(register, day, totals);
    });
  },

  async closeRegister(data: CloseCashRegisterInput) {
    const closingBalance = Number(data.closingBalance);

    if (Number.isNaN(closingBalance) || closingBalance < 0) {
      throw new AppError('Closing balance must be zero or greater', 400);
    }

    const day = parseOptionalDay(data.date);
    const note = normalizeOptionalString(data.note);

    return prisma.$transaction(async (tx) => {
      const register = await tx.cashRegister.findUnique({
        where: { date: day },
      });

      if (!register) {
        throw new AppError(`No cash register found for ${getDayKey(day)}`, 404);
      }

      if (register.closedAt) {
        throw new AppError(`Cash register is already closed for ${getDayKey(day)}`, 409);
      }

      const totals = await calculateDayTotals(tx, day);
      const updatedRegister = await tx.cashRegister.update({
        where: { id: register.id },
        data: {
          closingBalance: roundCurrency(closingBalance),
          closedAt: new Date(),
          note: note ?? register.note,
          totalSales: roundCurrency(totals.sales),
          totalExpenses: roundCurrency(totals.expenses),
          totalTransfers: roundCurrency(totals.transfers),
        },
      });

      return buildRegisterSnapshot(updatedRegister, day, totals);
    });
  },

  async transferCash(data: TransferCashInput) {
    const amount = Number(data.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError('Transfer amount must be greater than zero', 400);
    }

    if (data.fromAccount !== 'PHARMACY') {
      throw new AppError('Cash transfers can only move money out of PHARMACY', 400);
    }

    const toAccount = normalizeOptionalString(data.toAccount);

    if (!toAccount) {
      throw new AppError('Destination account is required', 400);
    }

    const reason = normalizeOptionalString(data.reason);
    const transferDate = data.date ? parseDateInput(data.date) : new Date();
    const day = startOfDay(transferDate);

    return prisma.$transaction(async (tx) => {
      const register = await tx.cashRegister.findUnique({
        where: { date: day },
      });

      if (!register) {
        throw new AppError(
          `Open the cash register for ${getDayKey(day)} before recording a transfer`,
          400
        );
      }

      if (register.closedAt) {
        throw new AppError(`Cash register is already closed for ${getDayKey(day)}`, 409);
      }

      const totals = await calculateDayTotals(tx, day);
      const availableCash = roundCurrency(
        register.openingBalance + totals.sales - totals.expenses - totals.transfers
      );

      if (amount > availableCash) {
        throw new AppError(
          `Transfer amount exceeds available cash. Available balance: ${availableCash}`,
          400
        );
      }

      const transfer = await tx.cashTransfer.create({
        data: {
          userId: data.userId,
          amount: roundCurrency(amount),
          fromAccount: data.fromAccount,
          toAccount,
          reason,
          date: transferDate,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
      });

      const synced = await this.syncRegisterTotalsForDate(day, tx);

      return {
        transfer: mapTransfer(transfer),
        register: synced.snapshot,
        remainingBalance: roundCurrency(availableCash - amount),
      };
    });
  },

  async getTransfers(filters: TransferFilters) {
    const where = buildDateWhere(filters.startDate, filters.endDate);
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : undefined;

    const transfers = await prisma.cashTransfer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      ...(limit ? { take: limit } : {}),
    });

    return {
      transfers: transfers.map(mapTransfer),
      summary: {
        count: transfers.length,
        totalTransferred: roundCurrency(
          transfers.reduce((sum, transfer) => sum + transfer.amount, 0)
        ),
      },
      filters: {
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
        limit: limit ?? null,
      },
    };
  },

  async getDailyReport(filters: DailyCashReportFilters) {
    const day = parseOptionalDay(filters.date);
    const range = getDateRange(day);
    const synced = await this.syncRegisterTotalsForDate(day);

    const [sales, expenses, transfers] = await Promise.all([
      prisma.sale.findMany({
        where: {
          date: {
            gte: range.start,
            lte: range.end,
          },
        },
        include: {
          prescription: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: range.start,
            lte: range.end,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.cashTransfer.findMany({
        where: {
          fromAccount: 'PHARMACY',
          date: {
            gte: range.start,
            lte: range.end,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    return {
      date: getDayKey(day),
      register: synced.snapshot,
      summary: {
        openingBalance: synced.snapshot.openingBalance,
        totalSales: synced.snapshot.totalSales,
        totalExpenses: synced.snapshot.totalExpenses,
        totalTransfersOut: synced.snapshot.totalTransfersOut,
        netCashMovement: roundCurrency(
          synced.snapshot.totalSales
            - synced.snapshot.totalExpenses
            - synced.snapshot.totalTransfersOut
        ),
        expectedClosingBalance: synced.snapshot.expectedClosingBalance,
        recordedClosingBalance: synced.snapshot.recordedClosingBalance,
        currentCashInHand: synced.snapshot.currentCashInHand,
        variance: synced.snapshot.variance,
      },
      inflows: {
        sales: sales.map(mapSaleMovement),
      },
      outflows: {
        expenses: expenses.map(mapExpense),
        transfers: transfers.map(mapTransfer),
      },
    };
  },

  async getMonthlyReport(filters: MonthlyCashReportFilters) {
    const now = new Date();
    const month = filters.month ?? now.getMonth() + 1;
    const year = filters.year ?? now.getFullYear();

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError('Month must be between 1 and 12', 400);
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new AppError('Year must be between 2000 and 2100', 400);
    }

    const rangeStart = startOfMonth(year, month);
    const rangeEnd = endOfMonth(year, month);

    const [registers, prescriptions, expenses, transfers] = await Promise.all([
      prisma.cashRegister.findMany({
        where: {
          date: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        orderBy: {
          date: 'asc',
        },
      }),
      prisma.prescription.findMany({
        where: {
          createdAt: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: {
          paidAmount: true,
          createdAt: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
      prisma.cashTransfer.findMany({
        where: {
          fromAccount: 'PHARMACY',
          date: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
    ]);

    const registerMap = new Map(registers.map((register) => [getDayKey(register.date), register]));
    const dayTotalsMap = new Map<string, DayTotals>();

    const ensureDayTotals = (key: string): DayTotals => {
      const existing = dayTotalsMap.get(key);

      if (existing) {
        return existing;
      }

      const next: DayTotals = { sales: 0, expenses: 0, transfers: 0 };
      dayTotalsMap.set(key, next);
      return next;
    };

    for (const prescription of prescriptions) {
      ensureDayTotals(getDayKey(prescription.createdAt)).sales += prescription.paidAmount;
    }

    for (const expense of expenses) {
      ensureDayTotals(getDayKey(expense.date)).expenses += expense.amount;
    }

    for (const transfer of transfers) {
      ensureDayTotals(getDayKey(transfer.date)).transfers += transfer.amount;
    }

    const dayKeys = new Set<string>([
      ...registerMap.keys(),
      ...dayTotalsMap.keys(),
    ]);

    const days = Array.from(dayKeys)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => {
        const register = registerMap.get(key) ?? null;
        const totals = dayTotalsMap.get(key) ?? { sales: 0, expenses: 0, transfers: 0 };
        const day = register?.date ?? parseDateInput(key);
        return buildRegisterSnapshot(register, day, totals);
      });

    return {
      month,
      year,
      range: {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
      },
      summary: {
        registerDays: registers.length,
        closedDays: registers.filter((register) => Boolean(register.closedAt)).length,
        totalOpeningBalance: roundCurrency(
          days.reduce((sum, day) => sum + day.openingBalance, 0)
        ),
        totalSales: roundCurrency(days.reduce((sum, day) => sum + day.totalSales, 0)),
        totalExpenses: roundCurrency(days.reduce((sum, day) => sum + day.totalExpenses, 0)),
        totalTransfersOut: roundCurrency(
          days.reduce((sum, day) => sum + day.totalTransfersOut, 0)
        ),
        netCashMovement: roundCurrency(
          days.reduce(
            (sum, day) => sum + day.totalSales - day.totalExpenses - day.totalTransfersOut,
            0
          )
        ),
        totalRecordedClosingBalance: roundCurrency(
          days.reduce((sum, day) => sum + (day.recordedClosingBalance ?? 0), 0)
        ),
      },
      days,
    };
  },
};
