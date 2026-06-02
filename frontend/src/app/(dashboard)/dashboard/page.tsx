'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useMedicines } from '@/hooks/useMedicines';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    title: 'داشبورد',
    subtitle: 'نمای دقیق از وضعیت موجودی، انقضا و توزیع شرکت ها',
    welcome: 'خوش آمدید',
    totalMedicines: 'کل دواها',
    lowStock: 'کمبود موجودی',
    expiringSoon: 'در حال انقضا',
    expired: 'منقضی شده',
    normalStock: 'وضعیت عادی',
    healthDistribution: 'ترکیب وضعیت موجودی',
    healthDescription: 'هر دوا فقط در وضعیت اصلی خودش شمرده می شود.',
    expiryTimeline: 'بازه های انقضا',
    expiryDescription: 'شمار دواها بر اساس فاصله تا تاریخ انقضا',
    companyDistribution: 'موجودی بر اساس شرکت',
    companyDescription: 'شرکت هایی که بیشترین موجودی فعلی را دارند',
    next30Days: 'تا ۳۰ روز',
    next90Days: 'تا ۹۰ روز',
    after90Days: 'بیشتر از ۹۰ روز',
    quantity: 'موجودی',
    medicines: 'نوع دوا',
    units: 'واحد',
    loading: 'در حال بارگذاری اطلاعات...',
    failed: 'بارگذاری اطلاعات داشبورد موفق نشد.',
    noChartData: 'هنوز داده کافی برای نمایش نمودارها وجود ندارد.',
    share: 'سهم',
  },
  ps: {
    title: 'ډشبورډ',
    subtitle: 'د ذخیرې، پای نیټې او شرکتونو دقیق انځور',
    welcome: 'ښه راغلاست',
    totalMedicines: 'ټول درمل',
    lowStock: 'لږ ذخیره',
    expiringSoon: 'پای ته رسیدونکي',
    expired: 'پای شوي',
    normalStock: 'عادي حالت',
    healthDistribution: 'د ذخیرې د حالت ترکیب',
    healthDescription: 'هر درمل یوازې په خپل اصلي حالت کې شمېرل کېږي.',
    expiryTimeline: 'د پای نېټې وختونه',
    expiryDescription: 'درمل د پای نېټې د نږدېوالي له مخې شمېرل شوي',
    companyDistribution: 'ذخیره د شرکت له مخې',
    companyDescription: 'هغه شرکتونه چې تر ټولو زیاته موجودي لري',
    next30Days: 'تر ۳۰ ورځو',
    next90Days: 'تر ۹۰ ورځو',
    after90Days: 'له ۹۰ ورځو وروسته',
    quantity: 'ذخیره',
    medicines: 'د درملو ډول',
    units: 'واحد',
    loading: 'معلومات بارېږي...',
    failed: 'د ډشبورډ معلومات بار نه شول.',
    noChartData: 'لا تر اوسه د ګرافونو لپاره کافي معلومات نشته.',
    share: 'ونډه',
  },
  en: {
    title: 'Dashboard',
    subtitle: 'Accurate view of stock health, expiry windows, and company distribution',
    welcome: 'Welcome back',
    totalMedicines: 'Total Medicines',
    lowStock: 'Low Stock',
    expiringSoon: 'Expiring Soon',
    expired: 'Expired',
    normalStock: 'Healthy Stock',
    healthDistribution: 'Inventory Health Mix',
    healthDescription: 'Each medicine is counted in one primary status.',
    expiryTimeline: 'Expiry Windows',
    expiryDescription: 'Medicine counts grouped by expiry timing',
    companyDistribution: 'Stock by Company',
    companyDescription: 'Companies holding the highest current stock',
    next30Days: 'Next 30 Days',
    next90Days: 'Next 90 Days',
    after90Days: 'Beyond 90 Days',
    quantity: 'Quantity',
    medicines: 'Medicine Types',
    units: 'units',
    loading: 'Loading dashboard data...',
    failed: 'Failed to load dashboard data.',
    noChartData: 'Not enough data yet to draw the charts.',
    share: 'share',
  },
};

const cardValueTone = {
  total: 'text-teal-600',
  lowStock: 'text-amber-600',
  expiringSoon: 'text-orange-600',
  expired: 'text-red-600',
};

const chartColors = {
  normal: '#0f766e',
  lowStock: '#f59e0b',
  expiringSoon: '#f97316',
  expired: '#ef4444',
  later: '#14b8a6',
  company: ['#0f766e', '#0891b2', '#f59e0b', '#6366f1', '#e11d48', '#16a34a'],
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

function formatNumber(value: number, locale: Locale) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function toPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function ChartTooltip({
  active,
  payload,
  locale,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { label?: string } }>;
  locale: Locale;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const label = item.payload?.label ?? item.name ?? '';
  const value = typeof item.value === 'number' ? item.value : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-slate-600">{formatNumber(value, locale)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const { summary, isLoading, error } = useMedicines();

  const statusBreakdown = summary?.statusBreakdown ?? {
    normal: 0,
    lowStock: 0,
    expiringSoon: 0,
    expired: 0,
  };

  const statusData = [
    {
      key: 'normal',
      label: tr.normalStock,
      value: statusBreakdown.normal,
      color: chartColors.normal,
      soft: 'bg-teal-50 text-teal-800',
    },
    {
      key: 'lowStock',
      label: tr.lowStock,
      value: statusBreakdown.lowStock,
      color: chartColors.lowStock,
      soft: 'bg-amber-50 text-amber-800',
    },
    {
      key: 'expiringSoon',
      label: tr.expiringSoon,
      value: statusBreakdown.expiringSoon,
      color: chartColors.expiringSoon,
      soft: 'bg-orange-50 text-orange-800',
    },
    {
      key: 'expired',
      label: tr.expired,
      value: statusBreakdown.expired,
      color: chartColors.expired,
      soft: 'bg-red-50 text-red-800',
    },
  ];

  const expiryData = (summary?.expiryBuckets ?? [
    { key: 'expired', count: 0 },
    { key: 'within30Days', count: 0 },
    { key: 'within90Days', count: 0 },
    { key: 'later', count: 0 },
  ]).map((bucket) => ({
    key: bucket.key,
    label:
      bucket.key === 'expired'
        ? tr.expired
        : bucket.key === 'within30Days'
          ? tr.next30Days
          : bucket.key === 'within90Days'
            ? tr.next90Days
            : tr.after90Days,
    value: bucket.count,
    color:
      bucket.key === 'expired'
        ? chartColors.expired
        : bucket.key === 'within30Days'
          ? chartColors.expiringSoon
          : bucket.key === 'within90Days'
            ? chartColors.lowStock
            : chartColors.later,
  }));

  const companyData = (summary?.companyBreakdown ?? [])
    .slice(0, 6)
    .map((company, index) => ({
      ...company,
      label: company.company,
      color: chartColors.company[index % chartColors.company.length],
    }));

  const totalStatusItems = statusData.reduce((sum, item) => sum + item.value, 0);
  const hasStatusData = totalStatusItems > 0;
  const hasExpiryData = expiryData.some((bucket) => bucket.value > 0);
  const hasCompanyData = companyData.length > 0;

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <p className="text-sm font-medium text-teal-700">
          {tr.welcome}
          {user?.name ? `, ${user.name}` : ''}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{tr.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-500">{tr.subtitle}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalMedicines}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.total}`}>
            {formatNumber(summary?.total ?? 0, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.lowStock}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.lowStock}`}>
            {formatNumber(summary?.lowStock ?? 0, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.expiringSoon}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.expiringSoon}`}>
            {formatNumber(summary?.expiringSoon ?? 0, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.expired}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.expired}`}>
            {formatNumber(summary?.expired ?? 0, locale)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-[28px] border border-teal-100 bg-linear-to-br from-white via-teal-50/40 to-cyan-50/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{tr.healthDistribution}</h2>
              <p className="mt-1 text-sm text-gray-500">{tr.healthDescription}</p>
            </div>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-teal-700 shadow-sm">
              {formatNumber(summary?.total ?? 0, locale)} {tr.medicines}
            </div>
          </div>

          {isLoading && !summary ? (
            <div className="py-16 text-sm text-gray-500">{tr.loading}</div>
          ) : !hasStatusData ? (
            <div className="py-16 text-sm text-gray-500">{tr.noChartData}</div>
          ) : (
            <div className="mt-8 grid gap-7 lg:grid-cols-[260px_1fr] lg:items-center">
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={104}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={4}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip locale={locale} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-900">
                      {formatNumber(totalStatusItems, locale)}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {tr.medicines}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {statusData.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500">
                          {toPercent(item.value, totalStatusItems)}% {tr.share}
                        </p>
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-semibold ${item.soft}`}>
                      {formatNumber(item.value, locale)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tr.expiryTimeline}</h2>
            <p className="mt-1 text-sm text-gray-500">{tr.expiryDescription}</p>
          </div>

          {isLoading && !summary ? (
            <div className="py-16 text-sm text-gray-500">{tr.loading}</div>
          ) : !hasExpiryData ? (
            <div className="py-16 text-sm text-gray-500">{tr.noChartData}</div>
          ) : (
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiryData} margin={{ top: 12, right: 8, left: -18, bottom: 8 }}>
                  <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip locale={locale} />} />
                  <Bar dataKey="value" radius={[12, 12, 4, 4]} maxBarSize={64}>
                    {expiryData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tr.companyDistribution}</h2>
            <p className="mt-1 text-sm text-gray-500">{tr.companyDescription}</p>
          </div>
          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {formatNumber(companyData.length, locale)}
          </div>
        </div>

        {isLoading && !summary ? (
          <div className="py-16 text-sm text-gray-500">{tr.loading}</div>
        ) : !hasCompanyData ? (
          <div className="py-16 text-sm text-gray-500">{tr.noChartData}</div>
        ) : (
          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_320px] xl:items-center">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip locale={locale} />} />
                  <Bar dataKey="quantity" radius={[0, 12, 12, 0]} maxBarSize={30}>
                    {companyData.map((entry) => (
                      <Cell key={entry.company} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-3">
              {companyData.map((company) => (
                <div key={company.company} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{company.company}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(company.medicines, locale)} {tr.medicines}
                      </p>
                    </div>
                    <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: company.color }} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {formatNumber(company.quantity, locale)} {tr.units}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
