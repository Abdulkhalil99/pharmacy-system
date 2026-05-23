import { ExpenseCategory, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { cashRegisterService } from './cashregister.service';
import { prisma } from '../utils/prismaClient';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date?: string;
  userId: string;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  amount?: number;
  description?: string;
  date?: string;
}

export interface ExpenseDailySummaryFilters {
  date?: string;
}

export interface ExpenseMonthlySummaryFilters {
  month?: number;
  year?: number;
}

export interface ExpenseYearlySummaryFilters {
  year?: number;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  ExpenseCategory.RENT,
  ExpenseCategory.ELECTRICITY,
  ExpenseCategory.SALARY,
  ExpenseCategory.TRANSPORT,
  ExpenseCategory.OTHER,
];

const expenseInclude = Prisma.validator<Prisma.ExpenseDefaultArgs>()({
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

type ExpenseWithUser = Prisma.ExpenseGetPayload<typeof expenseInclude>;

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

const parseDateOrNow = (value?: string): Date => {
  if (!value) {
    return new Date();
  }

  return parseDateInput(value);
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const startOfMonth = (year: number, month: number): Date =>
  new Date(year, month - 1, 1, 0, 0, 0, 0);

const endOfMonth = (year: number, month: number): Date =>
  new Date(year, month, 0, 23, 59, 59, 999);

const startOfYear = (year: number): Date => new Date(year, 0, 1, 0, 0, 0, 0);

const endOfYear = (year: number): Date => new Date(year, 11, 31, 23, 59, 59, 999);

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

const buildDateWhere = (filters: ExpenseFilters): Prisma.ExpenseWhereInput => {
  const start = filters.startDate ? parseDateInput(filters.startDate) : null;
  const end = filters.endDate ? parseDateInput(filters.endDate, true) : null;

  if (start && end && start > end) {
    throw new AppError('Start date cannot be after end date', 400);
  }

  return {
    ...(filters.category ? { category: filters.category } : {}),
    ...(!start && !end
      ? {}
      : {
          date: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }),
  };
};

const mapExpense = (expense: ExpenseWithUser) => ({
  id: expense.id,
  userId: expense.userId,
  category: expense.category,
  amount: roundCurrency(expense.amount),
  description: expense.description,
  date: expense.date.toISOString(),
  createdAt: expense.createdAt.toISOString(),
  user: expense.user,
});

const buildCategoryBreakdown = (
  expenses: Array<Pick<ExpenseWithUser, 'category' | 'amount'>>
) => {
  const totals = new Map<ExpenseCategory, { totalAmount: number; count: number }>();

  for (const category of EXPENSE_CATEGORIES) {
    totals.set(category, { totalAmount: 0, count: 0 });
  }

  for (const expense of expenses) {
    const current = totals.get(expense.category) ?? { totalAmount: 0, count: 0 };
    current.totalAmount += expense.amount;
    current.count += 1;
    totals.set(expense.category, current);
  }

  return EXPENSE_CATEGORIES.map((category) => {
    const row = totals.get(category) ?? { totalAmount: 0, count: 0 };

    return {
      category,
      totalAmount: roundCurrency(row.totalAmount),
      count: row.count,
    };
  });
};

const getExpenseOrThrow = async (
  client: PrismaClientLike,
  expenseId: string
) => {
  const expense = await client.expense.findUnique({
    where: { id: expenseId },
    include: expenseInclude.include,
  });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return expense;
};

const syncCashForDates = async (
  client: PrismaClientLike,
  dates: Date[]
) => {
  const uniqueDays = Array.from(new Set(dates.map((date) => startOfDay(date).getTime()))).map(
    (value) => new Date(value)
  );

  for (const day of uniqueDays) {
    await cashRegisterService.syncRegisterTotalsForDate(day, client);
  }
};

export const expenseService = {
  async getAll(filters: ExpenseFilters) {
    const expenses = await prisma.expense.findMany({
      where: buildDateWhere(filters),
      include: expenseInclude.include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      expenses: expenses.map(mapExpense),
      summary: {
        totalAmount: roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
        count: expenses.length,
        byCategory: buildCategoryBreakdown(expenses),
      },
      filters: {
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
        category: filters.category ?? null,
      },
    };
  },

  async create(data: ExpenseInput) {
    const amount = Number(data.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError('Expense amount must be greater than 0', 400);
    }

    const expenseDate = parseDateOrNow(data.date);

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          userId: data.userId,
          category: data.category,
          amount: roundCurrency(amount),
          description: normalizeOptionalString(data.description),
          date: expenseDate,
        },
        include: expenseInclude.include,
      });

      await syncCashForDates(tx, [expenseDate]);

      return mapExpense(expense);
    });
  },

  async update(id: string, data: UpdateExpenseInput) {
    const existingExpense = await getExpenseOrThrow(prisma, id);

    if (data.amount !== undefined) {
      const amount = Number(data.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        throw new AppError('Expense amount must be greater than 0', 400);
      }
    }

    const nextDate = data.date ? parseDateInput(data.date) : existingExpense.date;

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: {
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.amount !== undefined ? { amount: roundCurrency(Number(data.amount)) } : {}),
          ...(data.description !== undefined
            ? { description: normalizeOptionalString(data.description) }
            : {}),
          ...(data.date !== undefined ? { date: nextDate } : {}),
        },
        include: expenseInclude.include,
      });

      await syncCashForDates(tx, [existingExpense.date, nextDate]);

      return mapExpense(expense);
    });
  },

  async delete(id: string) {
    const existingExpense = await getExpenseOrThrow(prisma, id);

    return prisma.$transaction(async (tx) => {
      await tx.expense.delete({
        where: { id },
      });

      await syncCashForDates(tx, [existingExpense.date]);

      return {
        id: existingExpense.id,
        deletedAt: new Date().toISOString(),
      };
    });
  },

  async getDailySummary(filters: ExpenseDailySummaryFilters) {
    const day = filters.date ? startOfDay(parseDateInput(filters.date)) : startOfDay(new Date());
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: day,
          lte: endOfDay(day),
        },
      },
      include: expenseInclude.include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      period: 'daily',
      date: getDayKey(day),
      totalAmount: roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
      count: expenses.length,
      byCategory: buildCategoryBreakdown(expenses),
      expenses: expenses.map(mapExpense),
    };
  },

  async getMonthlySummary(filters: ExpenseMonthlySummaryFilters) {
    const now = new Date();
    const month = filters.month ?? now.getMonth() + 1;
    const year = filters.year ?? now.getFullYear();

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError('Month must be between 1 and 12', 400);
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new AppError('Year must be between 2000 and 2100', 400);
    }

    const start = startOfMonth(year, month);
    const end = endOfMonth(year, month);
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: expenseInclude.include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const byDayMap = new Map<string, number>();

    for (const expense of expenses) {
      const key = getDayKey(expense.date);
      byDayMap.set(key, (byDayMap.get(key) ?? 0) + expense.amount);
    }

    return {
      period: 'monthly',
      month,
      year,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalAmount: roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
      count: expenses.length,
      byCategory: buildCategoryBreakdown(expenses),
      byDay: Array.from(byDayMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, totalAmount]) => ({
          date,
          totalAmount: roundCurrency(totalAmount),
        })),
      recentExpenses: expenses.slice(0, 10).map(mapExpense),
    };
  },

  async getYearlySummary(filters: ExpenseYearlySummaryFilters) {
    const now = new Date();
    const year = filters.year ?? now.getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new AppError('Year must be between 2000 and 2100', 400);
    }

    const start = startOfYear(year);
    const end = endOfYear(year);
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: expenseInclude.include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const byMonthMap = new Map<string, number>();

    for (const expense of expenses) {
      const key = getMonthKey(expense.date);
      byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + expense.amount);
    }

    return {
      period: 'yearly',
      year,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalAmount: roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
      count: expenses.length,
      byCategory: buildCategoryBreakdown(expenses),
      byMonth: Array.from(byMonthMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([monthKey, totalAmount]) => ({
          month: monthKey,
          totalAmount: roundCurrency(totalAmount),
        })),
      recentExpenses: expenses.slice(0, 12).map(mapExpense),
    };
  },
};
