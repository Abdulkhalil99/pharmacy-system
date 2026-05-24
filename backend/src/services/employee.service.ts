import { Prisma, Role } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prismaClient';

export interface EmployeeFilters {
  search?: string;
  isActive?: boolean;
}

export interface CreateEmployeeInput {
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  salary: number;
  joinDate: string;
  isActive?: boolean;
}

export interface UpdateEmployeeInput {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  salary?: number;
  joinDate?: string;
  isActive?: boolean;
}

const employeeArgs = Prisma.validator<Prisma.EmployeeDefaultArgs>()({
  include: {
    user: {
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        language: true,
        lastLogin: true,
      },
    },
  },
});

const salaryHistoryArgs = Prisma.validator<Prisma.SalaryPaymentDefaultArgs>()({
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
      },
    },
  },
});

type EmployeeRow = Prisma.EmployeeGetPayload<typeof employeeArgs>;
type SalaryHistoryRow = Prisma.SalaryPaymentGetPayload<typeof salaryHistoryArgs>;

const normalizeOptionalString = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const roundCurrency = (value: number) => Number(value.toFixed(2));

const parseDateInput = (value: string): Date => {
  const trimmed = value.trim();
  const simpleDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (simpleDateMatch) {
    const [, year, month, day] = simpleDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid join date provided', 400);
  }

  return parsed;
};

const buildEmployeeWhere = (filters: EmployeeFilters): Prisma.EmployeeWhereInput => {
  const search = normalizeOptionalString(filters.search);

  return {
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(search
      ? {
          OR: [
            {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              phone: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              role: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
  };
};

const mapEmployee = (employee: EmployeeRow) => ({
  id: employee.id,
  fullName: employee.fullName,
  phone: employee.phone,
  email: employee.email,
  role: employee.role,
  salary: roundCurrency(employee.salary),
  joinDate: employee.joinDate.toISOString(),
  isActive: employee.isActive,
  userId: employee.userId,
  createdAt: employee.createdAt.toISOString(),
  updatedAt: employee.updatedAt.toISOString(),
  hasLoginAccount: Boolean(employee.userId),
  user: employee.user
    ? {
        id: employee.user.id,
        name: employee.user.name,
        username: employee.user.username,
        role: employee.user.role,
        isActive: employee.user.isActive,
        language: employee.user.language,
        lastLogin: employee.user.lastLogin?.toISOString() ?? null,
      }
    : null,
});

const mapSalaryHistory = (payment: SalaryHistoryRow) => ({
  id: payment.id,
  employeeId: payment.employeeId,
  employeeName: payment.employeeName,
  amount: roundCurrency(payment.amount),
  month: payment.month,
  year: payment.year,
  note: payment.note,
  date: payment.date.toISOString(),
  createdAt: payment.createdAt.toISOString(),
  user: payment.user,
});

const getEmployeeOrThrow = async (id: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    ...employeeArgs,
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return employee;
};

const getSalaryHistoryForEmployee = async (employee: EmployeeRow) => {
  const salaries = await prisma.salaryPayment.findMany({
    where: {
      OR: [
        {
          employeeId: employee.id,
        },
        {
          employeeId: null,
          employeeName: {
            equals: employee.fullName,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: salaryHistoryArgs.include,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  const currentYear = new Date().getFullYear();
  const totalPaidThisYear = salaries
    .filter((salary) => salary.year === currentYear)
    .reduce((sum, salary) => sum + salary.amount, 0);
  const totalPaidAllTime = salaries.reduce((sum, salary) => sum + salary.amount, 0);

  return {
    payments: salaries.map(mapSalaryHistory),
    totalPaidThisYear: roundCurrency(totalPaidThisYear),
    totalPaidAllTime: roundCurrency(totalPaidAllTime),
    count: salaries.length,
  };
};

const ensureAvailableUserForLink = async (employeeId: string, userId: string) => {
  const [user, conflictingEmployee] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    }),
    prisma.employee.findFirst({
      where: {
        userId,
        id: {
          not: employeeId,
        },
      },
      select: {
        id: true,
        fullName: true,
      },
    }),
  ]);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!Object.values(Role).includes(user.role)) {
    throw new AppError('Invalid user role', 400);
  }

  if (conflictingEmployee) {
    throw new AppError(
      `This user is already linked to employee ${conflictingEmployee.fullName}`,
      409
    );
  }

  return user;
};

export const employeeService = {
  async getAll(filters: EmployeeFilters) {
    const employees = await prisma.employee.findMany({
      where: buildEmployeeWhere(filters),
      ...employeeArgs,
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });

    return employees.map(mapEmployee);
  },

  async getById(id: string) {
    const employee = await getEmployeeOrThrow(id);
    const salaryHistory = await getSalaryHistoryForEmployee(employee);

    return {
      ...mapEmployee(employee),
      salaryHistory: salaryHistory.payments,
      salarySummary: {
        totalPaidThisYear: salaryHistory.totalPaidThisYear,
        totalPaidAllTime: salaryHistory.totalPaidAllTime,
        count: salaryHistory.count,
      },
    };
  },

  async create(data: CreateEmployeeInput) {
    const fullName = data.fullName.trim();
    const phone = data.phone.trim();
    const role = data.role.trim();
    const email = normalizeOptionalString(data.email);
    const salary = Number(data.salary);

    if (!fullName) {
      throw new AppError('Employee name is required', 400);
    }

    if (!phone) {
      throw new AppError('Phone is required', 400);
    }

    if (!role) {
      throw new AppError('Role is required', 400);
    }

    if (Number.isNaN(salary) || salary < 0) {
      throw new AppError('Salary must be a valid number', 400);
    }

    const employee = await prisma.employee.create({
      data: {
        fullName,
        phone,
        email,
        role,
        salary: roundCurrency(salary),
        joinDate: parseDateInput(data.joinDate),
        isActive: data.isActive ?? true,
      },
      ...employeeArgs,
    });

    return mapEmployee(employee);
  },

  async update(id: string, data: UpdateEmployeeInput) {
    await getEmployeeOrThrow(id);

    if (Object.values(data).every((value) => value === undefined)) {
      throw new AppError('No updates were provided', 400);
    }

    if (data.salary !== undefined && (Number.isNaN(Number(data.salary)) || Number(data.salary) < 0)) {
      throw new AppError('Salary must be a valid number', 400);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() } : {}),
        ...(data.email !== undefined ? { email: normalizeOptionalString(data.email) } : {}),
        ...(data.role !== undefined ? { role: data.role.trim() } : {}),
        ...(data.salary !== undefined ? { salary: roundCurrency(Number(data.salary)) } : {}),
        ...(data.joinDate !== undefined ? { joinDate: parseDateInput(data.joinDate) } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      ...employeeArgs,
    });

    return mapEmployee(employee);
  },

  async softDelete(id: string) {
    await getEmployeeOrThrow(id);

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
      },
      ...employeeArgs,
    });

    return mapEmployee(employee);
  },

  async linkUser(employeeId: string, userId: string) {
    await Promise.all([
      getEmployeeOrThrow(employeeId),
      ensureAvailableUserForLink(employeeId, userId),
    ]);

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        userId,
      },
      ...employeeArgs,
    });

    return mapEmployee(employee);
  },

  async getSalaryHistory(id: string) {
    const employee = await getEmployeeOrThrow(id);
    const salaryHistory = await getSalaryHistoryForEmployee(employee);

    return {
      employee: mapEmployee(employee),
      payments: salaryHistory.payments,
      totalPaidThisYear: salaryHistory.totalPaidThisYear,
      totalPaidAllTime: salaryHistory.totalPaidAllTime,
      count: salaryHistory.count,
    };
  },
};
