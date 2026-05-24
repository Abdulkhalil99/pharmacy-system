import { Prisma, ExpenseCategory } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { cashRegisterService } from './cashregister.service';
import { prisma } from '../utils/prismaClient';

export interface SalaryFilters {
  employeeId?: string;
  employeeName?: string;
  month?: number;
  year?: number;
}

export interface SalaryPaymentInput {
  employeeId?: string;
  employeeName?: string;
  amount: number;
  month: number;
  year: number;
  note?: string;
  date?: string;
  userId: string;
}

export interface SalarySummaryFilters {
  month?: number;
  year?: number;
}

const salaryInclude = Prisma.validator<Prisma.SalaryPaymentDefaultArgs>()({
  include: {
    user: {
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    },
    employee: {
      select: {
        id: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    },
  },
});

type SalaryWithRelations = Prisma.SalaryPaymentGetPayload<typeof salaryInclude>;

const normalizeOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const roundCurrency = (value: number): number => Number(value.toFixed(2));

const parseDateInput = (value: string): Date => {
  const trimmed = value.trim();
  const simpleDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (simpleDateMatch) {
    const [, year, month, day] = simpleDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
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

const startOfMonth = (year: number, month: number): Date =>
  new Date(year, month - 1, 1, 0, 0, 0, 0);

const endOfMonth = (year: number, month: number): Date =>
  new Date(year, month, 0, 23, 59, 59, 999);

const buildSalaryWhere = (filters: SalaryFilters): Prisma.SalaryPaymentWhereInput => {
  const employeeName = normalizeOptionalString(filters.employeeName);

  return {
    ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    ...(employeeName
      ? {
          employeeName: {
            contains: employeeName,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(filters.month !== undefined ? { month: filters.month } : {}),
    ...(filters.year !== undefined ? { year: filters.year } : {}),
  };
};

const mapSalary = (salary: SalaryWithRelations) => ({
  id: salary.id,
  userId: salary.userId,
  employeeId: salary.employeeId,
  employeeName: salary.employeeName,
  amount: roundCurrency(salary.amount),
  month: salary.month,
  year: salary.year,
  note: salary.note,
  date: salary.date.toISOString(),
  createdAt: salary.createdAt.toISOString(),
  user: salary.user,
  employee: salary.employee
    ? {
        id: salary.employee.id,
        fullName: salary.employee.fullName,
        role: salary.employee.role,
        isActive: salary.employee.isActive,
      }
    : null,
});

const buildSalaryExpenseDescription = (employeeName: string, note?: string) => {
  const normalizedNote = normalizeOptionalString(note);
  return normalizedNote
    ? `Salary paid to ${employeeName} | ${normalizedNote}`
    : `Salary paid to ${employeeName}`;
};

const validateSalaryPeriod = (month: number, year: number) => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError('Month must be between 1 and 12', 400);
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError('Year must be between 2000 and 2100', 400);
  }
};

const resolveEmployeeForPayment = async (
  tx: Prisma.TransactionClient,
  data: SalaryPaymentInput
) => {
  if (data.employeeId) {
    const employee = await tx.employee.findUnique({
      where: { id: data.employeeId },
      select: {
        id: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return {
      employeeId: employee.id,
      employeeName: employee.fullName,
    };
  }

  const employeeName = data.employeeName?.trim();

  if (!employeeName) {
    throw new AppError('Employee name is required', 400);
  }

  return {
    employeeId: null,
    employeeName,
  };
};

export const salaryService = {
  async getAll(filters: SalaryFilters) {
    if (filters.month !== undefined && filters.year !== undefined) {
      validateSalaryPeriod(filters.month, filters.year);
    } else {
      if (
        filters.month !== undefined &&
        (!Number.isInteger(filters.month) || filters.month < 1 || filters.month > 12)
      ) {
        throw new AppError('Month must be between 1 and 12', 400);
      }

      if (
        filters.year !== undefined &&
        (!Number.isInteger(filters.year) || filters.year < 2000 || filters.year > 2100)
      ) {
        throw new AppError('Year must be between 2000 and 2100', 400);
      }
    }

    const [salaries, employees] = await Promise.all([
      prisma.salaryPayment.findMany({
        where: buildSalaryWhere(filters),
        include: salaryInclude.include,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.employee.findMany({
        orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
        select: {
          id: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      }),
    ]);

    return {
      salaries: salaries.map(mapSalary),
      summary: {
        totalAmount: roundCurrency(salaries.reduce((sum, salary) => sum + salary.amount, 0)),
        count: salaries.length,
      },
      employees,
      employeeNames: employees.map((employee) => employee.fullName),
      filters: {
        employeeId: filters.employeeId ?? null,
        employeeName: filters.employeeName ?? null,
        month: filters.month ?? null,
        year: filters.year ?? null,
      },
    };
  },

  async recordPayment(data: SalaryPaymentInput) {
    const amount = Number(data.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError('Salary amount must be greater than 0', 400);
    }

    validateSalaryPeriod(data.month, data.year);
    const paymentDate = parseDateOrNow(data.date);

    return prisma.$transaction(async (tx) => {
      const employee = await resolveEmployeeForPayment(tx, data);

      const salary = await tx.salaryPayment.create({
        data: {
          userId: data.userId,
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          amount: roundCurrency(amount),
          month: data.month,
          year: data.year,
          note: normalizeOptionalString(data.note),
          date: paymentDate,
        },
        include: salaryInclude.include,
      });

      const expense = await tx.expense.create({
        data: {
          userId: data.userId,
          category: ExpenseCategory.SALARY,
          amount: roundCurrency(amount),
          description: buildSalaryExpenseDescription(employee.employeeName, data.note),
          date: paymentDate,
        },
      });

      await cashRegisterService.syncRegisterTotalsForDate(paymentDate, tx);

      return {
        salary: mapSalary(salary),
        expense: {
          id: expense.id,
          category: expense.category,
          amount: roundCurrency(expense.amount),
          description: expense.description,
          date: expense.date.toISOString(),
          createdAt: expense.createdAt.toISOString(),
        },
      };
    });
  },

  async getEmployeeHistory(employeeName: string) {
    const normalizedName = employeeName.trim();

    if (!normalizedName) {
      throw new AppError('Employee name is required', 400);
    }

    const salaries = await prisma.salaryPayment.findMany({
      where: {
        employeeName: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      include: salaryInclude.include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      employeeName: normalizedName,
      salaries: salaries.map(mapSalary),
      summary: {
        totalAmount: roundCurrency(salaries.reduce((sum, salary) => sum + salary.amount, 0)),
        count: salaries.length,
        lastPaymentDate: salaries[0]?.date.toISOString() ?? null,
      },
    };
  },

  async getSummary(filters: SalarySummaryFilters) {
    const now = new Date();
    const month = filters.month ?? now.getMonth() + 1;
    const year = filters.year ?? now.getFullYear();

    validateSalaryPeriod(month, year);

    const start = startOfMonth(year, month);
    const end = endOfMonth(year, month);
    const salaries = await prisma.salaryPayment.findMany({
      where: {
        month,
        year,
      },
      include: salaryInclude.include,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const byEmployeeMap = new Map<string, { totalAmount: number; count: number }>();

    for (const salary of salaries) {
      const key = salary.employeeId ?? salary.employeeName;
      const row = byEmployeeMap.get(key) ?? { totalAmount: 0, count: 0 };
      row.totalAmount += salary.amount;
      row.count += 1;
      byEmployeeMap.set(key, row);
    }

    return {
      month,
      year,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalAmount: roundCurrency(salaries.reduce((sum, salary) => sum + salary.amount, 0)),
      count: salaries.length,
      byEmployee: Array.from(byEmployeeMap.entries()).map(([key, row]) => {
        const sample = salaries.find((salary) => (salary.employeeId ?? salary.employeeName) === key);
        return {
          employeeId: sample?.employeeId ?? null,
          employeeName: sample?.employeeName ?? key,
          totalAmount: roundCurrency(row.totalAmount),
          count: row.count,
        };
      }),
      recentPayments: salaries.slice(0, 10).map(mapSalary),
    };
  },
};
