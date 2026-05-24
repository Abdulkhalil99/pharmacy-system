'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { InventoryReport } from './components/InventoryReport';
import { PrintButton } from './components/PrintButton';
import { SalesChart } from './components/SalesChart';
import { SalesSummaryCard } from './components/SalesSummaryCard';
import { TopMedicinesTable } from './components/TopMedicinesTable';
import {
  CashFlowReportData,
  ChartPoint,
  CompanyAccountsReportData,
  CustomerDebtReportData,
  DailyReportData,
  ExpenseReportData,
  InventoryReportData,
  MedicinePerformanceReportData,
  MonthlyReportData,
  PeriodTab,
  ProfitReportData,
  ReportBreakdownRow,
  WeeklyReportData,
  YearlyReportData,
  createChartPoint,
  formatDate,
  formatMonthLabel,
  formatMoney,
  formatNumber,
  formatPercent,
  getExpenseCategoryLabel,
  getDirection,
  getLocale,
  toDateInputValue,
} from './reports.shared';

type RangeState = {
  startDate: string;
  endDate: string;
};

type ReportsState = {
  daily: DailyReportData | null;
  weekly: WeeklyReportData | null;
  monthly: MonthlyReportData | null;
  yearly: YearlyReportData | null;
  inventory: InventoryReportData | null;
  topSelling: MedicinePerformanceReportData | null;
  leastSelling: MedicinePerformanceReportData | null;
  profit: ProfitReportData | null;
  companyAccounts: CompanyAccountsReportData | null;
  customerDebt: CustomerDebtReportData | null;
  cashFlow: CashFlowReportData | null;
  expenseReport: ExpenseReportData | null;
};

const copy = {
  fa: {
    title: 'مرکز گزارشات',
    subtitle: 'فروش، سود، موجودی، جریان نقدی و بدهی ها را از یک صفحه دنبال کنید.',
    startDate: 'از تاریخ',
    endDate: 'تا تاریخ',
    apply: 'اعمال',
    refresh: 'بازخوانی',
    print: 'چاپ گزارش',
    tabs: {
      daily: 'روزانه',
      weekly: 'هفته وار',
      monthly: 'ماهانه',
      yearly: 'سالانه',
    },
    chartTitle: 'روند فروش و سود',
    chartSubtitle: 'مقایسه تغییرات فروش و سود بر اساس تب انتخاب شده.',
    loading: 'گزارشات در حال بارگذاری است...',
    failed: 'بارگذاری گزارشات موفق نشد.',
    invalidRange: 'تاریخ شروع نباید بعد از تاریخ پایان باشد.',
    period: 'بازه',
    dailyUsesEndDate: 'گزارش روزانه از تاریخ پایانی استفاده می کند.',
    topSelling: 'پرفروش ترین دواها',
    leastSelling: 'کم فروش ترین دواها',
    inventory: 'گزارش موجودی دواها',
    financeSnapshot: 'خلاصه مالی',
    companyAccounts: 'حساب شرکت ها',
    customerDebts: 'بدهی مشتریان',
    cashFlow: 'جریان نقدی',
    expenseSummary: 'خلاصه مصارف',
    company: 'شرکت',
    purchased: 'خرید',
    paid: 'پرداخت',
    balance: 'بیلانس',
    customer: 'مشتری',
    debt: 'بدهی',
    lastActivity: 'آخرین فعالیت',
    date: 'تاریخ',
    entries: 'رکورد',
    netCashFlow: 'خالص جریان نقدی',
    totalSales: 'فروش مجموعی',
    totalProfit: 'سود مجموعی',
    totalExpenses: 'مصارف مجموعی',
    netProfit: 'سود خالص',
    cashIn: 'ورود نقدی',
    cashOut: 'خروج نقدی',
    prescriptions: 'تعداد نسخه ها',
    profitMargin: 'حاشیه سود',
    outstandingCompanyBalance: 'باقیمانده شرکت ها',
    outstandingCustomerDebt: 'بدهی مشتریان',
    noData: 'داده ای برای این بخش وجود ندارد.',
    topMedicineSubtitle: 'بر اساس مقدار فروش خالص بعد از برگشتی ها.',
    leastMedicineSubtitle: 'اجناس کم گردش را برای تصمیم خرید سریع پیدا کنید.',
    dailySummary: 'خلاصه روز',
    quickRanges: {
      today: 'امروز',
      last7Days: '۷ روز اخیر',
      thisMonth: 'این ماه',
      thisYear: 'امسال',
    },
  },
  ps: {
    title: 'د راپورونو مرکز',
    subtitle: 'پلور، ګټه، ذخیره، نغدي جریان او پورونه له یوې پاڼې وڅارئ.',
    startDate: 'له نېټې',
    endDate: 'تر نېټې',
    apply: 'پلي کول',
    refresh: 'بیا بارول',
    print: 'راپور چاپ کړئ',
    tabs: {
      daily: 'ورځنی',
      weekly: 'اوونیز',
      monthly: 'میاشتنی',
      yearly: 'کلنی',
    },
    chartTitle: 'د پلور او ګټې بهیر',
    chartSubtitle: 'پلور او ګټه د ټاکل شوي ټب له مخې پرتله کوي.',
    loading: 'راپورونه بارېږي...',
    failed: 'راپورونه بار نه شول.',
    invalidRange: 'د پیل نېټه باید د پای له نېټې وروسته نه وي.',
    period: 'بازه',
    dailyUsesEndDate: 'ورځنی راپور د پای نېټه کاروي.',
    topSelling: 'تر ټولو ډېر پلورل شوي درمل',
    leastSelling: 'تر ټولو لږ پلورل شوي درمل',
    inventory: 'د درملو د ذخیرې راپور',
    financeSnapshot: 'مالي لنډیز',
    companyAccounts: 'د شرکتونو حسابونه',
    customerDebts: 'د پیرودونکو پورونه',
    cashFlow: 'نغدي جریان',
    expenseSummary: 'د لګښتونو لنډیز',
    company: 'شرکت',
    purchased: 'پېرود',
    paid: 'تادیه',
    balance: 'بیلانس',
    customer: 'پیرودونکی',
    debt: 'پور',
    lastActivity: 'وروستی فعالیت',
    date: 'نېټه',
    entries: 'ریکارډونه',
    netCashFlow: 'خالص نغدي جریان',
    totalSales: 'ټول پلور',
    totalProfit: 'ټوله ګټه',
    totalExpenses: 'ټول لګښتونه',
    netProfit: 'خالصه ګټه',
    cashIn: 'نغدي داخلې',
    cashOut: 'نغدي وتلې',
    prescriptions: 'د نسخو شمېر',
    profitMargin: 'د ګټې حاشیه',
    outstandingCompanyBalance: 'د شرکتونو پاتې بیلانس',
    outstandingCustomerDebt: 'د پیرودونکو پاتې پور',
    noData: 'د دې برخې لپاره معلومات نشته.',
    topMedicineSubtitle: 'د راستنو شویو توکو له ایستلو وروسته د خالص پلور پر بنسټ.',
    leastMedicineSubtitle: 'ورو خوځېدونکي توکي ژر وپیژنئ.',
    dailySummary: 'ورځنی لنډیز',
    quickRanges: {
      today: 'نن',
      last7Days: 'وروستي ۷ ورځې',
      thisMonth: 'دا میاشت',
      thisYear: 'سږکال',
    },
  },
  en: {
    title: 'Reports Hub',
    subtitle: 'Track sales, profit, inventory, cash flow, and debts from one dashboard.',
    startDate: 'Start Date',
    endDate: 'End Date',
    apply: 'Apply',
    refresh: 'Refresh',
    print: 'Print Report',
    tabs: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    },
    chartTitle: 'Sales and Profit Trend',
    chartSubtitle: 'Compare sales and profit for the selected report period.',
    loading: 'Loading reports...',
    failed: 'Failed to load reports.',
    invalidRange: 'Start date cannot be after end date.',
    period: 'Range',
    dailyUsesEndDate: 'Daily report uses the selected end date.',
    topSelling: 'Top Selling Medicines',
    leastSelling: 'Least Selling Medicines',
    inventory: 'Medicine Inventory Report',
    financeSnapshot: 'Financial Snapshot',
    companyAccounts: 'Company Accounts',
    customerDebts: 'Customer Debts',
    cashFlow: 'Cash Flow',
    expenseSummary: 'Expense Summary',
    company: 'Company',
    purchased: 'Purchased',
    paid: 'Paid',
    balance: 'Balance',
    customer: 'Customer',
    debt: 'Debt',
    lastActivity: 'Last Activity',
    date: 'Date',
    entries: 'Entries',
    netCashFlow: 'Net Cash Flow',
    totalSales: 'Total Sales',
    totalProfit: 'Total Profit',
    totalExpenses: 'Total Expenses',
    netProfit: 'Net Profit',
    cashIn: 'Cash In',
    cashOut: 'Cash Out',
    prescriptions: 'Prescriptions',
    profitMargin: 'Profit Margin',
    outstandingCompanyBalance: 'Outstanding Company Balance',
    outstandingCustomerDebt: 'Outstanding Customer Debt',
    noData: 'No data is available for this section.',
    topMedicineSubtitle: 'Based on net sold quantity after returns.',
    leastMedicineSubtitle: 'Find slow-moving stock quickly.',
    dailySummary: 'Daily Summary',
    quickRanges: {
      today: 'Today',
      last7Days: 'Last 7 Days',
      thisMonth: 'This Month',
      thisYear: 'This Year',
    },
  },
};

function getDefaultRange(): RangeState {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  };
}

function getPresetRange(preset: 'today' | 'last7Days' | 'thisMonth' | 'thisYear'): RangeState {
  const now = new Date();

  if (preset === 'today') {
    const today = toDateInputValue(now);
    return { startDate: today, endDate: today };
  }

  if (preset === 'last7Days') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(now),
    };
  }

  if (preset === 'thisMonth') {
    return {
      startDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toDateInputValue(now),
    };
  }

  return {
    startDate: toDateInputValue(new Date(now.getFullYear(), 0, 1)),
    endDate: toDateInputValue(now),
  };
}

function getWeekLabel(weekNumber: number, locale: 'fa' | 'ps' | 'en') {
  const number = formatNumber(weekNumber, locale);

  if (locale === 'fa') {
    return `هفته ${number}`;
  }

  if (locale === 'ps') {
    return `اونۍ ${number}`;
  }

  return `Week ${number}`;
}

function getBreakdownLabel(
  tab: Exclude<PeriodTab, 'daily'>,
  row: ReportBreakdownRow,
  index: number,
  locale: 'fa' | 'ps' | 'en'
) {
  if (tab === 'weekly') {
    return formatDate(row.start, locale);
  }

  if (tab === 'monthly') {
    return getWeekLabel(index + 1, locale);
  }

  return formatMonthLabel(row.start, locale);
}

function OverviewMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article className={`rounded-[24px] p-4 ring-1 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

function TableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const dir = getDirection(locale);
  const tr = copy[locale];

  const [activeTab, setActiveTab] = useState<PeriodTab>('daily');
  const [draftRange, setDraftRange] = useState<RangeState>(getDefaultRange);
  const [appliedRange, setAppliedRange] = useState<RangeState>(getDefaultRange);
  const [reports, setReports] = useState<ReportsState>({
    daily: null,
    weekly: null,
    monthly: null,
    yearly: null,
    inventory: null,
    topSelling: null,
    leastSelling: null,
    profit: null,
    companyAccounts: null,
    customerDebt: null,
    cashFlow: null,
    expenseReport: null,
  });
  const [isLoadingTimeReports, setIsLoadingTimeReports] = useState(true);
  const [isLoadingStaticReports, setIsLoadingStaticReports] = useState(true);
  const [error, setError] = useState('');

  const fetchTimeReports = useCallback(async (range: RangeState) => {
    setIsLoadingTimeReports(true);
    setError('');

    try {
      const [yearPart, monthPart] = range.endDate.split('-').map(Number);
      const now = new Date();
      const year =
        Number.isInteger(yearPart) && yearPart > 0 ? yearPart : now.getFullYear();
      const month =
        Number.isInteger(monthPart) && monthPart >= 1 && monthPart <= 12
          ? monthPart
          : now.getMonth() + 1;

      const [dailyResponse, weeklyResponse, monthlyResponse, yearlyResponse, profitResponse, cashFlowResponse, expenseResponse] =
        await Promise.all([
          api.get<DailyReportData>(`/reports/daily?date=${range.endDate}`),
          api.get<WeeklyReportData>(
            `/reports/weekly?start=${range.startDate}&end=${range.endDate}`
          ),
          api.get<MonthlyReportData>(`/reports/monthly?month=${month}&year=${year}`),
          api.get<YearlyReportData>(`/reports/yearly?year=${year}`),
          api.get<ProfitReportData>(
            `/reports/profit?start=${range.startDate}&end=${range.endDate}`
          ),
          api.get<CashFlowReportData>(
            `/reports/cash-flow?start=${range.startDate}&end=${range.endDate}`
          ),
          api.get<ExpenseReportData>(
            `/reports/expenses?start=${range.startDate}&end=${range.endDate}`
          ),
        ]);

      if (!dailyResponse.success && !weeklyResponse.success && !monthlyResponse.success && !yearlyResponse.success) {
        setError(dailyResponse.message || weeklyResponse.message || monthlyResponse.message || yearlyResponse.message || tr.failed);
      }

      setReports((current) => ({
        ...current,
        daily: dailyResponse.success ? dailyResponse.data ?? null : null,
        weekly: weeklyResponse.success ? weeklyResponse.data ?? null : null,
        monthly: monthlyResponse.success ? monthlyResponse.data ?? null : null,
        yearly: yearlyResponse.success ? yearlyResponse.data ?? null : null,
        profit: profitResponse.success ? profitResponse.data ?? null : null,
        cashFlow: cashFlowResponse.success ? cashFlowResponse.data ?? null : null,
        expenseReport: expenseResponse.success ? expenseResponse.data ?? null : null,
      }));
    } catch {
      setError(tr.failed);
      setReports((current) => ({
        ...current,
        daily: null,
        weekly: null,
        monthly: null,
        yearly: null,
        profit: null,
        cashFlow: null,
        expenseReport: null,
      }));
    } finally {
      setIsLoadingTimeReports(false);
    }
  }, [tr.failed]);

  const fetchStaticReports = useCallback(async () => {
    setIsLoadingStaticReports(true);

    try {
      const [
        inventoryResponse,
        topSellingResponse,
        leastSellingResponse,
        companyAccountsResponse,
        customerDebtResponse,
      ] = await Promise.all([
        api.get<InventoryReportData>('/reports/medicines/inventory'),
        api.get<MedicinePerformanceReportData>('/reports/medicines/top-selling?limit=10'),
        api.get<MedicinePerformanceReportData>('/reports/medicines/least-selling?limit=10'),
        api.get<CompanyAccountsReportData>('/reports/companies/accounts'),
        api.get<CustomerDebtReportData>('/reports/customers/debts'),
      ]);

      setReports((current) => ({
        ...current,
        inventory: inventoryResponse.success ? inventoryResponse.data ?? null : null,
        topSelling: topSellingResponse.success ? topSellingResponse.data ?? null : null,
        leastSelling: leastSellingResponse.success ? leastSellingResponse.data ?? null : null,
        companyAccounts: companyAccountsResponse.success ? companyAccountsResponse.data ?? null : null,
        customerDebt: customerDebtResponse.success ? customerDebtResponse.data ?? null : null,
      }));
    } catch {
      setReports((current) => ({
        ...current,
        inventory: null,
        topSelling: null,
        leastSelling: null,
        companyAccounts: null,
        customerDebt: null,
      }));
    } finally {
      setIsLoadingStaticReports(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTimeReports(appliedRange);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appliedRange, fetchTimeReports]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchStaticReports();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchStaticReports]);

  const activeReport =
    activeTab === 'daily'
      ? reports.daily
      : activeTab === 'weekly'
        ? reports.weekly
        : activeTab === 'monthly'
          ? reports.monthly
          : reports.yearly;

  const activeChartData: ChartPoint[] =
    activeTab === 'daily'
      ? reports.daily
        ? [createChartPoint(tr.dailySummary, reports.daily.totalSales, reports.daily.totalProfit, reports.daily.totalExpenses)]
        : []
      : activeTab === 'weekly'
        ? (reports.weekly?.dailyBreakdown ?? []).map((row, index) =>
            createChartPoint(
              getBreakdownLabel('weekly', row, index, locale),
              row.totalSales,
              row.totalProfit,
              row.totalExpenses
            )
          )
        : activeTab === 'monthly'
          ? (reports.monthly?.weeklyBreakdown ?? []).map((row, index) =>
              createChartPoint(
                getBreakdownLabel('monthly', row, index, locale),
                row.totalSales,
                row.totalProfit,
                row.totalExpenses
              )
            )
          : (reports.yearly?.monthlyBreakdown ?? []).map((row, index) =>
              createChartPoint(
                getBreakdownLabel('yearly', row, index, locale),
                row.totalSales,
                row.totalProfit,
                row.totalExpenses
              )
            );

  const handleApply = () => {
    if (draftRange.startDate > draftRange.endDate) {
      setError(tr.invalidRange);
      return;
    }

    setAppliedRange(draftRange);
  };

  const handleRefresh = async () => {
    await Promise.all([fetchTimeReports(appliedRange), fetchStaticReports()]);
  };

  const rangeLabel = activeReport
    ? `${formatDate(activeReport.range.start, locale)} - ${formatDate(activeReport.range.end, locale)}`
    : `${formatDate(draftRange.startDate, locale)} - ${formatDate(draftRange.endDate, locale)}`;

  const isLoading = isLoadingTimeReports || isLoadingStaticReports;

  return (
    <div
      dir={dir}
      className="reports-print-shell space-y-6"
      style={{
        backgroundImage:
          'radial-gradient(circle at top left, rgba(20, 184, 166, 0.14), transparent 36%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef8f6 100%)',
      }}
    >
      <section className="print-hidden rounded-[34px] border border-white/70 bg-slate-950 px-6 py-6 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.8)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">
              {tr.title}
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">{tr.title}</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">{tr.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDraftRange(getPresetRange('today'))}
              className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/15"
            >
              {tr.quickRanges.today}
            </button>
            <button
              type="button"
              onClick={() => setDraftRange(getPresetRange('last7Days'))}
              className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/15"
            >
              {tr.quickRanges.last7Days}
            </button>
            <button
              type="button"
              onClick={() => setDraftRange(getPresetRange('thisMonth'))}
              className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/15"
            >
              {tr.quickRanges.thisMonth}
            </button>
            <button
              type="button"
              onClick={() => setDraftRange(getPresetRange('thisYear'))}
              className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/15"
            >
              {tr.quickRanges.thisYear}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {tr.startDate}
              </span>
              <input
                type="date"
                value={draftRange.startDate}
                onChange={(event) =>
                  setDraftRange((current) => ({ ...current, startDate: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-teal-300"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {tr.endDate}
              </span>
              <input
                type="date"
                value={draftRange.endDate}
                onChange={(event) =>
                  setDraftRange((current) => ({ ...current, endDate: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-teal-300"
              />
            </label>

            <div className="md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {tr.period}
              </span>
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-200">
                {rangeLabel}
                {activeTab === 'daily' ? (
                  <p className="mt-1 text-xs text-slate-400">{tr.dailyUsesEndDate}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:justify-end">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-300"
            >
              {tr.apply}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              {tr.refresh}
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 print-hidden">
        <div className="inline-flex rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
          {(['daily', 'weekly', 'monthly', 'yearly'] as PeriodTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tr.tabs[tab]}
            </button>
          ))}
        </div>

        <PrintButton label={tr.print} />
      </div>

      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading && !activeReport ? (
        <div className="rounded-[30px] border border-white/70 bg-white/90 px-6 py-12 text-center text-sm text-slate-500 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)]">
          {tr.loading}
        </div>
      ) : (
        <div className="report-print-stack space-y-6">
          <SalesSummaryCard
            locale={locale}
            totalSales={activeReport?.totalSales ?? 0}
            totalProfit={activeReport?.totalProfit ?? 0}
            totalExpenses={activeReport?.totalExpenses ?? 0}
            netProfit={activeReport?.netProfit ?? 0}
            labels={{
              totalSales: tr.totalSales,
              totalProfit: tr.totalProfit,
              totalExpenses: tr.totalExpenses,
              netProfit: tr.netProfit,
            }}
          />

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <SalesChart
              locale={locale}
              dir={dir}
              data={activeChartData}
              title={tr.chartTitle}
              subtitle={tr.chartSubtitle}
              labels={{
                sales: tr.totalSales,
                profit: tr.totalProfit,
              }}
              emptyMessage={tr.noData}
            />

            <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
              <h3 className="text-xl font-bold text-slate-900">{tr.financeSnapshot}</h3>
              <div className="mt-5 grid gap-4">
                <OverviewMetric
                  label={tr.cashIn}
                  value={formatMoney(activeReport?.cashIn ?? 0, locale)}
                  tone="bg-sky-50 text-sky-800 ring-sky-100"
                />
                <OverviewMetric
                  label={tr.cashOut}
                  value={formatMoney(activeReport?.cashOut ?? 0, locale)}
                  tone="bg-rose-50 text-rose-800 ring-rose-100"
                />
                <OverviewMetric
                  label={tr.prescriptions}
                  value={formatNumber(activeReport?.prescriptionsCount ?? 0, locale)}
                  tone="bg-amber-50 text-amber-800 ring-amber-100"
                />
                <OverviewMetric
                  label={tr.profitMargin}
                  value={formatPercent(reports.profit?.profitMarginPercentage ?? 0, locale)}
                  tone="bg-emerald-50 text-emerald-800 ring-emerald-100"
                />
                <OverviewMetric
                  label={tr.outstandingCompanyBalance}
                  value={formatMoney(reports.companyAccounts?.outstandingBalance ?? 0, locale)}
                  tone="bg-indigo-50 text-indigo-800 ring-indigo-100"
                />
                <OverviewMetric
                  label={tr.outstandingCustomerDebt}
                  value={formatMoney(reports.customerDebt?.totalOutstandingDebt ?? 0, locale)}
                  tone="bg-orange-50 text-orange-800 ring-orange-100"
                />
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TopMedicinesTable
              locale={locale}
              title={tr.topSelling}
              subtitle={tr.topMedicineSubtitle}
              medicines={reports.topSelling?.medicines ?? []}
              emptyMessage={tr.noData}
            />
            <TopMedicinesTable
              locale={locale}
              title={tr.leastSelling}
              subtitle={tr.leastMedicineSubtitle}
              medicines={reports.leastSelling?.medicines ?? []}
              emptyMessage={tr.noData}
            />
          </div>

          <InventoryReport
            locale={locale}
            inventory={reports.inventory}
            title={tr.inventory}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <TableSection title={tr.companyAccounts}>
              {!reports.companyAccounts || reports.companyAccounts.companies.length === 0 ? (
                <p className="text-sm text-slate-500">{tr.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-3 py-3 text-start font-semibold">{tr.company}</th>
                        <th className="px-3 py-3 text-start font-semibold">{tr.purchased}</th>
                        <th className="px-3 py-3 text-start font-semibold">{tr.paid}</th>
                        <th className="px-3 py-3 text-start font-semibold">{tr.balance}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.companyAccounts.companies.slice(0, 8).map((company) => (
                        <tr key={company.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-3 py-3 font-medium text-slate-900">{company.name}</td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatMoney(company.totalPurchased, locale)}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatMoney(company.totalPaid, locale)}
                          </td>
                          <td className="px-3 py-3 font-semibold text-amber-700">
                            {formatMoney(company.balance, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableSection>

            <TableSection title={tr.customerDebts}>
              {!reports.customerDebt || reports.customerDebt.customers.length === 0 ? (
                <p className="text-sm text-slate-500">{tr.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-3 py-3 text-start font-semibold">{tr.customer}</th>
                        <th className="px-3 py-3 text-start font-semibold">{tr.debt}</th>
                        <th className="px-3 py-3 text-start font-semibold">{tr.prescriptions}</th>
                        <th className="px-3 py-3 text-start font-semibold">{tr.lastActivity}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.customerDebt.customers.slice(0, 8).map((customer) => (
                        <tr key={customer.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-3 py-3 font-medium text-slate-900">{customer.name}</td>
                          <td className="px-3 py-3 font-semibold text-orange-700">
                            {formatMoney(customer.totalDebt, locale)}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {formatNumber(customer.totalPrescriptions, locale)}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {customer.lastActivityDate
                              ? formatDate(customer.lastActivityDate, locale)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableSection>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <TableSection title={tr.cashFlow}>
              {!reports.cashFlow || reports.cashFlow.breakdown.length === 0 ? (
                <p className="text-sm text-slate-500">{tr.noData}</p>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <OverviewMetric
                      label={tr.cashIn}
                      value={formatMoney(reports.cashFlow.totalCashIn, locale)}
                      tone="bg-sky-50 text-sky-800 ring-sky-100"
                    />
                    <OverviewMetric
                      label={tr.cashOut}
                      value={formatMoney(reports.cashFlow.totalCashOut, locale)}
                      tone="bg-rose-50 text-rose-800 ring-rose-100"
                    />
                    <OverviewMetric
                      label={tr.netCashFlow}
                      value={formatMoney(reports.cashFlow.netCashFlow, locale)}
                      tone="bg-emerald-50 text-emerald-800 ring-emerald-100"
                    />
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-3 py-3 text-start font-semibold">{tr.date}</th>
                          <th className="px-3 py-3 text-start font-semibold">{tr.cashIn}</th>
                          <th className="px-3 py-3 text-start font-semibold">{tr.cashOut}</th>
                          <th className="px-3 py-3 text-start font-semibold">{tr.netCashFlow}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.cashFlow.breakdown.map((row) => (
                          <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {formatDate(row.start, locale)}
                            </td>
                            <td className="px-3 py-3 text-sky-700">
                              {formatMoney(row.cashIn, locale)}
                            </td>
                            <td className="px-3 py-3 text-rose-700">
                              {formatMoney(row.cashOut, locale)}
                            </td>
                            <td className="px-3 py-3 font-semibold text-emerald-700">
                              {formatMoney(row.cashIn - row.cashOut, locale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </TableSection>

            <TableSection title={tr.expenseSummary}>
              {!reports.expenseReport ? (
                <p className="text-sm text-slate-500">{tr.noData}</p>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <OverviewMetric
                      label={tr.totalExpenses}
                      value={formatMoney(reports.expenseReport.totalExpenses, locale)}
                      tone="bg-rose-50 text-rose-800 ring-rose-100"
                    />
                    <OverviewMetric
                      label={tr.entries}
                      value={formatNumber(reports.expenseReport.count, locale)}
                      tone="bg-slate-100 text-slate-800 ring-slate-200"
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    {reports.expenseReport.byCategory.length === 0 ? (
                      <p className="text-sm text-slate-500">{tr.noData}</p>
                    ) : (
                      reports.expenseReport.byCategory.map((row) => (
                        <div
                          key={row.category}
                          className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {getExpenseCategoryLabel(row.category, locale)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatNumber(row.count, locale)} {tr.entries}
                            </p>
                          </div>
                          <p className="font-semibold text-rose-700">
                            {formatMoney(row.totalAmount, locale)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </TableSection>
          </div>
        </div>
      )}
    </div>
  );
}
