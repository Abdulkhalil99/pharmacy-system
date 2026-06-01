'use client';

import {
  InventoryMedicineRow,
  InventoryReportData,
  Locale,
  formatDate,
  formatMoney,
  formatNumber,
} from '../reports.shared';

interface InventoryReportProps {
  locale: Locale;
  inventory: InventoryReportData | null;
  title?: string;
  subtitle?: string;
}

const copy = {
  fa: {
    title: 'گزارش موجودی دواها',
    subtitle: 'وضعیت موجودی، ریسک انقضا، و ارزش انبار را در یک صفحه دنبال کنید.',
    unavailable: 'داده گزارش موجودی هنوز در دسترس نیست.',
    totalMedicines: 'کل دواها',
    lowStockCount: 'تعداد کمبود',
    expiredCount: 'تعداد منقضی',
    stockValue: 'ارزش موجودی',
    medicine: 'دوا',
    company: 'شرکت',
    stock: 'موجودی',
    minStock: 'حداقل موجودی',
    expiry: 'انقضا',
    days: 'روز',
    lowStockMedicines: 'دواهای کمبود موجودی',
    noLowStock: 'هیچ دوایی پایین تر از حداقل موجودی نیست.',
    expiredMedicines: 'دواهای منقضی',
    noExpired: 'هیچ دوای منقضی یافت نشد.',
    expiringWithin: 'در حال انقضا تا {days} روز',
    noExpiringSoon: 'هیچ دوایی به زودی منقضی نمی شود.',
  },
  ps: {
    title: 'د درملو د ذخیرې راپور',
    subtitle: 'د ذخیرې حالت، د پای نېټې خطر، او د انبار ارزښت په یوه پاڼه کې وڅارئ.',
    unavailable: 'د ذخیرې راپور معلومات لا نه دي چمتو.',
    totalMedicines: 'ټول درمل',
    lowStockCount: 'د کمې ذخیرې شمېر',
    expiredCount: 'د پای شوو شمېر',
    stockValue: 'د ذخیرې ارزښت',
    medicine: 'درمل',
    company: 'شرکت',
    stock: 'ذخیره',
    minStock: 'لږ تر لږه ذخیره',
    expiry: 'پای',
    days: 'ورځې',
    lowStockMedicines: 'کمې ذخیرې لرونکي درمل',
    noLowStock: 'هیڅ درمل د لږ تر لږه ذخیرې نه دي ښکته.',
    expiredMedicines: 'پای شوي درمل',
    noExpired: 'هیڅ پای شوي درمل ونه موندل شول.',
    expiringWithin: 'تر {days} ورځو پورې پای ته رسېږي',
    noExpiringSoon: 'هیڅ درمل ژر نه پای ته رسېږي.',
  },
  en: {
    title: 'Medicine Inventory Report',
    subtitle: 'Track stock health, expiry risk, and inventory value in one place.',
    unavailable: 'Inventory report data is not available yet.',
    totalMedicines: 'Total Medicines',
    lowStockCount: 'Low Stock Count',
    expiredCount: 'Expired Count',
    stockValue: 'Stock Value',
    medicine: 'Medicine',
    company: 'Company',
    stock: 'Stock',
    minStock: 'Min Stock',
    expiry: 'Expiry',
    days: 'days',
    lowStockMedicines: 'Low Stock Medicines',
    noLowStock: 'No medicines are below the minimum stock level.',
    expiredMedicines: 'Expired Medicines',
    noExpired: 'No expired medicines found.',
    expiringWithin: 'Expiring Within {days} Days',
    noExpiringSoon: 'No medicines are expiring soon.',
  },
} satisfies Record<Locale, Record<string, string>>;

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
  const tr = copy[locale];

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_14px_34px_-32px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-100 px-4 py-4">
        <h4 className="text-lg font-bold text-slate-950">{title}</h4>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-8 text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        <div className="report-print-table overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{tr.medicine}</th>
                <th className="px-4 py-3 text-start font-semibold">{tr.company}</th>
                <th className="px-4 py-3 text-start font-semibold">{tr.stock}</th>
                <th className="px-4 py-3 text-start font-semibold">{tr.minStock}</th>
                <th className="px-4 py-3 text-start font-semibold">{tr.expiry}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((medicine) => (
                <tr key={medicine.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{medicine.name}</td>
                  <td className="px-4 py-3 text-slate-600">{medicine.company}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(medicine.quantity, locale)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(medicine.minQuantity, locale)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <p>{formatDate(medicine.expiryDate, locale)}</p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(medicine.daysUntilExpiry, locale)} {tr.days}
                    </p>
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
  title,
  subtitle,
}: InventoryReportProps) {
  const tr = copy[locale];
  const reportTitle = title ?? tr.title;
  const reportSubtitle = subtitle ?? tr.subtitle;

  if (!inventory) {
    return (
      <section className="report-print-card rounded-[30px] p-6">
        <h3 className="text-xl font-bold text-slate-950">{reportTitle}</h3>
        <p className="mt-2 text-sm text-slate-500">{tr.unavailable}</p>
      </section>
    );
  }

  const summaryCards = [
    {
      label: tr.totalMedicines,
      value: formatNumber(inventory.totalMedicines, locale),
      tone: 'bg-sky-50 text-sky-800 ring-sky-100',
    },
    {
      label: tr.lowStockCount,
      value: formatNumber(inventory.lowStockCount, locale),
      tone: 'bg-amber-50 text-amber-800 ring-amber-100',
    },
    {
      label: tr.expiredCount,
      value: formatNumber(inventory.expiredCount, locale),
      tone: 'bg-rose-50 text-rose-800 ring-rose-100',
    },
    {
      label: tr.stockValue,
      value: formatMoney(inventory.totalStockValueAtCost, locale),
      tone: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    },
  ];

  return (
    <section className="report-print-card rounded-[30px] p-5">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-950">{reportTitle}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{reportSubtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className={`rounded-[22px] p-4 shadow-[0_16px_38px_-34px_rgba(15,23,42,0.45)] ring-1 ${card.tone}`}>
            <p className="text-xs font-bold uppercase text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-2xl font-bold text-slate-950">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <InventoryTable
          locale={locale}
          title={tr.lowStockMedicines}
          rows={inventory.lowStock}
          emptyMessage={tr.noLowStock}
        />
        <InventoryTable
          locale={locale}
          title={tr.expiredMedicines}
          rows={inventory.expired}
          emptyMessage={tr.noExpired}
        />
        <InventoryTable
          locale={locale}
          title={tr.expiringWithin.replace(
            '{days}',
            formatNumber(inventory.expiringSoonWindowDays, locale)
          )}
          rows={inventory.expiringSoon}
          emptyMessage={tr.noExpiringSoon}
        />
      </div>
    </section>
  );
}
