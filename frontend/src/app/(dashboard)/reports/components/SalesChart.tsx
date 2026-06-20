'use client';

import {
  Area,
  Bar,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps, TooltipValueType } from 'recharts';
import { ChartPoint, Direction, Locale, formatMoney } from '../reports.shared';

interface SalesChartProps {
  locale: Locale;
  dir: Direction;
  data: ChartPoint[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  labels?: {
    sales?: string;
    profit?: string;
    expenses?: string;
  };
}

function getTooltipValue(value: TooltipValueType | undefined) {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

function SalesTooltip({
  active,
  payload,
  label,
  locale,
}: TooltipContentProps<TooltipValueType, string | number> & {
  locale: Locale;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-48 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm shadow-[0_22px_48px_-30px_rgba(15,23,42,0.58)] backdrop-blur">
      {label ? <p className="mb-3 font-bold text-slate-950">{label}</p> : null}
      <div className="space-y-2.5">
        {payload.map((entry) => (
          <div key={`${entry.dataKey ?? entry.name}`} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-slate-500">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? entry.fill ?? '#0f766e' }}
              />
              {entry.name}
            </span>
            <span className="font-bold text-slate-950">
              {formatMoney(getTooltipValue(entry.value), locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalesChart({
  locale,
  dir,
  data,
  title = 'Sales Trend',
  subtitle = 'Compare sales and profit over time.',
  emptyMessage = 'No chart data is available for this range yet.',
  labels,
}: SalesChartProps) {
  const salesLabel = labels?.sales ?? 'Sales';
  const profitLabel = labels?.profit ?? 'Profit';
  const expenseLabel = labels?.expenses ?? 'Expenses';
  const legendItems = [
    { label: salesLabel, color: '#0284c7' },
    { label: profitLabel, color: '#059669' },
    { label: expenseLabel, color: '#f43f5e' },
  ];

  return (
    <section className="report-print-card overflow-hidden rounded-[30px] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {legendItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="app-chart-empty rounded-[24px] px-6 py-12 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-[360px] w-full" dir={dir}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 18, right: 18, bottom: 6, left: 0 }}>
              <defs>
                <linearGradient id="salesAreaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseBarGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatMoney(value, locale)}
                width={96}
              />
              <Tooltip
                cursor={{ stroke: '#0f766e', strokeOpacity: 0.18, strokeWidth: 1 }}
                content={(props: TooltipContentProps<TooltipValueType, string | number>) => (
                  <SalesTooltip {...props} locale={locale} />
                )}
              />
              <Bar
                dataKey="expenses"
                name={expenseLabel}
                fill="url(#expenseBarGradient)"
                radius={[10, 10, 0, 0]}
                maxBarSize={28}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name={salesLabel}
                stroke="#0284c7"
                strokeWidth={3}
                fill="url(#salesAreaGradient)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff', fill: '#0284c7' }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name={profitLabel}
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 3.5, strokeWidth: 2, fill: '#ffffff' }}
                activeDot={{ r: 6, strokeWidth: 3, stroke: '#ffffff', fill: '#059669' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
