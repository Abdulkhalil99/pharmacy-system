'use client';

import {
  InventoryMedicineRow,
  InventoryReportData,
  Locale,
  formatDate,
  formatMoney,
} from '../reports.shared';

interface InventoryReportProps {
  locale: Locale;
  inventory: InventoryReportData | null;
  title?: string;
  subtitle?: string;
}

function InventoryTable({
  locale,
  title,
  rows,
  emptyMessage,
}: {
  locale: Locale;
  title: string;
  rows: InventoryMedicineRow[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white/80">
      <div className="border-b border-slate-100 px-4 py-4">
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-8 text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        <div className="report-print-table overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">Medicine</th>
                <th className="px-4 py-3 text-start font-semibold">Company</th>
                <th className="px-4 py-3 text-start font-semibold">Stock</th>
                <th className="px-4 py-3 text-start font-semibold">Min Stock</th>
                <th className="px-4 py-3 text-start font-semibold">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((medicine) => (
                <tr key={medicine.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{medicine.name}</td>
                  <td className="px-4 py-3 text-slate-600">{medicine.company}</td>
                  <td className="px-4 py-3 text-slate-700">{medicine.quantity}</td>
                  <td className="px-4 py-3 text-slate-700">{medicine.minQuantity}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <p>{formatDate(medicine.expiryDate, locale)}</p>
                    <p className="text-xs text-slate-500">{medicine.daysUntilExpiry} days</p>
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

export function InventoryReport({
  locale,
  inventory,
  title = 'Medicine Inventory Report',
  subtitle = 'Track stock health, expiry risk, and inventory value in one place.',
}: InventoryReportProps) {
  if (!inventory) {
    return (
      <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">Inventory report data is not available yet.</p>
      </section>
    );
  }

  const summaryCards = [
    {
      label: 'Total Medicines',
      value: String(inventory.totalMedicines),
      tone: 'bg-sky-50 text-sky-800 ring-sky-100',
    },
    {
      label: 'Low Stock Count',
      value: String(inventory.lowStockCount),
      tone: 'bg-amber-50 text-amber-800 ring-amber-100',
    },
    {
      label: 'Expired Count',
      value: String(inventory.expiredCount),
      tone: 'bg-rose-50 text-rose-800 ring-rose-100',
    },
    {
      label: 'Stock Value',
      value: formatMoney(inventory.totalStockValueAtCost, locale),
      tone: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    },
  ];

  return (
    <section className="report-print-card rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className={`rounded-[24px] p-4 ring-1 ${card.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-2xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <InventoryTable
          locale={locale}
          title="Low Stock Medicines"
          rows={inventory.lowStock}
          emptyMessage="No medicines are below the minimum stock level."
        />
        <InventoryTable
          locale={locale}
          title="Expired Medicines"
          rows={inventory.expired}
          emptyMessage="No expired medicines found."
        />
        <InventoryTable
          locale={locale}
          title={`Expiring Within ${inventory.expiringSoonWindowDays} Days`}
          rows={inventory.expiringSoon}
          emptyMessage="No medicines are expiring soon."
        />
      </div>
    </section>
  );
}
