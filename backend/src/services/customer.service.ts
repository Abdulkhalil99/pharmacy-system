import { CustomerTransactionType, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prismaClient';

export interface CustomerInput {
  name: string;
  phone?: string;
}

export interface CustomerFilters {
  search?: string;
  onlyDebtors?: boolean;
}

export interface CustomerPaymentInput {
  amount: number;
  note?: string;
  date?: string;
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

const parseDateOrNow = (value?: string): Date => {
  if (!value) {
    return new Date();
  }

  return parseDateInput(value);
};

const buildCustomerWhere = (filters: CustomerFilters): Prisma.CustomerWhereInput => {
  const search = normalizeOptionalString(filters.search);

  return {
    ...(filters.onlyDebtors ? { totalDebt: { gt: 0 } } : {}),
    ...(search
      ? {
          OR: [
            {
              name: {
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
          ],
        }
      : {}),
  };
};

const customerListArgs = Prisma.validator<Prisma.CustomerDefaultArgs>()({
  include: {
    _count: {
      select: {
        prescriptions: true,
        customerTransactions: true,
      },
    },
    customerTransactions: {
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 1,
    },
  },
});

type CustomerListRow = Prisma.CustomerGetPayload<typeof customerListArgs>;

const mapCustomerListRow = (customer: CustomerListRow) => {
  const lastTransaction = customer.customerTransactions[0] ?? null;

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    totalDebt: roundCurrency(customer.totalDebt),
    createdAt: customer.createdAt.toISOString(),
    totalPrescriptions: customer._count.prescriptions,
    transactionCount: customer._count.customerTransactions,
    lastTransactionDate: lastTransaction?.date.toISOString() ?? null,
    lastTransactionType: lastTransaction?.type ?? null,
    lastTransactionAmount: lastTransaction ? roundCurrency(lastTransaction.amount) : null,
  };
};

const buildTransactionDescription = (
  transaction: Prisma.CustomerTransactionGetPayload<{
    include: {
      prescription: true;
    };
  }>
) => {
  if (transaction.note) {
    return transaction.note;
  }

  if (transaction.type === CustomerTransactionType.DEBT) {
    return transaction.prescriptionId
      ? `Debt from prescription ${transaction.prescriptionId}`
      : 'Debt created from prescription sale';
  }

  return 'Customer payment received';
};

const mapTransaction = (
  transaction: Prisma.CustomerTransactionGetPayload<{
    include: {
      prescription: true;
    };
  }>
) => ({
  id: transaction.id,
  customerId: transaction.customerId,
  prescriptionId: transaction.prescriptionId,
  type: transaction.type,
  amount: roundCurrency(transaction.amount),
  note: transaction.note,
  description: buildTransactionDescription(transaction),
  date: transaction.date.toISOString(),
  createdAt: transaction.createdAt.toISOString(),
  prescription: transaction.prescription
    ? {
        id: transaction.prescription.id,
        totalAmount: roundCurrency(transaction.prescription.totalAmount),
        paidAmount: roundCurrency(transaction.prescription.paidAmount),
        debtAmount: roundCurrency(transaction.prescription.debtAmount),
        status: transaction.prescription.status,
        createdAt: transaction.prescription.createdAt.toISOString(),
      }
    : null,
});

const getCustomerOrThrow = async (
  client: Prisma.TransactionClient | typeof prisma,
  customerId: string
) => {
  const customer = await client.customer.findUnique({
    where: { id: customerId },
    include: customerListArgs.include,
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return customer;
};

export const customerService = {
  async getAll(filters: CustomerFilters) {
    const customers = await prisma.customer.findMany({
      where: buildCustomerWhere(filters),
      include: customerListArgs.include,
      orderBy: [{ totalDebt: 'desc' }, { name: 'asc' }],
    });

    return customers.map(mapCustomerListRow);
  },

  async getDebtors(filters: CustomerFilters) {
    return customerService.getAll({
      ...filters,
      onlyDebtors: true,
    });
  },

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: customerListArgs.include,
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const [paymentAggregate, debtAggregate] = await Promise.all([
      prisma.customerTransaction.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        where: {
          customerId: id,
          type: CustomerTransactionType.PAYMENT,
        },
      }),
      prisma.customerTransaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          customerId: id,
          type: CustomerTransactionType.DEBT,
        },
      }),
    ]);

    return {
      ...mapCustomerListRow(customer),
      totalPaid: roundCurrency(paymentAggregate._sum.amount ?? 0),
      totalDebtCreated: roundCurrency(debtAggregate._sum.amount ?? 0),
      paymentCount: paymentAggregate._count._all,
    };
  },

  async create(data: CustomerInput) {
    const name = data.name.trim();

    if (!name) {
      throw new AppError('Customer name is required', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: normalizeOptionalString(data.phone),
      },
      include: customerListArgs.include,
    });

    return mapCustomerListRow(customer);
  },

  async update(id: string, data: Partial<CustomerInput>) {
    await customerService.getById(id);

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: normalizeOptionalString(data.phone) } : {}),
      },
      include: customerListArgs.include,
    });

    return mapCustomerListRow(updatedCustomer);
  },

  async getTransactions(customerId: string) {
    await customerService.getById(customerId);

    const transactions = await prisma.customerTransaction.findMany({
      where: { customerId },
      include: {
        prescription: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return transactions.map(mapTransaction);
  },

  async recordPayment(customerId: string, data: CustomerPaymentInput) {
    const amount = Number(data.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError('Payment amount must be greater than 0', 400);
    }

    return prisma.$transaction(async (tx) => {
      const customer = await getCustomerOrThrow(tx, customerId);

      if (customer.totalDebt <= 0) {
        throw new AppError('This customer has no outstanding debt', 400);
      }

      if (amount > customer.totalDebt) {
        throw new AppError(
          `Payment amount cannot be greater than remaining debt (${roundCurrency(customer.totalDebt)})`,
          400
        );
      }

      const paymentDate = parseDateOrNow(data.date);
      const normalizedAmount = roundCurrency(amount);

      const transaction = await tx.customerTransaction.create({
        data: {
          customerId,
          type: CustomerTransactionType.PAYMENT,
          amount: normalizedAmount,
          note: normalizeOptionalString(data.note),
          date: paymentDate,
        },
        include: {
          prescription: true,
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          totalDebt: {
            decrement: normalizedAmount,
          },
        },
        include: customerListArgs.include,
      });

      return {
        customer: mapCustomerListRow(updatedCustomer),
        transaction: mapTransaction(transaction),
        remainingDebt: roundCurrency(updatedCustomer.totalDebt),
      };
    });
  },

  async getReport(customerId: string) {
    const [customer, transactions, prescriptions, paymentAggregate, debtAggregate] =
      await Promise.all([
        prisma.customer.findUnique({
          where: { id: customerId },
          include: customerListArgs.include,
        }),
        prisma.customerTransaction.findMany({
          where: { customerId },
          include: {
            prescription: true,
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }),
        prisma.prescription.findMany({
          where: { customerId },
          orderBy: [{ createdAt: 'desc' }],
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            debtAmount: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.customerTransaction.aggregate({
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
          where: {
            customerId,
            type: CustomerTransactionType.PAYMENT,
          },
        }),
        prisma.customerTransaction.aggregate({
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
          where: {
            customerId,
            type: CustomerTransactionType.DEBT,
          },
        }),
      ]);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const lastTransaction = transactions[0] ?? null;
    const lastPayment = transactions.find(
      (transaction) => transaction.type === CustomerTransactionType.PAYMENT
    );
    const lastDebt = transactions.find(
      (transaction) => transaction.type === CustomerTransactionType.DEBT
    );

    return {
      customer: {
        ...mapCustomerListRow(customer),
        totalPaid: roundCurrency(paymentAggregate._sum.amount ?? 0),
        totalDebtCreated: roundCurrency(debtAggregate._sum.amount ?? 0),
      },
      transactions: transactions.map(mapTransaction),
      prescriptions: prescriptions.map((prescription) => ({
        id: prescription.id,
        totalAmount: roundCurrency(prescription.totalAmount),
        paidAmount: roundCurrency(prescription.paidAmount),
        debtAmount: roundCurrency(prescription.debtAmount),
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
      })),
      summary: {
        totalDebt: roundCurrency(customer.totalDebt),
        totalDebtCreated: roundCurrency(debtAggregate._sum.amount ?? 0),
        totalPaid: roundCurrency(paymentAggregate._sum.amount ?? 0),
        totalPrescriptions: customer._count.prescriptions,
        transactionCount: customer._count.customerTransactions,
        paymentCount: paymentAggregate._count._all,
        debtEntryCount: debtAggregate._count._all,
        lastTransactionDate: lastTransaction?.date.toISOString() ?? null,
        lastPaymentDate: lastPayment?.date.toISOString() ?? null,
        lastDebtDate: lastDebt?.date.toISOString() ?? null,
      },
    };
  },
};
