'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  TransfersResponse,
  formatDateTime,
  formatMoney,
  getDirection,
  getLocale,
} from '../cash.shared';

const copy = {
  fa: {
    back: 'بازگشت به صندوق',
    title: 'تاریخچه انتقالات صندوق',
    subtitle: 'همه انتقالات خروجی را با فیلتر بازه زمانی و جمع کل بررسی کنید.',
    startDate: 'از تاریخ',
    endDate: 'تا تاریخ',
    apply: 'اعمال فیلتر',
    reset: 'پاک کردن',
    exportPdf: 'خروجی PDF',
    exportPlaceholder: 'به زودی',
    date: 'تاریخ',
    destination: 'مقصد',
    reason: 'دلیل',
    by: 'ثبت کننده',
    amount: 'مبلغ',
    totalTransferred: 'جمع انتقالات',
    transferCount: 'تعداد انتقالات',
    loading: 'در حال بارگذاری انتقالات...',
    failed: 'بارگذاری انتقالات موفق نشد.',
    empty: 'هیچ انتقالی در این بازه پیدا نشد.',
  },
  ps: {
    back: 'صندوق ته بېرته',
    title: 'د صندوق د لېږدونو تاریخچه',
    subtitle: 'ټول وتلي لېږدونه د نېټې فلټر او مجموع سره وګورئ.',
    startDate: 'له نېټې',
    endDate: 'تر نېټې',
    apply: 'فلټر پلي کړئ',
    reset: 'پاکول',
    exportPdf: 'PDF وباسئ',
    exportPlaceholder: 'ژر راځي',
    date: 'نېټه',
    destination: 'مقصد',
    reason: 'دلیل',
    by: 'ثبتوونکی',
    amount: 'مبلغ',
    totalTransferred: 'د لېږدونو مجموع',
    transferCount: 'د لېږدونو شمېر',
    loading: 'لېږدونه بارېږي...',
    failed: 'لېږدونه بار نه شول.',
    empty: 'په دې موده کې هېڅ لېږد ونه موندل شو.',
  },
  en: {
    back: 'Back to Cash',
    title: 'Cash Transfer History',
    subtitle: 'Review every outgoing transfer with date filters and running totals.',
    startDate: 'Start Date',
    endDate: 'End Date',
    apply: 'Apply Filter',
    reset: 'Reset',
    exportPdf: 'Export PDF',
    exportPlaceholder: 'Coming Soon',
    date: 'Date',
    destination: 'Destination',
    reason: 'Reason',
    by: 'Recorded By',
    amount: 'Amount',
    totalTransferred: 'Total Transferred',
    transferCount: 'Transfer Count',
    loading: 'Loading transfers...',
    failed: 'Failed to load transfers.',
    empty: 'No transfers were found for this range.',
  },
};

export default function CashTransfersPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const dir = getDirection(locale);
  const tr = copy[locale];

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<TransfersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransfers = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (filters?.startDate) {
        params.set('startDate', filters.startDate);
      }

      if (filters?.endDate) {
        params.set('endDate', filters.endDate);
      }

      const query = params.toString();
      const response = await api.get<TransfersResponse>(`/cash/transfers${query ? `?${query}` : ''}`);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
        setError(response.message || tr.failed);
      }
    } catch {
      setData(null);
      setError(tr.failed);
    } finally {
      setIsLoading(false);
    }
  }, [tr.failed]);

  useEffect(() => {
    void fetchTransfers();
  }, [fetchTransfers]);

  const handleApplyFilter = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchTransfers({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleReset = async () => {
    setStartDate('');
    setEndDate('');
    await fetchTransfers();
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col gap-3 rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/cash" className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800">
            {tr.back}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{tr.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{tr.subtitle}</p>
        </div>

        <button
          type="button"
          disabled
          className="rounded-2xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-500"
          title={tr.exportPlaceholder}
        >
          {tr.exportPdf} • {tr.exportPlaceholder}
        </button>
      </div>

      <form onSubmit={handleApplyFilter} className="grid gap-4 rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{tr.startDate}</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{tr.endDate}</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {tr.apply}
        </button>

        <button
          type="button"
          onClick={() => void handleReset()}
          className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {tr.reset}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-5 py-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            {tr.totalTransferred}
          </p>
          <p className="mt-4 text-3xl font-bold">
            {formatMoney(data?.summary.totalTransferred ?? 0, locale)}
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {tr.transferCount}
          </p>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {(data?.summary.count ?? 0).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
          </p>
        </div>
      </div>

      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-sm text-slate-600">{tr.loading}</div>
        ) : !data || data.transfers.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">{tr.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{tr.date}</th>
                  <th className="px-4 py-3 text-start font-medium">{tr.destination}</th>
                  <th className="px-4 py-3 text-start font-medium">{tr.reason}</th>
                  <th className="px-4 py-3 text-start font-medium">{tr.by}</th>
                  <th className="px-4 py-3 text-start font-medium">{tr.amount}</th>
                </tr>
              </thead>
              <tbody>
                {data.transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {formatDateTime(transfer.date, locale)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{transfer.toAccount}</td>
                    <td className="px-4 py-3 text-slate-600">{transfer.reason ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{transfer.user.name}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">
                      {formatMoney(transfer.amount, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
