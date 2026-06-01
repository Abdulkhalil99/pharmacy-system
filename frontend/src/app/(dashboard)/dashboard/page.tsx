'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMedicines } from '@/hooks/useMedicines';
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
import type { TooltipContentProps, TooltipValueType } from 'recharts';

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

const metricStyles = {
  total: {
    text: 'text-teal-700',
    badge: 'bg-teal-50 text-teal-700 ring-teal-100',
    glow: 'from-teal-500/15 to-cyan-500/5',
  },
  lowStock: {
    text: 'text-amber-700',
    badge: 'bg-amber-50 text-amber-700 ring-amber-100',
    glow: 'from-amber-500/15 to-orange-500/5',
  },
  expiringSoon: {
    text: 'text-orange-700',
    badge: 'bg-orange-50 text-orange-700 ring-orange-100',
    glow: 'from-orange-500/15 to-rose-500/5',
  },
  expired: {
    text: 'text-rose-700',
    badge: 'bg-rose-50 text-rose-700 ring-rose-100',
    glow: 'from-rose-500/15 to-red-500/5',
  },
};

const segmentStyles = {
  normal: {
    color: '#0f766e',
    bg: 'bg-teal-500',
    soft: 'bg-teal-50 text-teal-800 ring-teal-100',
  },
  lowStock: {
    color: '#d97706',
    bg: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-800 ring-amber-100',
  },
  expiringSoon: {
    color: '#ea580c',
    bg: 'bg-orange-500',
    soft: 'bg-orange-50 text-orange-800 ring-orange-100',
  },
  expired: {
    color: '#e11d48',
    bg: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-800 ring-rose-100',
  },
};

const companyPalette = ['#0f766e', '#0284c7', '#7c3aed', '#d97706', '#059669', '#be123c'];

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

function formatCount(value: number, locale: Locale) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function getTooltipValue(value: TooltipValueType | undefined) {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

function DashboardTooltip({
  active,
  payload,
  label,
  locale,
  suffix,
}: TooltipContentProps<TooltipValueType, string> & {
  locale: Locale;
  suffix?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const title = label ?? payload[0]?.name ?? '';

  return (
    <div className="min-w-36 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm shadow-[0_20px_45px_-28px_rgba(15,23,42,0.55)] backdrop-blur">
      {title ? <p className="mb-2 font-semibold text-slate-900">{title}</p> : null}
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={`${entry.dataKey ?? entry.name}`} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-500">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color ?? entry.fill ?? '#0f766e' }}
              />
              {entry.name}
            </span>
            <span className="font-bold text-slate-900">
              {formatCount(getTooltipValue(entry.value), locale)}
              {suffix ? ` ${suffix}` : ''}
            </span>
          </div>
        ))}
      </div>
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
  const statusChartData = statusSegments.map((segment) => ({
    name: segment.label,
    value: segment.value,
    color: segment.color,
    percentage: toPercent(segment.value, totalStatusItems),
  }));
  const visibleStatusChartData = statusChartData.filter((segment) => segment.value > 0);

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
        ? '#e11d48'
        : bucket.key === 'within30Days'
          ? '#ea580c'
          : bucket.key === 'within90Days'
            ? '#d97706'
            : '#0f766e',
    soft:
      bucket.key === 'expired'
        ? 'bg-rose-50 text-rose-700 ring-rose-100'
        : bucket.key === 'within30Days'
          ? 'bg-orange-50 text-orange-700 ring-orange-100'
          : bucket.key === 'within90Days'
            ? 'bg-amber-50 text-amber-700 ring-amber-100'
            : 'bg-teal-50 text-teal-700 ring-teal-100',
    gradientId:
      bucket.key === 'expired'
        ? 'expiryExpiredGradient'
        : bucket.key === 'within30Days'
          ? 'expirySoonGradient'
          : bucket.key === 'within90Days'
            ? 'expiryWatchGradient'
            : 'expiryHealthyGradient',
  }));

  const companyData = (summary?.companyBreakdown ?? []).slice(0, 6);
  const companyChartData = companyData.map((company, index) => ({
    ...company,
    fill: companyPalette[index % companyPalette.length],
  }));
  const hasChartData = totalStatusItems > 0;
  const metricCards = [
    {
      key: 'total',
      label: tr.totalMedicines,
      value: summary?.total ?? 0,
      style: metricStyles.total,
    },
    {
      key: 'lowStock',
      label: tr.lowStock,
      value: summary?.lowStock ?? 0,
      style: metricStyles.lowStock,
    },
    {
      key: 'expiringSoon',
      label: tr.expiringSoon,
      value: summary?.expiringSoon ?? 0,
      style: metricStyles.expiringSoon,
    },
    {
      key: 'expired',
      label: tr.expired,
      value: summary?.expired ?? 0,
      style: metricStyles.expired,
    },
  ];

  return (
    <div className="app-page-shell space-y-6" dir={dir}>
      <div className="app-card-strong rounded-[28px] px-5 py-5 sm:px-6">
        <p className="text-sm font-semibold text-teal-700">
          {tr.welcome}
          {user?.name ? `, ${user.name}` : ''}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{tr.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{tr.subtitle}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {tr.failed}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article key={card.key} className={`app-stat-card rounded-2xl bg-gradient-to-br ${card.style.glow} p-5`}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${card.style.badge}`}>
                {formatCount(card.value, locale)}
              </span>
            </div>
            <p className={`mt-5 text-4xl font-bold ${card.style.text}`}>
              {formatCount(card.value, locale)}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="app-chart-card overflow-hidden rounded-[28px] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{tr.healthDistribution}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{tr.healthDescription}</p>
            </div>
            <div className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
              {formatCount(summary?.total ?? 0, locale)} {tr.medicines}
            </div>
          </div>

          {isLoading && !summary ? (
            <div className="py-16 text-sm text-slate-500">{tr.loading}</div>
          ) : !hasChartData ? (
            <div className="app-chart-empty mt-6 rounded-2xl px-6 py-12 text-center text-sm text-slate-500">
              {tr.noChartData}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr] md:items-center">
              <div className="relative mx-auto h-[270px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visibleStatusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={76}
                      outerRadius={112}
                      paddingAngle={2}
                      stroke="#ffffff"
                      strokeWidth={5}
                    >
                      {visibleStatusChartData.map((segment) => (
                        <Cell key={segment.name} fill={segment.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={(props) => (
                        <DashboardTooltip {...props} locale={locale} suffix={tr.medicines} />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-slate-100 bg-white/95 shadow-[inset_0_0_24px_rgba(15,23,42,0.06),0_16px_36px_-28px_rgba(15,23,42,0.8)]">
                    <span className="text-3xl font-bold text-slate-950">
                      {formatCount(totalStatusItems, locale)}
                    </span>
                    <span className="mt-1 text-xs font-semibold uppercase text-slate-400">
                      {tr.medicines}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {statusSegments.map((segment) => {
                  const percentage = toPercent(segment.value, totalStatusItems);

                  return (
                    <div
                      key={segment.key}
                      className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-[0_14px_35px_-32px_rgba(15,23,42,0.5)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${segment.bg}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{segment.label}</p>
                            <p className="text-xs text-slate-500">
                              {formatCount(percentage, locale)}% {tr.share}
                            </p>
                          </div>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${segment.soft}`}>
                          {formatCount(segment.value, locale)}
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: segment.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="app-chart-card rounded-[28px] p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{tr.expiryTimeline}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{tr.expiryDescription}</p>
          </div>

          {isLoading && !summary ? (
            <div className="py-16 text-sm text-slate-500">{tr.loading}</div>
          ) : !hasChartData ? (
            <div className="app-chart-empty mt-6 rounded-2xl px-6 py-12 text-center text-sm text-slate-500">
              {tr.noChartData}
            </div>
          ) : (
            <div className="-mx-2 mt-6 overflow-x-auto px-2">
              <div className="h-[300px] min-w-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expiryData} margin={{ top: 12, right: 10, bottom: 8, left: 0 }}>
                    <defs>
                      <linearGradient id="expiryExpiredGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#be123c" />
                      </linearGradient>
                      <linearGradient id="expirySoonGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#c2410c" />
                      </linearGradient>
                      <linearGradient id="expiryWatchGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                      <linearGradient id="expiryHealthyGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="#0f766e" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value: number) => formatCount(value, locale)}
                      width={42}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(20, 184, 166, 0.08)' }}
                      content={(props) => (
                        <DashboardTooltip {...props} locale={locale} suffix={tr.medicines} />
                      )}
                    />
                    <Bar dataKey="count" name={tr.medicines} radius={[12, 12, 4, 4]} maxBarSize={56}>
                      {expiryData.map((bucket) => (
                        <Cell key={bucket.key} fill={`url(#${bucket.gradientId})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="app-chart-card rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{tr.companyDistribution}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{tr.companyDescription}</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
            {formatCount(companyData.length, locale)}
          </div>
        </div>

        {isLoading && !summary ? (
          <div className="py-16 text-sm text-slate-500">{tr.loading}</div>
        ) : companyData.length === 0 ? (
          <div className="app-chart-empty mt-6 rounded-2xl px-6 py-12 text-center text-sm text-slate-500">
            {tr.noChartData}
          </div>
        ) : (
          <div className="-mx-2 mt-6 overflow-x-auto px-2">
            <div className="h-[330px] min-w-[680px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={companyChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 28, bottom: 8, left: 10 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value: number) => formatCount(value, locale)}
                  />
                  <YAxis
                    type="category"
                    dataKey="company"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value: string) =>
                      value.length > 20 ? `${value.slice(0, 20)}...` : value
                    }
                    width={160}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(15, 118, 110, 0.07)' }}
                    content={(props) => (
                      <DashboardTooltip {...props} locale={locale} suffix={tr.units} />
                    )}
                  />
                  <Bar
                    dataKey="quantity"
                    name={tr.quantity}
                    radius={[0, 12, 12, 0]}
                    barSize={20}
                    background={{ fill: '#f1f5f9', radius: 12 }}
                  >
                    {companyChartData.map((company) => (
                      <Cell key={company.company} fill={company.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {companyChartData.map((company, index) => (
                <div
                  key={company.company}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{company.company}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCount(company.medicines, locale)} {tr.medicines}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: companyPalette[index % companyPalette.length] }}
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {formatCount(company.quantity, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
