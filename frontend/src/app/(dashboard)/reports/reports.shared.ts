'use client';

export type Locale = 'fa' | 'ps' | 'en';
export type Direction = 'rtl' | 'ltr';
export type PeriodTab = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ReportBreakdownRow {
  label: string;
  start: string;
  end: string;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  transfersOut: number;
  prescriptionsCount: number;
}

export interface DailyReportData {
  date: string;
  range: {
    start: string;
    end: string;
  };
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  transfersOut: number;
  prescriptionsCount: number;
}

export interface WeeklyReportData {
  period: 'weekly';
  weekStartsOn: string;
  range: {
    start: string;
    end: string;
  };
  dailyBreakdown: ReportBreakdownRow[];
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  prescriptionsCount: number;
}

export interface MonthlyReportData {
  period: 'monthly';
  month: number;
  year: number;
  range: {
    start: string;
    end: string;
  };
  weeklyBreakdown: ReportBreakdownRow[];
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  prescriptionsCount: number;
}

export interface YearlyReportData {
  period: 'yearly';
  year: number;
  range: {
    start: string;
    end: string;
  };
  monthlyBreakdown: ReportBreakdownRow[];
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
  prescriptionsCount: number;
}

export interface InventoryMedicineRow {
  id: string;
  name: string;
  company: string;
  quantity: number;
  minQuantity: number;
  buyPrice: number;
  sellPrice: number;
  expiryDate: string;
  daysUntilExpiry: number;
  stockValueAtCost: number;
  stockValueAtRetail: number;
}

export interface InventoryReportData {
  generatedAt: string;
  totalMedicines: number;
  totalUnitsInStock: number;
  totalStockValueAtCost: number;
  totalStockValueAtRetail: number;
  lowStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  expiringSoonWindowDays: number;
  lowStock: InventoryMedicineRow[];
  expired: InventoryMedicineRow[];
  expiringSoon: InventoryMedicineRow[];
}

export interface MedicinePerformanceRow {
  rank: number;
  medicineId: string;
  medicineName: string;
  company: string;
  currentStock: number;
  expiryDate: string;
  quantitySold: number;
  grossQuantitySold: number;
  returnedQuantity: number;
  revenue: number;
  profit: number;
}

export interface MedicinePerformanceReportData {
  type: 'top-selling' | 'least-selling';
  limit: number;
  medicines: MedicinePerformanceRow[];
}

export interface ProfitReportData {
  range: {
    start: string;
    end: string;
  };
  salesCount: number;
  totalSales: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMarginPercentage: number;
}

export interface CompanyAccountRow {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  totalPurchased: number;
  totalPaid: number;
  balance: number;
  transactionCount: number;
  lastTransactionDate: string | null;
  lastTransactionType: 'PURCHASE' | 'PAYMENT' | null;
  lastTransactionAmount: number | null;
}

export interface CompanyAccountsReportData {
  totalCompanies: number;
  totalPurchased: number;
  totalPaid: number;
  outstandingBalance: number;
  companiesWithOutstandingBalance: number;
  companies: CompanyAccountRow[];
}

export interface CustomerDebtRow {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
  totalPrescriptions: number;
  transactionCount: number;
  lastActivityDate: string | null;
  lastActivityType: 'DEBT' | 'PAYMENT' | null;
  lastActivityAmount: number | null;
  createdAt: string;
}

export interface CustomerDebtReportData {
  totalCustomersWithDebt: number;
  totalOutstandingDebt: number;
  averageDebtPerCustomer: number;
  customers: CustomerDebtRow[];
}

export interface CashFlowReportData {
  range: {
    start: string;
    end: string;
  };
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  breakdown: ReportBreakdownRow[];
}

export interface ExpenseCategoryBreakdownRow {
  category: string;
  totalAmount: number;
  count: number;
}

export interface ExpenseReportRow {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
}

export interface ExpenseReportData {
  range: {
    start: string;
    end: string;
  };
  category: string | null;
  totalExpenses: number;
  count: number;
  byCategory: ExpenseCategoryBreakdownRow[];
  expenses: ExpenseReportRow[];
}

export interface ChartPoint {
  label: string;
  sales: number;
  profit: number;
  expenses: number;
}

export function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

export function getDirection(locale: Locale): Direction {
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

export function formatPercent(value: number, locale: Locale): string {
  const formatted = value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formatted}%`;
}

export function formatDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');
}

export function formatDateTime(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createChartPoint(label: string, sales: number, profit: number, expenses: number): ChartPoint {
  return {
    label,
    sales,
    profit,
    expenses,
  };
}
