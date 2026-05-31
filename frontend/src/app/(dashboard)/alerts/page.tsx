'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MedicineAlert, useAlerts } from '@/hooks/useAlerts';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    title: 'هشدارها',
    subtitle: 'کمبود موجودی و دواهای نزدیک به انقضا را یکجا پیگیری کنید.',
    total: 'کل هشدارها',
    lowStock: 'کمبود موجودی',
    expiring: 'در حال انقضا',
    window: 'پنجره بررسی',
    days: 'روز',
    medicine: 'دوا',
    company: 'شرکت',
    quantity: 'موجودی',
    minimum: 'حداقل',
    expiry: 'انقضا',
    barcode: 'بارکد',
    manage: 'مدیریت ادویه',
    generated: 'آخرین بررسی',
    empty: 'هیچ هشدار فعالی وجود ندارد.',
    loading: 'در حال بارگذاری هشدارها...',
    failed: 'بارگذاری هشدارها موفق نشد.',
  },
  ps: {
    title: 'خبرتیاوې',
    subtitle: 'لږ ذخیره او ژر پای ته رسېدونکي درمل په یو ځای کې وګورئ.',
    total: 'ټولې خبرتیاوې',
    lowStock: 'لږ ذخیره',
    expiring: 'پای ته رسېدونکي',
    window: 'د کتنې موده',
    days: 'ورځې',
    medicine: 'درمل',
    company: 'شرکت',
    quantity: 'ذخیره',
    minimum: 'لږ تر لږه',
    expiry: 'پای نېټه',
    barcode: 'بارکوډ',
    manage: 'د درملو مدیریت',
    generated: 'وروستۍ کتنه',
    empty: 'اوس فعاله خبرتیا نشته.',
    loading: 'خبرتیاوې بارېږي...',
    failed: 'خبرتیاوې بار نه شوې.',
  },
  en: {
    title: 'Alerts',
    subtitle: 'Track low stock and medicines approaching expiry from one focused view.',
    total: 'Total Alerts',
    lowStock: 'Low Stock',
    expiring: 'Expiring Soon',
    window: 'Review Window',
    days: 'days',
    medicine: 'Medicine',
    company: 'Company',
    quantity: 'Quantity',
    minimum: 'Minimum',
    expiry: 'Expiry',
    barcode: 'Barcode',
    manage: 'Manage Medicines',
    generated: 'Last Checked',
    empty: 'There are no active alerts.',
    loading: 'Loading alerts...',
    failed: 'Failed to load alerts.',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function AlertTable({
  alerts,
  locale,
  title,
  tone,
}: {
  alerts: MedicineAlert[];
  locale: Locale;
  title: string;
  tone: 'amber' | 'orange';
}) {
  const tr = copy[locale];
  const toneClasses =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-orange-200 bg-orange-50 text-orange-800';

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClasses}`}>
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">{tr.empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[tr.medicine, tr.company, tr.quantity, tr.minimum, tr.expiry, tr.barcode].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 text-start font-semibold text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{alert.name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">{alert.company}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">{alert.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{alert.minQuantity}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(alert.expiryDate, locale)}</td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">{alert.barcode ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const tr = copy[locale];
  const { alerts, isLoading, error } = useAlerts();

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{tr.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{tr.subtitle}</p>
        </div>
        <Link
          href="/medicines"
          className="rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-700"
        >
          {tr.manage}
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {tr.failed}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{tr.total}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{alerts?.total ?? 0}</p>
        </div>
        <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">{tr.lowStock}</p>
          <p className="mt-3 text-3xl font-black text-amber-800">{alerts?.lowStockCount ?? 0}</p>
        </div>
        <div className="rounded-[28px] border border-orange-100 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm text-orange-700">{tr.expiring}</p>
          <p className="mt-3 text-3xl font-black text-orange-800">{alerts?.expiringCount ?? 0}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{tr.window}</p>
          <p className="mt-3 text-3xl font-black text-teal-700">
            {alerts?.windowDays ?? 30} <span className="text-base font-bold">{tr.days}</span>
          </p>
        </div>
      </div>

      {alerts?.generatedAt ? (
        <p className="text-xs font-medium text-slate-500">
          {tr.generated}: {new Date(alerts.generatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
        </p>
      ) : null}

      {isLoading && !alerts ? (
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
          {tr.loading}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <AlertTable alerts={alerts?.lowStock ?? []} locale={locale} title={tr.lowStock} tone="amber" />
          <AlertTable alerts={alerts?.expiring ?? []} locale={locale} title={tr.expiring} tone="orange" />
        </div>
      )}
    </div>
  );
}
