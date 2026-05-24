'use client';

import { Locale, MedicinePerformanceRow, formatMoney, formatNumber } from '../reports.shared';

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

const copy = {
  fa: {
    title: 'دواهای پرفروش',
    subtitle: 'دواهای بهتر بر اساس مقدار فروش.',
    empty: 'هنوز داده فروش دواها موجود نیست.',
    rank: 'رتبه',
    medicineName: 'نام دوا',
    quantitySold: 'مقدار فروش',
    revenue: 'عواید',
    profit: 'سود',
  },
  ps: {
    title: 'تر ټولو ډېر پلورل شوي درمل',
    subtitle: 'غوره درمل د پلورل شوي مقدار له مخې.',
    empty: 'لا د درملو د پلور معلومات نشته.',
    rank: 'رتبه',
    medicineName: 'د درمل نوم',
    quantitySold: 'پلورل شوی مقدار',
    revenue: 'عواید',
    profit: 'ګټه',
  },
  en: {
    title: 'Top Medicines',
    subtitle: 'Best-performing medicines by sold quantity.',
    empty: 'No medicine sales data is available yet.',
    rank: 'Rank',
    medicineName: 'Medicine Name',
    quantitySold: 'Quantity Sold',
    revenue: 'Revenue',
    profit: 'Profit',
  },
} as const;

export function TopMedicinesTable({
  locale,
  title,
  subtitle,
  medicines,
  emptyMessage,
  labels,
}: TopMedicinesTableProps) {
  const tr = copy[locale];
  const reportTitle = title ?? tr.title;
  const reportSubtitle = subtitle ?? tr.subtitle;
  const noDataMessage = emptyMessage ?? tr.empty;

  return (
    <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">{reportTitle}</h3>
        <p className="mt-1 text-sm text-slate-500">{reportSubtitle}</p>
      </div>

      {medicines.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          {noDataMessage}
        </div>
      ) : (
        <div className="report-print-table overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.rank ?? tr.rank}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.medicineName ?? tr.medicineName}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.quantitySold ?? tr.quantitySold}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.revenue ?? tr.revenue}
                </th>
                <th className="px-3 py-3 text-start font-semibold">
                  {labels?.profit ?? tr.profit}
                </th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.medicineId} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-3 font-semibold text-slate-700">
                    {formatNumber(medicine.rank, locale)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{medicine.medicineName}</p>
                    <p className="text-xs text-slate-500">{medicine.company}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {formatNumber(medicine.quantitySold, locale)}
                  </td>
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
