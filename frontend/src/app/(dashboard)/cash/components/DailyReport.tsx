'use client';

import { formatExpenseDescription } from '@/lib/expense-display';
import {
  DailyCashReport,
  Locale,
  formatDate,
  formatDateTime,
  formatMoney,
} from '../cash.shared';

interface DailyReportProps {
  locale: Locale;
  report: DailyCashReport | null;
}

const copy = {
  fa: {
    title: 'گزارش روزانه صندوق',
    subtitle: 'همه ورود و خروج های نقدی امروز در یک نمای قابل چاپ',
    print: 'چاپ گزارش',
    empty: 'برای این روز هنوز گزارشی موجود نیست.',
    date: 'تاریخ',
    openedAt: 'زمان باز شدن',
    closedAt: 'زمان بسته شدن',
    openingBalance: 'بیلانس افتتاحیه',
    sales: 'ورود از فروش',
    expenses: 'مصارف',
    transfers: 'انتقالات خروجی',
    expectedClosing: 'بیلانس محاسبه شده',
    recordedClosing: 'بیلانس ثبت شده',
    currentCash: 'نقد موجود',
    variance: 'تفاوت',
    netCash: 'خالص نقدینگی',
    salesList: 'فروش های نقدی',
    expensesList: 'لیست مصارف',
    transfersList: 'لیست انتقالات',
    noItems: 'موردی برای نمایش نیست.',
    customer: 'مشتری',
    amount: 'مبلغ',
    reason: 'دلیل',
    destination: 'مقصد',
    category: 'دسته بندی',
    by: 'ثبت کننده',
    walkIn: 'مشتری حضوری',
    registerOpen: 'صندوق باز است',
    registerClosed: 'صندوق بسته شده است',
  },
  ps: {
    title: 'د صندوق ورځنی راپور',
    subtitle: 'د نن ورځې ټولې نغدي داخلې او وتلې په یوه چاپ کېدونکې بڼه',
    print: 'راپور چاپ کړئ',
    empty: 'د دې ورځې لپاره لا راپور نشته.',
    date: 'نېټه',
    openedAt: 'د پرانیستلو وخت',
    closedAt: 'د تړلو وخت',
    openingBalance: 'پیلیز بیلانس',
    sales: 'د پلور داخلې',
    expenses: 'لګښتونه',
    transfers: 'بهر وتلي لېږدونه',
    expectedClosing: 'محاسبه شوی بیلانس',
    recordedClosing: 'ثبت شوی بیلانس',
    currentCash: 'اوسنۍ نغدي',
    variance: 'توپیر',
    netCash: 'خالص نغدي',
    salesList: 'نغدي پلورنې',
    expensesList: 'د لګښتونو لېست',
    transfersList: 'د لېږدونو لېست',
    noItems: 'د ښودلو لپاره کوم مورد نشته.',
    customer: 'پیرودونکی',
    amount: 'مبلغ',
    reason: 'دلیل',
    destination: 'مقصد',
    category: 'کټګوري',
    by: 'ثبتوونکی',
    walkIn: 'حضوري پیرودونکی',
    registerOpen: 'صندوق پرانیستی دی',
    registerClosed: 'صندوق تړل شوی دی',
  },
  en: {
    title: 'Daily Cash Report',
    subtitle: 'A printable view of all cash inflows and outflows for the day',
    print: 'Print Report',
    empty: 'No report is available for this day yet.',
    date: 'Date',
    openedAt: 'Opened At',
    closedAt: 'Closed At',
    openingBalance: 'Opening Balance',
    sales: 'Sales Inflow',
    expenses: 'Expenses',
    transfers: 'Transfers Out',
    expectedClosing: 'System Closing',
    recordedClosing: 'Recorded Closing',
    currentCash: 'Cash In Hand',
    variance: 'Variance',
    netCash: 'Net Cash',
    salesList: 'Cash Sales',
    expensesList: 'Expense Entries',
    transfersList: 'Transfer Entries',
    noItems: 'Nothing to show yet.',
    customer: 'Customer',
    amount: 'Amount',
    reason: 'Reason',
    destination: 'Destination',
    category: 'Category',
    by: 'Recorded By',
    walkIn: 'Walk-in',
    registerOpen: 'Register is open',
    registerClosed: 'Register is closed',
  },
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-sm text-slate-500">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 text-start font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-100">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 align-top text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function DailyReport({ locale, report }: DailyReportProps) {
  const tr = copy[locale];

  if (!report) {
    return <EmptyState message={tr.empty} />;
  }

  return (
    <section className="space-y-5">
      <div className="print-hidden flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{tr.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{tr.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          {tr.print}
        </button>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-sm print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{tr.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {tr.date}: {formatDate(report.date, locale)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                report.register.isClosed
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {report.register.isClosed ? tr.registerClosed : tr.registerOpen}
            </span>
            {report.register.openedAt && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {tr.openedAt}: {formatDateTime(report.register.openedAt, locale)}
              </span>
            )}
            {report.register.closedAt && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {tr.closedAt}: {formatDateTime(report.register.closedAt, locale)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: tr.openingBalance, value: report.summary.openingBalance, tone: 'text-slate-900' },
            { label: tr.sales, value: report.summary.totalSales, tone: 'text-emerald-700' },
            { label: tr.expenses, value: report.summary.totalExpenses, tone: 'text-amber-700' },
            { label: tr.transfers, value: report.summary.totalTransfersOut, tone: 'text-indigo-700' },
            { label: tr.expectedClosing, value: report.summary.expectedClosingBalance, tone: 'text-teal-700' },
            { label: tr.currentCash, value: report.summary.currentCashInHand, tone: 'text-slate-900' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className={`mt-3 text-2xl font-bold ${item.tone}`}>
                {formatMoney(item.value, locale)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {tr.recordedClosing}
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {report.summary.recordedClosingBalance === null
                ? '—'
                : formatMoney(report.summary.recordedClosingBalance, locale)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {tr.netCash}
            </p>
            <p className="mt-2 text-xl font-bold text-teal-700">
              {formatMoney(report.summary.netCashMovement, locale)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {tr.variance}
            </p>
            <p className="mt-2 text-xl font-bold text-rose-700">
              {report.summary.variance === null ? '—' : formatMoney(report.summary.variance, locale)}
            </p>
          </div>
        </div>
      </div>

      <ReportTable
        title={tr.salesList}
        empty={tr.noItems}
        headers={[tr.date, 'ID', tr.customer, tr.amount]}
        rows={report.inflows.sales.map((sale) => [
          formatDateTime(sale.date, locale),
          sale.prescriptionId,
          sale.customer?.name ?? tr.walkIn,
          formatMoney(sale.paidAmount, locale),
        ])}
      />

      <ReportTable
        title={tr.expensesList}
        empty={tr.noItems}
        headers={[tr.date, tr.category, tr.reason, tr.by, tr.amount]}
        rows={report.outflows.expenses.map((expense) => [
          formatDateTime(expense.date, locale),
          expense.category,
          formatExpenseDescription(expense.description, expense.category, locale) ?? '—',
          expense.user.name,
          formatMoney(expense.amount, locale),
        ])}
      />

      <ReportTable
        title={tr.transfersList}
        empty={tr.noItems}
        headers={[tr.date, tr.destination, tr.reason, tr.by, tr.amount]}
        rows={report.outflows.transfers.map((transfer) => [
          formatDateTime(transfer.date, locale),
          transfer.toAccount,
          transfer.reason ?? '—',
          transfer.user.name,
          formatMoney(transfer.amount, locale),
        ])}
      />
    </section>
  );
}
