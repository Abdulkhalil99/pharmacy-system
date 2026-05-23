'use client';

import { Locale, MedicinePerformanceRow, formatMoney } from '../reports.shared';

interface TopMedicinesTableProps {
  locale: Locale;
  title?: string;
  subtitle?: string;
  medicines: MedicinePerformanceRow[];
  emptyMessage?: string;
  labels?: {
    rank?: string;
    medicineName?: string;
    quantitySold?: string;
    revenue?: string;
    profit?: string;
  };
}

export function TopMedicinesTable({
  locale,
  title = 'Top Medicines',
  subtitle = 'Best-performing medicines by sold quantity.',
  medicines,
  emptyMessage = 'No medicine sales data is available yet.',
  labels,
}: TopMedicinesTableProps) {
  return (
    <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      {medicines.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="report-print-table overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.rank ?? 'Rank'}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.medicineName ?? 'Medicine Name'}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.quantitySold ?? 'Quantity Sold'}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.revenue ?? 'Revenue'}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.profit ?? 'Profit'}
                </th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.medicineId} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-3 font-semibold text-slate-700">{medicine.rank}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{medicine.medicineName}</p>
                    <p className="text-xs text-slate-500">{medicine.company}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{medicine.quantitySold}</td>
                  <td className="px-3 py-3 font-medium text-sky-700">
                    {formatMoney(medicine.revenue, locale)}
                  </td>
                  <td className="px-3 py-3 font-medium text-emerald-700">
                    {formatMoney(medicine.profit, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
