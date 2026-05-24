'use client';

import { Locale, formatMoney } from '../reports.shared';

interface SalesSummaryCardProps {
  locale: Locale;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  labels?: {
    totalSales?: string;
    totalProfit?: string;
    totalExpenses?: string;
    netProfit?: string;
  };
}

const toneMap = {
  sales: 'from-sky-500/15 to-sky-500/5 text-sky-800 ring-sky-200',
  profit: 'from-emerald-500/15 to-emerald-500/5 text-emerald-800 ring-emerald-200',
  expense: 'from-rose-500/15 to-rose-500/5 text-rose-800 ring-rose-200',
  netPositive: 'from-teal-500/15 to-teal-500/5 text-teal-800 ring-teal-200',
  netNegative: 'from-orange-500/15 to-orange-500/5 text-orange-800 ring-orange-200',
};

export function SalesSummaryCard({
  locale,
  totalSales,
  totalProfit,
  totalExpenses,
  netProfit,
  labels,
}: SalesSummaryCardProps) {
  const items = [
    {
      key: 'sales',
      label: labels?.totalSales ?? 'Total Sales',
      value: totalSales,
      tone: toneMap.sales,
    },
    {
      key: 'profit',
      label: labels?.totalProfit ?? 'Total Profit',
      value: totalProfit,
      tone: toneMap.profit,
    },
    {
      key: 'expenses',
      label: labels?.totalExpenses ?? 'Total Expenses',
      value: totalExpenses,
      tone: toneMap.expense,
    },
    {
      key: 'net',
      label: labels?.netProfit ?? 'Net Profit',
      value: netProfit,
      tone: netProfit >= 0 ? toneMap.netPositive : toneMap.netNegative,
    },
  ];

  return (
    <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.key}
            className={`rounded-[24px] bg-gradient-to-br p-4 ring-1 ${item.tone}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {formatMoney(item.value, locale)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
