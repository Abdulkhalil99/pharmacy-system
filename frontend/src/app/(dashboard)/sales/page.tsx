'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ReceiptModal, SaleReceipt } from './components/ReceiptModal';

type Locale = 'fa' | 'ps' | 'en';

interface SaleHistoryRow {
  id: string;
  prescriptionId: string;
  date: string;
  status: 'PAID' | 'PARTIAL' | 'DEBT';
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  itemCount: number;
  returnedUnits: number;
  returnAmount: number;
  originalTotalAmount: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  profit: number;
}

interface SalesListResponse {
  sales: SaleHistoryRow[];
  summary: {
    salesCount: number;
    grossSales: number;
    totalSales: number;
    totalPaid: number;
    totalDebt: number;
    totalProfit: number;
    totalReturns: number;
  };
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

const copy = {
  fa: {
    title: 'فروش و نسخه ها',
    subtitle: 'تاریخچه کامل فروش ها، سود و اقلام برگشتی را از یک جا ببینید.',
    newPrescription: 'نسخه جدید',
    startDate: 'از تاریخ',
    endDate: 'تا تاریخ',
    apply: 'اعمال فیلتر',
    reset: 'پاک کردن',
    totalSales: 'فروش خالص',
    totalProfit: 'سود مجموعی',
    totalReturns: 'برگشتی مجموعی',
    history: 'تاریخچه فروش',
    date: 'تاریخ',
    prescription: 'نسخه',
    customer: 'مشتری',
    status: 'وضعیت',
    total: 'مجموع',
    paid: 'پرداخت',
    debt: 'بدهی',
    profit: 'سود',
    returns: 'برگشتی',
    items: 'اقلام',
    action: 'رسید',
    viewReceipt: 'مشاهده',
    loading: 'در حال بارگذاری فروش ها...',
    empty: 'هنوز هیچ فروشی ثبت نشده است.',
    walkIn: 'مشتری حضوری',
    paidStatus: 'پرداخت کامل',
    partialStatus: 'پرداخت قسمی',
    debtStatus: 'قرض',
    failed: 'بارگذاری فروش ها موفق نشد.',
  },
  ps: {
    title: 'پلور او نسخې',
    subtitle: 'د پلور، ګټې او بېرته ستنو شوو توکو بشپړ تاریخچه په یو ځای کې وګورئ.',
    newPrescription: 'نوې نسخه',
    startDate: 'له نېټې',
    endDate: 'تر نېټې',
    apply: 'فلټر پلي کړئ',
    reset: 'پاکول',
    totalSales: 'خالص پلور',
    totalProfit: 'ټوله ګټه',
    totalReturns: 'ټولې بېرته ستنونې',
    history: 'د پلور تاریخچه',
    date: 'نېټه',
    prescription: 'نسخه',
    customer: 'پیرودونکی',
    status: 'حالت',
    total: 'مجموع',
    paid: 'تادیه',
    debt: 'پور',
    profit: 'ګټه',
    returns: 'بېرته ستنونه',
    items: 'توکي',
    action: 'رسید',
    viewReceipt: 'کتل',
    loading: 'پلورنې بارېږي...',
    empty: 'تر اوسه هېڅ پلور نه دی ثبت شوی.',
    walkIn: 'حضوري پیرودونکی',
    paidStatus: 'بشپړ تادیه',
    partialStatus: 'قسمي تادیه',
    debtStatus: 'پور',
    failed: 'پلورنې بار نه شوې.',
  },
  en: {
    title: 'Sales & Prescriptions',
    subtitle: 'See the full sales history, profit, and returned medicine activity in one place.',
    newPrescription: 'New Prescription',
    startDate: 'Start Date',
    endDate: 'End Date',
    apply: 'Apply Filter',
    reset: 'Reset',
    totalSales: 'Net Sales',
    totalProfit: 'Total Profit',
    totalReturns: 'Total Returns',
    history: 'Sales History',
    date: 'Date',
    prescription: 'Prescription',
    customer: 'Customer',
    status: 'Status',
    total: 'Total',
    paid: 'Paid',
    debt: 'Debt',
    profit: 'Profit',
    returns: 'Returns',
    items: 'Items',
    action: 'Receipt',
    viewReceipt: 'View',
    loading: 'Loading sales...',
    empty: 'No sales have been recorded yet.',
    walkIn: 'Walk-in customer',
    paidStatus: 'Paid in Full',
    partialStatus: 'Partial Payment',
    debtStatus: 'On Debt',
    failed: 'Failed to load sales.',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

function formatMoney(value: number, locale: Locale) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function getStatusLabel(status: SaleHistoryRow['status'], locale: Locale) {
  if (status === 'PAID') {
    return copy[locale].paidStatus;
  }

  if (status === 'PARTIAL') {
    return copy[locale].partialStatus;
  }

  return copy[locale].debtStatus;
}

function getStatusTone(status: SaleHistoryRow['status']) {
  if (status === 'PAID') {
    return 'bg-emerald-100 text-emerald-800';
  }

  if (status === 'PARTIAL') {
    return 'bg-amber-100 text-amber-800';
  }

  return 'bg-rose-100 text-rose-800';
}

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sales, setSales] = useState<SaleHistoryRow[]>([]);
  const [summary, setSummary] = useState<SalesListResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<SaleReceipt | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const fetchSales = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
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
      const response = await api.get<SalesListResponse>(`/sales${query ? `?${query}` : ''}`);

      if (response.success && response.data) {
        setSales(response.data.sales);
        setSummary(response.data.summary);
      } else {
        setSales([]);
        setSummary(null);
        setError(response.message || tr.failed);
      }
    } catch {
      setSales([]);
      setSummary(null);
      setError(tr.failed);
    } finally {
      setIsLoading(false);
    }
  }, [tr.failed]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSales();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchSales]);

  const handleApplyFilter = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchSales({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleReset = async () => {
    setStartDate('');
    setEndDate('');
    await fetchSales();
  };

  const openReceipt = async (saleId: string) => {
    setLoadingReceiptId(saleId);

    try {
      const response = await api.get<SaleReceipt>(`/sales/${saleId}`);

      if (response.success && response.data) {
        setSelectedReceipt(response.data);
        setReceiptOpen(true);
      }
    } finally {
      setLoadingReceiptId(null);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{tr.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{tr.subtitle}</p>
        </div>

        <Link
          href="/sales/new"
          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {tr.newPrescription}
        </Link>
      </div>

      <form
        onSubmit={handleApplyFilter}
        className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto_auto]"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">{tr.startDate}</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">{tr.endDate}</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <button
          type="submit"
          className="self-end rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          {tr.apply}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {tr.reset}
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{tr.totalSales}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {formatMoney(summary?.totalSales ?? 0, locale)}
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{tr.totalProfit}</p>
          <p className="mt-3 text-3xl font-black text-emerald-700">
            {formatMoney(summary?.totalProfit ?? 0, locale)}
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{tr.totalReturns}</p>
          <p className="mt-3 text-3xl font-black text-rose-700">
            {formatMoney(summary?.totalReturns ?? 0, locale)}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">{tr.history}</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">{tr.loading}</div>
        ) : sales.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">{tr.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[tr.date, tr.prescription, tr.customer, tr.status, tr.total, tr.paid, tr.debt, tr.profit, tr.returns, tr.action].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-start font-semibold text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                      {formatDate(sale.date, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{sale.prescriptionId}</p>
                      <p className="mt-1 text-xs text-slate-500">{sale.itemCount} {tr.items}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <p>{sale.customer?.name ?? tr.walkIn}</p>
                      <p className="mt-1 text-xs text-slate-500">{sale.customer?.phone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusTone(sale.status)}`}>
                        {getStatusLabel(sale.status, locale)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                      {formatMoney(sale.totalAmount, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-emerald-700">
                      {formatMoney(sale.paidAmount, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-rose-700">
                      {formatMoney(sale.debtAmount, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-cyan-700">
                      {formatMoney(sale.profit, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-rose-700">
                      {formatMoney(sale.returnAmount, locale)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openReceipt(sale.id)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        {loadingReceiptId === sale.id ? '...' : tr.viewReceipt}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ReceiptModal
        isOpen={receiptOpen}
        receipt={selectedReceipt}
        locale={locale}
        onClose={() => setReceiptOpen(false)}
        onReturnRecorded={(nextReceipt) => {
          setSelectedReceipt(nextReceipt);
          void fetchSales({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
        }}
      />
    </div>
  );
}
