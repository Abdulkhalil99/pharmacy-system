'use client';

import { MedicineStatus, MedicineSummary } from '@/hooks/useMedicines';

interface Props {
  summary: MedicineSummary | null;
  activeStatus: MedicineStatus;
  onFilterChange: (status: MedicineStatus) => void;
  locale?: 'fa' | 'ps' | 'en';
}

const translations = {
  fa: {
    lowStock: 'کمبود موجودی',
    expiringSoon: 'در حال انقضا',
    expired: 'منقضی شده',
    items: 'قلم',
  },
  ps: {
    lowStock: 'لږ ذخیره',
    expiringSoon: 'پای ته رسیدونکي',
    expired: 'پای شوي',
    items: 'توکي',
  },
  en: {
    lowStock: 'Low Stock',
    expiringSoon: 'Expiring Soon',
    expired: 'Expired',
    items: 'items',
  },
};

export function LowStockAlert({
  summary,
  activeStatus,
  onFilterChange,
  locale = 'fa',
}: Props) {
  if (!summary) {
    return null;
  }

  const tr = translations[locale];

  const alerts = [
    {
      key: 'low_stock' as MedicineStatus,
      label: tr.lowStock,
      count: summary.lowStock,
      bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
      text: 'text-amber-800',
      badge: 'bg-amber-200 text-amber-900',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      ),
    },
    {
      key: 'expiring_soon' as MedicineStatus,
      label: tr.expiringSoon,
      count: summary.expiringSoon,
      bg: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      text: 'text-orange-800',
      badge: 'bg-orange-200 text-orange-900',
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      key: 'expired' as MedicineStatus,
      label: tr.expired,
      count: summary.expired,
      bg: 'bg-red-50 border-red-200 hover:bg-red-100',
      text: 'text-red-800',
      badge: 'bg-red-200 text-red-900',
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
  ].filter((alert) => alert.count > 0);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {alerts.map((alert) => (
        <button
          key={alert.key}
          onClick={() => onFilterChange(activeStatus === alert.key ? 'all' : alert.key)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all ${alert.bg} ${
            activeStatus === alert.key ? 'ring-2 ring-current ring-offset-1' : ''
          }`}
        >
          {alert.icon}
          <span className={`text-sm font-medium ${alert.text}`}>{alert.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${alert.badge}`}>
            {alert.count} {tr.items}
          </span>
        </button>
      ))}
    </div>
  );
}
