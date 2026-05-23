import { ExpenseCategory, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prismaClient';

const AFGHAN_WEEK_START = 6;
const EXPIRING_SOON_DAYS = 30;

type ReportRange = {
  start: Date;
  end: Date;
};

type SaleRecord = {
  id: string;
  totalAmount: number;
  profit: number;
  date: Date;
  prescription: {
    id: string;
    paidAmount: number;
    debtAmount: number;
    status: string;
  };
};

type ExpenseRecord = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: Date;
};

type TransferRecord = {
  id: string;
  amount: number;
  fromAccount: string;
  toAccount: string;
  reason: string | null;
  date: Date;
};

type Metrics = {
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  transfersOut: number;
  prescriptionsCount: number;
};

type DateEntry = {
  date: Date;
};

export interface WeeklyReportFilters {
  start?: string;
  end?: string;
}

export interface MonthlyReportFilters {
  month?: number;
  year?: number;
}

export interface YearlyReportFilters {
  year?: number;
}

export interface RangeReportFilters {
  start?: string;
  end?: string;
}

export interface ExpenseReportFilters extends RangeReportFilters {
  category?: ExpenseCategory;
}

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

const startOfMonth = (year: number, month: number): Date =>
  new Date(year, month - 1, 1, 0, 0, 0, 0);

const endOfMonth = (year: number, month: number): Date =>
  new Date(year, month, 0, 23, 59, 59, 999);

const startOfYear = (year: number): Date => new Date(year, 0, 1, 0, 0, 0, 0);

const endOfYear = (year: number): Date => new Date(year, 11, 31, 23, 59, 59, 999);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatShortMonth = (date: Date): string =>
  date.toLocaleString('en-US', { month: 'short' });

const ensureRange = (range: ReportRange): ReportRange => {
  if (range.start > range.end) {
    throw new AppError('Start date cannot be after end date', 400);
  }

  return range;
};

const resolveDay = (date?: string): Date =>
  date ? startOfDay(parseDateInput(date)) : startOfDay(new Date());

const resolveWeeklyRange = (filters: WeeklyReportFilters): ReportRange => {
  if (filters.start && filters.end) {
    return ensureRange({
      start: startOfDay(parseDateInput(filters.start)),
      end: endOfDay(parseDateInput(filters.end)),
    });
  }

  if (filters.start) {
    const start = startOfDay(parseDateInput(filters.start));
    return {
      start,
      end: endOfWeek(start),
    };
  }

  if (filters.end) {
    const end = startOfDay(parseDateInput(filters.end));
    return {
      start: startOfWeek(end),
      end: endOfDay(end),
    };
  }

  const today = new Date();
  return {
    start: startOfWeek(today),
    end: endOfWeek(today),
  };
};

const resolveMonthlyRange = (filters: MonthlyReportFilters): ReportRange => {
  const now = new Date();
  const month = filters.month ?? now.getMonth() + 1;
  const year = filters.year ?? now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError('Month must be between 1 and 12', 400);
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError('Year must be between 2000 and 2100', 400);
  }

  return {
    start: startOfMonth(year, month),
    end: endOfMonth(year, month),
  };
};

const resolveYearlyRange = (filters: YearlyReportFilters): ReportRange => {
  const now = new Date();
  const year = filters.year ?? now.getFullYear();

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError('Year must be between 2000 and 2100', 400);
  }

  return {
    start: startOfYear(year),
    end: endOfYear(year),
  };
};

const resolveFlexibleRange = (
  filters: RangeReportFilters,
  fallback: ReportRange
): ReportRange => {
  if (!filters.start && !filters.end) {
    return fallback;
  }

  const start = filters.start ? startOfDay(parseDateInput(filters.start)) : fallback.start;
  const end = filters.end ? endOfDay(parseDateInput(filters.end)) : fallback.end;

  return ensureRange({ start, end });
};

const isWithinRange = <T extends DateEntry>(entry: T, range: ReportRange): boolean =>
  entry.date >= range.start && entry.date <= range.end;

const sumBy = <T>(items: T[], getter: (item: T) => number): number =>
  items.reduce((sum, item) => sum + getter(item), 0);

const buildMetrics = (
  sales: SaleRecord[],
  expenses: ExpenseRecord[],
  transfers: TransferRecord[]
): Metrics => {
  const totalSales = sumBy(sales, (sale) => sale.totalAmount);
  const totalProfit = sumBy(sales, (sale) => sale.profit);
  const totalExpenses = sumBy(expenses, (expense) => expense.amount);
  const cashIn = sumBy(sales, (sale) => sale.prescription.paidAmount);
  const transfersOut = sumBy(transfers, (transfer) => transfer.amount);
  const cashOut = totalExpenses + transfersOut;

  return {
    totalSales: roundCurrency(totalSales),
    totalProfit: roundCurrency(totalProfit),
    totalExpenses: roundCurrency(totalExpenses),
    netProfit: roundCurrency(totalProfit - totalExpenses),
    cashIn: roundCurrency(cashIn),
    cashOut: roundCurrency(cashOut),
    transfersOut: roundCurrency(transfersOut),
    prescriptionsCount: sales.length,
  };
};

const buildBreakdownRow = (
  label: string,
  range: ReportRange,
  sales: SaleRecord[],
  expenses: ExpenseRecord[],
  transfers: TransferRecord[]
) => {
  const rangeSales = sales.filter((sale) => isWithinRange(sale, range));
  const rangeExpenses = expenses.filter((expense) => isWithinRange(expense, range));
  const rangeTransfers = transfers.filter((transfer) => isWithinRange(transfer, range));
  const metrics = buildMetrics(rangeSales, rangeExpenses, rangeTransfers);

  return {
    label,
    start: range.start.toISOString(),
    end: range.end.toISOString(),
    ...metrics,
  };
};

const buildDayRanges = (range: ReportRange): ReportRange[] => {
  const ranges: ReportRange[] = [];
  let cursor = startOfDay(range.start);

  while (cursor <= range.end) {
    ranges.push({
      start: startOfDay(cursor),
      end: endOfDay(cursor),
    });
    cursor = addDays(cursor, 1);
  }

  return ranges;
};

const buildWeekRangesForMonth = (year: number, month: number): ReportRange[] => {
  const monthRange = {
    start: startOfMonth(year, month),
    end: endOfMonth(year, month),
  };
  const ranges: ReportRange[] = [];
  let cursor = startOfWeek(monthRange.start);

  while (cursor <= monthRange.end) {
    const weekStart = startOfDay(cursor);
    const weekEnd = endOfWeek(cursor);
    ranges.push({
      start: weekStart < monthRange.start ? monthRange.start : weekStart,
      end: weekEnd > monthRange.end ? monthRange.end : weekEnd,
    });
    cursor = addDays(weekStart, 7);
  }

  return ranges;
};

const buildMonthRangesForYear = (year: number): ReportRange[] =>
  Array.from({ length: 12 }, (_, index) => ({
    start: startOfMonth(year, index + 1),
    end: endOfMonth(year, index + 1),
  }));

const getDaysUntilExpiry = (expiryDate: Date, today: Date): number =>
  Math.ceil((startOfDay(expiryDate).getTime() - startOfDay(today).getTime()) / 86_400_000);

const mapInventoryMedicine = (medicine: {
  id: string;
  name: string;
  company: string;
  quantity: number;
  minQuantity: number;
  buyPrice: number;
  sellPrice: number;
  expiryDate: Date;
}) => {
  const today = new Date();

  return {
    id: medicine.id,
    name: medicine.name,
    company: medicine.company,
    quantity: medicine.quantity,
    minQuantity: medicine.minQuantity,
    buyPrice: roundCurrency(medicine.buyPrice),
    sellPrice: roundCurrency(medicine.sellPrice),
    expiryDate: medicine.expiryDate.toISOString(),
    daysUntilExpiry: getDaysUntilExpiry(medicine.expiryDate, today),
    stockValueAtCost: roundCurrency(medicine.quantity * medicine.buyPrice),
    stockValueAtRetail: roundCurrency(medicine.quantity * medicine.sellPrice),
  };
};

const fetchSalesExpensesTransfers = async (range: ReportRange) => {
  const [sales, expenses, transfers] = await Promise.all([
    prisma.sale.findMany({
      where: {
        date: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        profit: true,
        date: true,
        prescription: {
          select: {
            id: true,
            paidAmount: true,
            debtAmount: true,
            status: true,
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
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        date: true,
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
      select: {
        id: true,
        amount: true,
        fromAccount: true,
        toAccount: true,
        reason: true,
        date: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);

  return {
    sales,
    expenses,
    transfers,
  };
};

export const reportService = {
  async getDailyReport(date?: string) {
    const day = resolveDay(date);
    const range = {
      start: startOfDay(day),
      end: endOfDay(day),
    };
    const { sales, expenses, transfers } = await fetchSalesExpensesTransfers(range);
    const metrics = buildMetrics(sales, expenses, transfers);

    return {
      date: getDayKey(day),
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      ...metrics,
    };
  },

  async getWeeklyReport(filters: WeeklyReportFilters) {
    const range = resolveWeeklyRange(filters);
    const { sales, expenses, transfers } = await fetchSalesExpensesTransfers(range);
    const metrics = buildMetrics(sales, expenses, transfers);
    const dayRanges = buildDayRanges(range);

    return {
      period: 'weekly',
      weekStartsOn: 'SATURDAY',
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      dailyBreakdown: dayRanges.map((dayRange) =>
        buildBreakdownRow(getDayKey(dayRange.start), dayRange, sales, expenses, transfers)
      ),
      totalSales: metrics.totalSales,
      totalProfit: metrics.totalProfit,
      totalExpenses: metrics.totalExpenses,
      netProfit: metrics.netProfit,
      cashIn: metrics.cashIn,
      cashOut: metrics.cashOut,
      prescriptionsCount: metrics.prescriptionsCount,
    };
  },

  async getMonthlyReport(filters: MonthlyReportFilters) {
    const range = resolveMonthlyRange(filters);
    const { sales, expenses, transfers } = await fetchSalesExpensesTransfers(range);
    const metrics = buildMetrics(sales, expenses, transfers);
    const year = range.start.getFullYear();
    const month = range.start.getMonth() + 1;
    const weekRanges = buildWeekRangesForMonth(year, month);

    return {
      period: 'monthly',
      month,
      year,
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      weeklyBreakdown: weekRanges.map((weekRange, index) =>
        buildBreakdownRow(
          `Week ${index + 1}`,
          weekRange,
          sales,
          expenses,
          transfers
        )
      ),
      totalSales: metrics.totalSales,
      totalProfit: metrics.totalProfit,
      totalExpenses: metrics.totalExpenses,
      netProfit: metrics.netProfit,
      cashIn: metrics.cashIn,
      cashOut: metrics.cashOut,
      prescriptionsCount: metrics.prescriptionsCount,
    };
  },

  async getYearlyReport(filters: YearlyReportFilters) {
    const range = resolveYearlyRange(filters);
    const { sales, expenses, transfers } = await fetchSalesExpensesTransfers(range);
    const metrics = buildMetrics(sales, expenses, transfers);
    const year = range.start.getFullYear();
    const monthRanges = buildMonthRangesForYear(year);

    return {
      period: 'yearly',
      year,
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      monthlyBreakdown: monthRanges.map((monthRange) =>
        buildBreakdownRow(
          formatShortMonth(monthRange.start),
          monthRange,
          sales,
          expenses,
          transfers
        )
      ),
      totalSales: metrics.totalSales,
      totalProfit: metrics.totalProfit,
      totalExpenses: metrics.totalExpenses,
      netProfit: metrics.netProfit,
      cashIn: metrics.cashIn,
      cashOut: metrics.cashOut,
      prescriptionsCount: metrics.prescriptionsCount,
    };
  },

  async getInventoryReport() {
    const medicines = await prisma.medicine.findMany({
      orderBy: [{ quantity: 'asc' }, { expiryDate: 'asc' }],
    });

    const today = startOfDay(new Date());
    const expiringSoonLimit = endOfDay(addDays(today, EXPIRING_SOON_DAYS));
    const lowStock = medicines.filter((medicine) => medicine.quantity <= medicine.minQuantity);
    const expired = medicines.filter((medicine) => medicine.expiryDate < today);
    const expiringSoon = medicines.filter(
      (medicine) => medicine.expiryDate >= today && medicine.expiryDate <= expiringSoonLimit
    );

    return {
      generatedAt: new Date().toISOString(),
      totalMedicines: medicines.length,
      totalUnitsInStock: medicines.reduce((sum, medicine) => sum + medicine.quantity, 0),
      totalStockValueAtCost: roundCurrency(
        medicines.reduce((sum, medicine) => sum + medicine.quantity * medicine.buyPrice, 0)
      ),
      totalStockValueAtRetail: roundCurrency(
        medicines.reduce((sum, medicine) => sum + medicine.quantity * medicine.sellPrice, 0)
      ),
      lowStockCount: lowStock.length,
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      expiringSoonWindowDays: EXPIRING_SOON_DAYS,
      lowStock: lowStock.map(mapInventoryMedicine),
      expired: expired.map(mapInventoryMedicine),
      expiringSoon: expiringSoon.map(mapInventoryMedicine),
    };
  },

  async getMedicineSalesReport(limit = 10, direction: 'top' | 'least' = 'top') {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [medicines, prescriptionItems] = await Promise.all([
      prisma.medicine.findMany({
        select: {
          id: true,
          name: true,
          company: true,
          buyPrice: true,
          sellPrice: true,
          quantity: true,
          expiryDate: true,
        },
      }),
      prisma.prescriptionItem.findMany({
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          medicineId: true,
          medicine: {
            select: {
              name: true,
              company: true,
              buyPrice: true,
              sellPrice: true,
              quantity: true,
              expiryDate: true,
            },
          },
          returnedMeds: {
            select: {
              quantity: true,
            },
          },
        },
      }),
    ]);

    const aggregate = new Map(
      medicines.map((medicine) => [
        medicine.id,
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          company: medicine.company,
          currentStock: medicine.quantity,
          expiryDate: medicine.expiryDate.toISOString(),
          quantitySold: 0,
          grossQuantitySold: 0,
          returnedQuantity: 0,
          revenue: 0,
          profit: 0,
        },
      ])
    );

    for (const item of prescriptionItems) {
      const row = aggregate.get(item.medicineId);

      if (!row) {
        continue;
      }

      const returnedQuantity = item.returnedMeds.reduce((sum, returned) => sum + returned.quantity, 0);
      const netQuantitySold = Math.max(item.quantity - returnedQuantity, 0);

      row.grossQuantitySold += item.quantity;
      row.returnedQuantity += returnedQuantity;
      row.quantitySold += netQuantitySold;
      row.revenue += netQuantitySold * item.unitPrice;
      row.profit += netQuantitySold * (item.unitPrice - item.medicine.buyPrice);
    }

    const medicinesSorted = Array.from(aggregate.values())
      .map((medicine) => ({
        ...medicine,
        revenue: roundCurrency(medicine.revenue),
        profit: roundCurrency(medicine.profit),
      }))
      .sort((left, right) => {
        if (direction === 'top') {
          return (
            right.quantitySold - left.quantitySold ||
            right.revenue - left.revenue ||
            right.profit - left.profit ||
            left.medicineName.localeCompare(right.medicineName)
          );
        }

        return (
          left.quantitySold - right.quantitySold ||
          left.revenue - right.revenue ||
          left.profit - right.profit ||
          left.medicineName.localeCompare(right.medicineName)
        );
      })
      .slice(0, safeLimit)
      .map((medicine, index) => ({
        rank: index + 1,
        ...medicine,
      }));

    return {
      type: direction === 'top' ? 'top-selling' : 'least-selling',
      limit: safeLimit,
      medicines: medicinesSorted,
    };
  },

  async getProfitReport(filters: RangeReportFilters) {
    const fallback = resolveMonthlyRange({});
    const range = resolveFlexibleRange(filters, fallback);
    const [salesAggregate, expensesAggregate] = await Promise.all([
      prisma.sale.aggregate({
        _sum: {
          totalAmount: true,
          profit: true,
        },
        _count: {
          _all: true,
        },
        where: {
          date: {
            gte: range.start,
            lte: range.end,
          },
        },
      }),
      prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          date: {
            gte: range.start,
            lte: range.end,
          },
        },
      }),
    ]);

    const totalSales = salesAggregate._sum.totalAmount ?? 0;
    const grossProfit = salesAggregate._sum.profit ?? 0;
    const expenses = expensesAggregate._sum.amount ?? 0;
    const netProfit = grossProfit - expenses;
    const profitMarginPercentage = totalSales <= 0 ? 0 : (netProfit / totalSales) * 100;

    return {
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      salesCount: salesAggregate._count._all,
      totalSales: roundCurrency(totalSales),
      grossProfit: roundCurrency(grossProfit),
      expenses: roundCurrency(expenses),
      netProfit: roundCurrency(netProfit),
      profitMarginPercentage: roundCurrency(profitMarginPercentage),
    };
  },

  async getCompanyAccountReport() {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
        transactions: {
          select: {
            date: true,
            type: true,
            amount: true,
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
      },
      orderBy: [{ balance: 'desc' }, { name: 'asc' }],
    });

    return {
      totalCompanies: companies.length,
      totalPurchased: roundCurrency(sumBy(companies, (company) => company.totalPurchased)),
      totalPaid: roundCurrency(sumBy(companies, (company) => company.totalPaid)),
      outstandingBalance: roundCurrency(sumBy(companies, (company) => company.balance)),
      companiesWithOutstandingBalance: companies.filter((company) => company.balance > 0).length,
      companies: companies.map((company) => ({
        id: company.id,
        name: company.name,
        phone: company.phone,
        address: company.address,
        totalPurchased: roundCurrency(company.totalPurchased),
        totalPaid: roundCurrency(company.totalPaid),
        balance: roundCurrency(company.balance),
        transactionCount: company._count.transactions,
        lastTransactionDate: company.transactions[0]?.date.toISOString() ?? null,
        lastTransactionType: company.transactions[0]?.type ?? null,
        lastTransactionAmount: company.transactions[0]
          ? roundCurrency(company.transactions[0].amount)
          : null,
      })),
    };
  },

  async getCustomerDebtReport() {
    const customers = await prisma.customer.findMany({
      where: {
        totalDebt: {
          gt: 0,
        },
      },
      include: {
        _count: {
          select: {
            prescriptions: true,
            customerTransactions: true,
          },
        },
        customerTransactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            date: true,
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
      },
      orderBy: [{ totalDebt: 'desc' }, { name: 'asc' }],
    });

    return {
      totalCustomersWithDebt: customers.length,
      totalOutstandingDebt: roundCurrency(sumBy(customers, (customer) => customer.totalDebt)),
      averageDebtPerCustomer: roundCurrency(
        customers.length === 0 ? 0 : sumBy(customers, (customer) => customer.totalDebt) / customers.length
      ),
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        totalDebt: roundCurrency(customer.totalDebt),
        totalPrescriptions: customer._count.prescriptions,
        transactionCount: customer._count.customerTransactions,
        lastActivityDate: customer.customerTransactions[0]?.date.toISOString() ?? null,
        lastActivityType: customer.customerTransactions[0]?.type ?? null,
        lastActivityAmount: customer.customerTransactions[0]
          ? roundCurrency(customer.customerTransactions[0].amount)
          : null,
        createdAt: customer.createdAt.toISOString(),
      })),
    };
  },

  async getCashFlowReport(filters: RangeReportFilters) {
    const fallback = resolveMonthlyRange({});
    const range = resolveFlexibleRange(filters, fallback);
    const { sales, expenses, transfers } = await fetchSalesExpensesTransfers(range);
    const dayRanges = buildDayRanges(range);
    const breakdown = dayRanges.map((dayRange) =>
      buildBreakdownRow(getDayKey(dayRange.start), dayRange, sales, expenses, transfers)
    );

    return {
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      totalCashIn: roundCurrency(sumBy(breakdown, (row) => row.cashIn)),
      totalCashOut: roundCurrency(sumBy(breakdown, (row) => row.cashOut)),
      netCashFlow: roundCurrency(
        sumBy(breakdown, (row) => row.cashIn) - sumBy(breakdown, (row) => row.cashOut)
      ),
      breakdown,
    };
  },

  async getExpenseReport(filters: ExpenseReportFilters) {
    const fallback = resolveMonthlyRange({});
    const range = resolveFlexibleRange(filters, fallback);
    const where: Prisma.ExpenseWhereInput = {
      date: {
        gte: range.start,
        lte: range.end,
      },
      ...(filters.category ? { category: filters.category } : {}),
    };

    const expenses = await prisma.expense.findMany({
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
    });

    const byCategoryMap = new Map<ExpenseCategory, { totalAmount: number; count: number }>();

    for (const expense of expenses) {
      const current = byCategoryMap.get(expense.category) ?? { totalAmount: 0, count: 0 };
      current.totalAmount += expense.amount;
      current.count += 1;
      byCategoryMap.set(expense.category, current);
    }

    return {
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      category: filters.category ?? null,
      totalExpenses: roundCurrency(sumBy(expenses, (expense) => expense.amount)),
      count: expenses.length,
      byCategory: Array.from(byCategoryMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([category, row]) => ({
          category,
          totalAmount: roundCurrency(row.totalAmount),
          count: row.count,
        })),
      expenses: expenses.map((expense) => ({
        id: expense.id,
        category: expense.category,
        amount: roundCurrency(expense.amount),
        description: expense.description,
        date: expense.date.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        user: expense.user,
      })),
    };
  },
};
