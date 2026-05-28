'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMedicines } from '@/hooks/useMedicines';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    title: 'داشبورد',
    subtitle: 'نمای تصویری از وضعیت موجودی، انقضا و توزیع شرکت ها',
    welcome: 'خوش آمدید',
    totalMedicines: 'کل دواها',
    lowStock: 'کمبود موجودی',
    expiringSoon: 'در حال انقضا',
    expired: 'منقضی شده',
    normalStock: 'وضعیت عادی',
    healthDistribution: 'ترکیب وضعیت موجودی',
    healthDescription: 'این نمودار هر دوا را فقط در یک وضعیت اصلی نمایش می دهد.',
    expiryTimeline: 'نمودار بازه انقضا',
    expiryDescription: 'پخش دواها بر اساس فاصله تا تاریخ انقضا',
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
    subtitle: 'د ذخیرې، پای نیټې او شرکتونو وېش انځوریزه کتنه',
    welcome: 'ښه راغلاست',
    totalMedicines: 'ټول درمل',
    lowStock: 'لږ ذخیره',
    expiringSoon: 'پای ته رسیدونکي',
    expired: 'پای شوي',
    normalStock: 'عادي حالت',
    healthDistribution: 'د ذخیرې د حالت ترکیب',
    healthDescription: 'په دې ګراف کې هر درمل یوازې په یوه اصلي حالت کې شمیرل کیږي.',
    expiryTimeline: 'د پای نیټې ګراف',
    expiryDescription: 'درمل د پای نیټې واټن له مخې وېشل شوي',
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
    subtitle: 'Visual view of stock health, expiry windows, and company distribution',
    welcome: 'Welcome back',
    totalMedicines: 'Total Medicines',
    lowStock: 'Low Stock',
    expiringSoon: 'Expiring Soon',
    expired: 'Expired',
    normalStock: 'Healthy Stock',
    healthDistribution: 'Inventory Health Mix',
    healthDescription: 'Each medicine is counted in one primary status only.',
    expiryTimeline: 'Expiry Timeline',
    expiryDescription: 'How inventory spreads across expiry windows',
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

const segmentStyles = {
  normal: {
    color: '#0f766e',
    bg: 'bg-teal-500',
    soft: 'bg-teal-50 text-teal-800',
  },
  lowStock: {
    color: '#f59e0b',
    bg: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-800',
  },
  expiringSoon: {
    color: '#f97316',
    bg: 'bg-orange-500',
    soft: 'bg-orange-50 text-orange-800',
  },
  expired: {
    color: '#ef4444',
    bg: 'bg-red-500',
    soft: 'bg-red-50 text-red-800',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

function toPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function getDonutBackground(
  segments: Array<{ color: string; value: number }>,
  total: number
) {
  if (!total) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)';
  }

  let currentDegree = 0;
  const stops = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = currentDegree;
      currentDegree += (segment.value / total) * 360;
      return `${segment.color} ${start}deg ${currentDegree}deg`;
    })
    .join(', ');

  return `conic-gradient(${stops})`;
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

  const statusSegments = [
    {
      key: 'normal',
      label: tr.normalStock,
      value: statusBreakdown.normal,
      color: segmentStyles.normal.color,
      bg: segmentStyles.normal.bg,
      soft: segmentStyles.normal.soft,
    },
    {
      key: 'lowStock',
      label: tr.lowStock,
      value: statusBreakdown.lowStock,
      color: segmentStyles.lowStock.color,
      bg: segmentStyles.lowStock.bg,
      soft: segmentStyles.lowStock.soft,
    },
    {
      key: 'expiringSoon',
      label: tr.expiringSoon,
      value: statusBreakdown.expiringSoon,
      color: segmentStyles.expiringSoon.color,
      bg: segmentStyles.expiringSoon.bg,
      soft: segmentStyles.expiringSoon.soft,
    },
    {
      key: 'expired',
      label: tr.expired,
      value: statusBreakdown.expired,
      color: segmentStyles.expired.color,
      bg: segmentStyles.expired.bg,
      soft: segmentStyles.expired.soft,
    },
  ];

  const totalStatusItems = statusSegments.reduce((sum, segment) => sum + segment.value, 0);
  const donutBackground = getDonutBackground(statusSegments, totalStatusItems);

  const expiryData = (summary?.expiryBuckets ?? [
    { key: 'expired', count: 0 },
    { key: 'within30Days', count: 0 },
    { key: 'within90Days', count: 0 },
    { key: 'later', count: 0 },
  ]).map((bucket) => ({
    ...bucket,
    label:
      bucket.key === 'expired'
        ? tr.expired
        : bucket.key === 'within30Days'
          ? tr.next30Days
          : bucket.key === 'within90Days'
            ? tr.next90Days
            : tr.after90Days,
    color:
      bucket.key === 'expired'
        ? 'bg-red-500'
        : bucket.key === 'within30Days'
          ? 'bg-orange-500'
          : bucket.key === 'within90Days'
            ? 'bg-amber-500'
            : 'bg-teal-500',
    soft:
      bucket.key === 'expired'
        ? 'bg-red-50 text-red-700'
        : bucket.key === 'within30Days'
          ? 'bg-orange-50 text-orange-700'
          : bucket.key === 'within90Days'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-teal-50 text-teal-700',
  }));

  const maxExpiryCount = Math.max(1, ...expiryData.map((bucket) => bucket.count));
  const companyData = (summary?.companyBreakdown ?? []).slice(0, 6);
  const maxCompanyQuantity = Math.max(1, ...companyData.map((company) => company.quantity), 0);
  const hasChartData = totalStatusItems > 0;

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
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.total}`}>{summary?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.lowStock}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.lowStock}`}>{summary?.lowStock ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.expiringSoon}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.expiringSoon}`}>{summary?.expiringSoon ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.expired}</p>
          <p className={`mt-3 text-3xl font-bold ${cardValueTone.expired}`}>{summary?.expired ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[28px] border border-teal-100 bg-linear-to-br from-white via-teal-50/40 to-cyan-50/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{tr.healthDistribution}</h2>
              <p className="mt-1 text-sm text-gray-500">{tr.healthDescription}</p>
            </div>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-teal-700 shadow-sm">
              {summary?.total ?? 0} {tr.medicines}
            </div>
          </div>

          {isLoading && !summary ? (
            <div className="py-16 text-sm text-gray-500">{tr.loading}</div>
          ) : !hasChartData ? (
            <div className="py-16 text-sm text-gray-500">{tr.noChartData}</div>
          ) : (
            <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr] md:items-center">
              <div className="mx-auto flex flex-col items-center">
                <div
                  className="relative flex h-52 w-52 items-center justify-center rounded-full"
                  style={{ background: donutBackground }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-3xl font-bold text-gray-900">{totalStatusItems}</span>
                    <span className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                      {tr.medicines}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {statusSegments.map((segment) => (
                  <div
                    key={segment.key}
                    className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${segment.bg}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{segment.label}</p>
                        <p className="text-xs text-gray-500">
                          {toPercent(segment.value, totalStatusItems)}% {tr.share}
                        </p>
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-semibold ${segment.soft}`}>
                      {segment.value}
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
          ) : !hasChartData ? (
            <div className="py-16 text-sm text-gray-500">{tr.noChartData}</div>
          ) : (
            <div className="mt-8 grid grid-cols-4 items-end gap-4">
              {expiryData.map((bucket) => (
                <div key={bucket.key} className="flex flex-col items-center gap-3">
                  <div className="flex h-48 w-full items-end justify-center rounded-2xl bg-gray-50 px-2 py-3">
                    <div
                      className={`w-full max-w-14 rounded-t-2xl ${bucket.color}`}
                      style={{ height: `${Math.max((bucket.count / maxExpiryCount) * 100, bucket.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bucket.soft}`}>
                      {bucket.count}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-600">{bucket.label}</p>
                  </div>
                </div>
              ))}
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
            {companyData.length}
          </div>
        </div>

        {isLoading && !summary ? (
          <div className="py-16 text-sm text-gray-500">{tr.loading}</div>
        ) : companyData.length === 0 ? (
          <div className="py-16 text-sm text-gray-500">{tr.noChartData}</div>
        ) : (
          <div className="mt-8 space-y-5">
            {companyData.map((company, index) => (
              <div key={company.company} className="grid gap-2 md:grid-cols-[220px_1fr_auto] md:items-center">
                <div>
                  <p className="truncate font-medium text-gray-900">{company.company}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {company.medicines} {tr.medicines}
                  </p>
                </div>

                <div className="relative h-4 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`absolute inset-y-0 rounded-full ${
                      index % 3 === 0
                        ? 'bg-teal-500'
                        : index % 3 === 1
                          ? 'bg-cyan-500'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${(company.quantity / maxCompanyQuantity) * 100}%` }}
                  />
                </div>

                <div className="text-sm font-semibold text-gray-700">
                  {company.quantity.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')} {tr.units}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
/// --- IGNORE ---
/// The above code is for the main dashboard page, which includes various sections such as inventory health distribution, expiry timeline, and company distribution. It uses custom hooks to fetch data and renders different charts and summaries based on the data. The UI is responsive and adapts to different screen sizes, and it also supports multiple languages based on the user's preference.  








/// Note: The code assumes the existence of certain hooks and context providers for authentication and data fetching, as well as a specific design system for styling. The actual implementation may require adjustments based on the overall architecture of the application.