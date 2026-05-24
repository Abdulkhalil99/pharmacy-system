'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  };
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

  return (
    <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-[320px] w-full" dir={dir}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#dbe4ea" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(value: number) => formatMoney(value, locale)}
                width={96}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '18px',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 18px 40px -24px rgba(15, 23, 42, 0.3)',
                }}
                formatter={(value, name) => [
                  formatMoney(Number(value ?? 0), locale),
                  String(name),
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                name={salesLabel}
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name={profitLabel}
                stroke="#059669"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
