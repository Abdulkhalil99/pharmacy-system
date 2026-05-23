'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Company,
  CompanyFormData,
  createCompany,
  updateCompany,
  useCompanies,
} from '@/hooks/useCompanies';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    title: 'حسابداری شرکت ها',
    subtitle: 'مدیریت خریدها، پرداخت ها و بیلانس جاری هر شرکت',
    totalCompanies: 'تعداد شرکت ها',
    totalPurchased: 'کل خرید',
    totalPaid: 'کل پرداخت',
    totalBalance: 'بیلانس مجموعی',
    currentBalance: 'بیلانس فعلی',
    transactionCount: 'تعداد تراکنش',
    quickPay: 'پرداخت سریع',
    viewReport: 'گزارش کامل',
    addCompany: 'شرکت جدید',
    editCompany: 'ویرایش',
    phone: 'تلفن',
    address: 'آدرس',
    noCompanies: 'هنوز هیچ شرکتی ثبت نشده است.',
    loading: 'در حال بارگذاری شرکت ها...',
    failed: 'بارگذاری شرکت ها موفق نشد.',
    save: 'ذخیره',
    saving: 'در حال ذخیره...',
    cancel: 'انصراف',
    createTitle: 'ایجاد شرکت',
    editTitle: 'ویرایش شرکت',
    name: 'نام شرکت',
    balanceDue: 'قابل پرداخت',
    credit: 'اعتبار',
  },
  ps: {
    title: 'د شرکتونو حسابداري',
    subtitle: 'د هر شرکت د پېرود، پیسو او اوسني بیلانس مدیریت',
    totalCompanies: 'د شرکتونو شمېر',
    totalPurchased: 'ټول پېرود',
    totalPaid: 'ټول تادیات',
    totalBalance: 'ټولیز بیلانس',
    currentBalance: 'اوسنی بیلانس',
    transactionCount: 'د تراکنش شمېر',
    quickPay: 'چټک تادیه',
    viewReport: 'بشپړ راپور',
    addCompany: 'نوی شرکت',
    editCompany: 'سمول',
    phone: 'ټیلیفون',
    address: 'پته',
    noCompanies: 'لا تر اوسه کوم شرکت نه دی ثبت شوی.',
    loading: 'شرکتونه بارېږي...',
    failed: 'شرکتونه بار نه شول.',
    save: 'خوندي کول',
    saving: 'خوندي کېږي...',
    cancel: 'لغوه',
    createTitle: 'شرکت جوړول',
    editTitle: 'شرکت سمول',
    name: 'د شرکت نوم',
    balanceDue: 'ورکول کېدونکی',
    credit: 'اعتبار',
  },
  en: {
    title: 'Company Accounting',
    subtitle: 'Manage supplier purchases, payments, and running balances',
    totalCompanies: 'Total Companies',
    totalPurchased: 'Total Purchased',
    totalPaid: 'Total Paid',
    totalBalance: 'Total Balance',
    currentBalance: 'Current Balance',
    transactionCount: 'Transactions',
    quickPay: 'Quick Pay',
    viewReport: 'Full Report',
    addCompany: 'New Company',
    editCompany: 'Edit',
    phone: 'Phone',
    address: 'Address',
    noCompanies: 'No companies have been added yet.',
    loading: 'Loading companies...',
    failed: 'Failed to load companies.',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    createTitle: 'Create Company',
    editTitle: 'Edit Company',
    name: 'Company Name',
    balanceDue: 'Amount Due',
    credit: 'Credit',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

export default function CompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const { companies, isLoading, error, refresh } = useCompanies();

  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormData>({
    name: '',
    phone: '',
    address: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const totals = useMemo(() => {
    return companies.reduce(
      (acc, company) => {
        acc.totalPurchased += company.totalPurchased;
        acc.totalPaid += company.totalPaid;
        acc.totalBalance += company.balance;
        return acc;
      },
      { totalPurchased: 0, totalPaid: 0, totalBalance: 0 }
    );
  }, [companies]);

  const formatMoney = (value: number) =>
    value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');

  const openCreateModal = () => {
    setEditingCompany(null);
    setForm({ name: '', phone: '', address: '' });
    setApiError('');
    setShowModal(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      phone: company.phone ?? '',
      address: company.address ?? '',
    });
    setApiError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setIsSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone?.trim() || undefined,
      address: form.address?.trim() || undefined,
    };

    const response = editingCompany
      ? await updateCompany(editingCompany.id, payload)
      : await createCompany(payload);

    if (response.success) {
      setShowModal(false);
      await refresh();
    } else {
      setApiError(response.message || 'Failed to save company');
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tr.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">{tr.subtitle}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {tr.addCompany}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalCompanies}</p>
          <p className="mt-3 text-3xl font-bold text-teal-700">{companies.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalPurchased}</p>
          <p className="mt-3 text-3xl font-bold text-orange-600">{formatMoney(totals.totalPurchased)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalPaid}</p>
          <p className="mt-3 text-3xl font-bold text-teal-600">{formatMoney(totals.totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalBalance}</p>
          <p className={`mt-3 text-3xl font-bold ${totals.totalBalance > 0 ? 'text-red-600' : 'text-teal-700'}`}>
            {formatMoney(totals.totalBalance)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
          {tr.loading}
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
          {tr.noCompanies}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {companies.map((company) => (
            <div
              key={company.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/companies/${company.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  router.push(`/companies/${company.id}`);
                }
              }}
              className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-gray-900">{company.name}</h2>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>{tr.phone}: {company.phone ?? '—'}</p>
                    <p className="line-clamp-2">{tr.address}: {company.address ?? '—'}</p>
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  company.balance > 0 ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'
                }`}>
                  {company.balance > 0 ? tr.balanceDue : tr.credit}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-orange-50 px-3 py-3">
                  <p className="text-xs text-orange-700">{tr.totalPurchased}</p>
                  <p className="mt-2 font-bold text-orange-800">{formatMoney(company.totalPurchased)}</p>
                </div>
                <div className="rounded-2xl bg-teal-50 px-3 py-3">
                  <p className="text-xs text-teal-700">{tr.totalPaid}</p>
                  <p className="mt-2 font-bold text-teal-800">{formatMoney(company.totalPaid)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-3 py-3">
                  <p className="text-xs text-gray-500">{tr.transactionCount}</p>
                  <p className="mt-2 font-bold text-gray-800">{company.transactionCount ?? 0}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{tr.currentBalance}</p>
                <p className={`mt-2 text-2xl font-bold ${company.balance > 0 ? 'text-red-600' : 'text-teal-700'}`}>
                  {formatMoney(company.balance)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/companies/${company.id}?action=payment`);
                  }}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  {tr.quickPay}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(company);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {tr.editCompany}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/companies/${company.id}`);
                  }}
                  className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
                >
                  {tr.viewReport}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCompany ? tr.editTitle : tr.createTitle}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{tr.subtitle}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 transition-colors hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
              {apiError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{tr.name}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{tr.phone}</label>
                <input
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{tr.address}</label>
                <textarea
                  value={form.address ?? ''}
                  onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {tr.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
                >
                  {isSaving ? tr.saving : tr.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
