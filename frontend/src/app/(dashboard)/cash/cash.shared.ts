export type Locale = 'fa' | 'ps' | 'en';

export interface CashUser {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CASHIER';
}

export interface CashRegisterSnapshot {
  registerId: string | null;
  date: string;
  openingBalance: number;
  totalSales: number;
  totalExpenses: number;
  totalTransfersOut: number;
  expectedClosingBalance: number;
  recordedClosingBalance: number | null;
  currentCashInHand: number;
  variance: number | null;
  note: string | null;
  openedAt: string | null;
  closedAt: string | null;
  isOpened: boolean;
  isOpen: boolean;
  isClosed: boolean;
  canOpen: boolean;
  canClose: boolean;
}

export interface CashTransferRecord {
  id: string;
  amount: number;
  fromAccount: string;
  toAccount: string;
  reason: string | null;
  date: string;
  createdAt: string;
  user: CashUser;
}

export interface CashExpenseRecord {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  createdAt: string;
  user: CashUser;
}

export interface DailyCashSale {
  id: string;
  prescriptionId: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'PAID' | 'PARTIAL' | 'DEBT';
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

export interface DailyCashReport {
  date: string;
  register: CashRegisterSnapshot;
  summary: {
    openingBalance: number;
    totalSales: number;
    totalExpenses: number;
    totalTransfersOut: number;
    netCashMovement: number;
    expectedClosingBalance: number;
    recordedClosingBalance: number | null;
    currentCashInHand: number;
    variance: number | null;
  };
  inflows: {
    sales: DailyCashSale[];
  };
  outflows: {
    expenses: CashExpenseRecord[];
    transfers: CashTransferRecord[];
  };
}

export interface TransfersResponse {
  transfers: CashTransferRecord[];
  summary: {
    count: number;
    totalTransferred: number;
  };
  filters: {
    startDate: string | null;
    endDate: string | null;
    limit: number | null;
  };
}

export interface MonthlyCashReport {
  month: number;
  year: number;
  range: {
    start: string;
    end: string;
  };
  summary: {
    registerDays: number;
    closedDays: number;
    totalOpeningBalance: number;
    totalSales: number;
    totalExpenses: number;
    totalTransfersOut: number;
    netCashMovement: number;
    totalRecordedClosingBalance: number;
  };
  days: CashRegisterSnapshot[];
}

export function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'en' ? 'ltr' : 'rtl';
}

export function formatMoney(value: number, locale: Locale): string {
  const isWholeNumber = Number.isInteger(value);
  const formatted = value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `؋ ${formatted}`;
}

export function formatDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');
}

export function formatDateTime(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

export function getTodayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}
