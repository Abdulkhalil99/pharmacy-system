'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CustomerFilter,
  CustomerListItem,
  createCustomer,
  updateCustomer,
  useCustomers,
} from '@/hooks/useCustomers';
import { CustomerForm } from './components/CustomerForm';

type Locale = 'fa' | 'ps' | 'en';

const SALE_DRAFT_CUSTOMER_KEY = 'pharmacy:new-sale-draft-customer';

const copy = {
  fa: {
    title: 'مشتریان و بدهی ها',
    subtitle: 'مشتریان را ثبت کنید، بدهی جاری را ببینید و به جزئیات حساب هر مشتری بروید.',
    addCustomer: 'مشتری جدید',
    searchPlaceholder: 'جستجو با نام یا شماره تماس...',
    all: 'همه',
    withDebt: 'بدهکار',
    noDebt: 'بدون بدهی',
    name: 'نام',
    phone: 'تلفن',
    totalDebt: 'کل بدهی',
    lastTransaction: 'آخرین تراکنش',
    actions: 'عملیات',
    view: 'مشاهده',
    edit: 'ویرایش',
    debt: 'بدهی',
    payment: 'پرداخت',
    noCustomers: 'هنوز هیچ مشتری ثبت نشده است.',
    loading: 'در حال بارگذاری مشتریان...',
    failed: 'بارگذاری مشتریان موفق نشد.',
    none: 'بدون تراکنش',
    totalCustomers: 'تعداد مشتریان',
    totalReceivable: 'بدهی قابل وصول',
    clearDebt: 'تسویه',
  },
  ps: {
    title: 'پیرودونکي او پورونه',
    subtitle: 'پیرودونکي ثبت کړئ، اوسنی پور وګورئ، او د هر پیرودونکي حساب ته ننوځئ.',
    addCustomer: 'نوی پیرودونکی',
    searchPlaceholder: 'د نوم یا د تماس شمېره ولټوئ...',
    all: 'ټول',
    withDebt: 'پور لرونکي',
    noDebt: 'بې پور',
    name: 'نوم',
    phone: 'ټیلیفون',
    totalDebt: 'ټول پور',
    lastTransaction: 'وروستی تراکنش',
    actions: 'عملیات',
    view: 'کتل',
    edit: 'سمول',
    debt: 'پور',
    payment: 'تادیه',
    noCustomers: 'لا تر اوسه هېڅ پیرودونکی نه دی ثبت شوی.',
    loading: 'پیرودونکي بارېږي...',
    failed: 'پیرودونکي بار نه شول.',
    none: 'تراکنش نشته',
    totalCustomers: 'د پیرودونکو شمېر',
    totalReceivable: 'د اخیستلو وړ پور',
    clearDebt: 'تصفیه',
  },
  en: {
    title: 'Customers & Debt',
    subtitle: 'Register customers, review their running debt, and open each customer account.',
    addCustomer: 'Add Customer',
    searchPlaceholder: 'Search by name or phone...',
    all: 'All',
    withDebt: 'With Debt',
    noDebt: 'No Debt',
    name: 'Name',
    phone: 'Phone',
    totalDebt: 'Total Debt',
    lastTransaction: 'Last Transaction',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    debt: 'Debt',
    payment: 'Payment',
    noCustomers: 'No customers have been added yet.',
    loading: 'Loading customers...',
    failed: 'Failed to load customers.',
    none: 'No transactions',
    totalCustomers: 'Customers',
    totalReceivable: 'Receivable Debt',
    clearDebt: 'Settled',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

const filterOptions: CustomerFilter[] = ['ALL', 'WITH_DEBT', 'NO_DEBT'];

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromSaleDraft = searchParams.get('fromSaleDraft') === '1';
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState<CustomerFilter>('ALL');
  const { customers, isLoading, error, refresh } = useCustomers({
    search: deferredSearch,
    filter,
  });

  const [showForm, setShowForm] = useState(isFromSaleDraft);
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);

  const totalReceivable = customers.reduce((sum, customer) => sum + customer.totalDebt, 0);

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF') : tr.none;

  const getTransactionLabel = (customer: CustomerListItem) => {
    if (!customer.lastTransactionDate || !customer.lastTransactionType) {
      return tr.none;
    }

    return `${customer.lastTransactionType === 'DEBT' ? tr.debt : tr.payment} • ${formatDate(
      customer.lastTransactionDate
    )}`;
  };

  const openCreateForm = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const openEditForm = (customer: CustomerListItem) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);

    if (isFromSaleDraft) {
      router.push('/sales/new?restoreSaleDraft=1');
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tr.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">{tr.subtitle}</p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {tr.addCustomer}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalCustomers}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{customers.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.totalReceivable}</p>
          <p className="mt-3 text-3xl font-bold text-red-600">{formatMoney(totalReceivable)}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr.searchPlaceholder}
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const label =
                option === 'ALL'
                  ? tr.all
                  : option === 'WITH_DEBT'
                    ? tr.withDebt
                    : tr.noDebt;

              const active = filter === option;

              return (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.loading}</div>
        ) : customers.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.noCustomers}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[tr.name, tr.phone, tr.totalDebt, tr.lastTransaction, tr.actions].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => {
                  const hasDebt = customer.totalDebt > 0;

                  return (
                    <tr key={customer.id} className={hasDebt ? 'bg-red-50/40' : 'bg-white'}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-semibold text-gray-900 transition-colors hover:text-teal-700"
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {customer.phone ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            hasDebt ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {hasDebt ? formatMoney(customer.totalDebt) : tr.clearDebt}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {getTransactionLabel(customer)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                          >
                            {tr.view}
                          </Link>
                          <button
                            onClick={() => openEditForm(customer)}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                          >
                            {tr.edit}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <CustomerForm
          locale={locale}
          customer={editingCustomer}
          onClose={closeForm}
          onSubmit={async (data) => {
            const response = editingCustomer
              ? await updateCustomer(editingCustomer.id, data)
              : await createCustomer(data);

            if (response.success) {
              await refresh();

              if (isFromSaleDraft && !editingCustomer && response.data) {
                window.sessionStorage.setItem(
                  SALE_DRAFT_CUSTOMER_KEY,
                  JSON.stringify({
                    id: response.data.id,
                    name: response.data.name,
                    phone: response.data.phone,
                    totalDebt: response.data.totalDebt,
                    createdAt: response.data.createdAt,
                  })
                );
                router.push('/sales/new?restoreSaleDraft=1');
              }
            }

            return response;
          }}
        />
      )}
    </div>
  );
}
