'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  recordCompanyPayment,
  recordCompanyPurchase,
  useCompanyReport,
} from '@/hooks/useCompanies';
import { PaymentForm } from './components/PaymentForm';
import { PurchaseForm } from './components/PurchaseForm';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    back: 'بازگشت به شرکت ها',
    title: 'گزارش مالی شرکت',
    subtitle: 'تمام خریدها، پرداخت ها و بیلانس جاری این شرکت',
    totalPurchased: 'کل خرید',
    totalPaid: 'کل پرداخت',
    balance: 'بیلانس',
    purchaseCount: 'تعداد خرید',
    paymentCount: 'تعداد پرداخت',
    lastPurchase: 'آخرین خرید',
    lastPayment: 'آخرین پرداخت',
    purchaseButton: 'ثبت خرید',
    paymentButton: 'ثبت پرداخت',
    history: 'تاریخچه تراکنش ها',
    date: 'تاریخ',
    type: 'نوع',
    amount: 'مبلغ',
    billNumber: 'شماره بل',
    note: 'یادداشت',
    purchase: 'خرید',
    payment: 'پرداخت',
    noTransactions: 'هنوز تراکنشی برای این شرکت ثبت نشده است.',
    loading: 'در حال بارگذاری گزارش شرکت...',
    failed: 'بارگذاری گزارش شرکت موفق نشد.',
    phone: 'تلفن',
    address: 'آدرس',
    companyNotFound: 'شرکت پیدا نشد.',
  },
  ps: {
    back: 'شرکتونو ته بېرته',
    title: 'د شرکت مالي راپور',
    subtitle: 'د دې شرکت ټول پېرود، پیسې او اوسنی بیلانس',
    totalPurchased: 'ټول پېرود',
    totalPaid: 'ټول تادیات',
    balance: 'بیلانس',
    purchaseCount: 'د پېرود شمېر',
    paymentCount: 'د تادیې شمېر',
    lastPurchase: 'وروستی پېرود',
    lastPayment: 'وروستۍ تادیه',
    purchaseButton: 'پېرود ثبتول',
    paymentButton: 'تادیه ثبتول',
    history: 'د تراکنش تاریخچه',
    date: 'نېټه',
    type: 'ډول',
    amount: 'اندازه',
    billNumber: 'د بل شمېره',
    note: 'یادښت',
    purchase: 'پېرود',
    payment: 'تادیه',
    noTransactions: 'د دې شرکت لپاره لا تراکنش نه دی ثبت شوی.',
    loading: 'د شرکت راپور بارېږي...',
    failed: 'د شرکت راپور بار نه شو.',
    phone: 'ټیلیفون',
    address: 'پته',
    companyNotFound: 'شرکت ونه موندل شو.',
  },
  en: {
    back: 'Back to Companies',
    title: 'Company Financial Report',
    subtitle: 'All purchases, payments, and running balance for this supplier',
    totalPurchased: 'Total Purchased',
    totalPaid: 'Total Paid',
    balance: 'Balance',
    purchaseCount: 'Purchase Count',
    paymentCount: 'Payment Count',
    lastPurchase: 'Last Purchase',
    lastPayment: 'Last Payment',
    purchaseButton: 'Record Purchase',
    paymentButton: 'Record Payment',
    history: 'Transaction History',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    billNumber: 'Bill Number',
    note: 'Note',
    purchase: 'PURCHASE',
    payment: 'PAYMENT',
    noTransactions: 'No transactions have been recorded for this company yet.',
    loading: 'Loading company report...',
    failed: 'Failed to load company report.',
    phone: 'Phone',
    address: 'Address',
    companyNotFound: 'Company not found.',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

const getRouteParam = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const companyId = getRouteParam(params.id);
  const { report, isLoading, error, refresh } = useCompanyReport(companyId);

  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');

    if (!companyId || !action) {
      return;
    }

    if (action === 'purchase') {
      setShowPurchaseForm(true);
      router.replace(`/companies/${companyId}`);
    }

    if (action === 'payment') {
      setShowPaymentForm(true);
      router.replace(`/companies/${companyId}`);
    }
  }, [companyId, router, searchParams]);

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF')
      : '—';

  const formatMoney = (value: number) =>
    value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');

  if (!companyId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
        {tr.companyNotFound}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        {tr.back}
      </Link>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      )}

      {isLoading && !report ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
          {tr.loading}
        </div>
      ) : !report ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
          {tr.companyNotFound}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{report.company.name}</h1>
              <p className="mt-2 text-sm text-gray-500">{tr.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>{tr.phone}: {report.company.phone ?? '—'}</span>
                <span>{tr.address}: {report.company.address ?? '—'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPurchaseForm(true)}
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700"
              >
                {tr.purchaseButton}
              </button>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                {tr.paymentButton}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{tr.totalPurchased}</p>
              <p className="mt-3 text-3xl font-bold text-orange-600">
                {formatMoney(report.summary.totalPurchased)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{tr.totalPaid}</p>
              <p className="mt-3 text-3xl font-bold text-teal-600">
                {formatMoney(report.summary.totalPaid)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{tr.balance}</p>
              <p className={`mt-3 text-3xl font-bold ${report.summary.balance > 0 ? 'text-red-600' : 'text-teal-700'}`}>
                {formatMoney(report.summary.balance)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{tr.purchaseCount} / {tr.paymentCount}</p>
              <p className="mt-3 text-3xl font-bold text-gray-800">
                {report.summary.purchaseCount} / {report.summary.paymentCount}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{tr.lastPurchase}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatDate(report.summary.lastPurchaseDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{tr.lastPayment}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatDate(report.summary.lastPaymentDate)}
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-xl font-semibold text-gray-900">{tr.history}</h2>
            </div>

            {report.transactions.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.noTransactions}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {[tr.date, tr.type, tr.amount, tr.billNumber, tr.note].map((heading) => (
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
                    {report.transactions.map((transaction) => {
                      const isPurchase = transaction.type === 'PURCHASE';
                      return (
                        <tr key={transaction.id} className={isPurchase ? 'bg-red-50/50' : 'bg-teal-50/50'}>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isPurchase ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'
                            }`}>
                              {isPurchase ? tr.purchase : tr.payment}
                            </span>
                          </td>
                          <td className={`whitespace-nowrap px-4 py-3 font-semibold ${
                            isPurchase ? 'text-red-700' : 'text-teal-700'
                          }`}>
                            {formatMoney(transaction.amount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                            {transaction.billNumber ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {transaction.note ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {report && showPurchaseForm && (
        <PurchaseForm
          companyName={report.company.name}
          locale={locale}
          onClose={() => setShowPurchaseForm(false)}
          onSubmit={async (data) => {
            const response = await recordCompanyPurchase(report.company.id, data);
            if (response.success) {
              await refresh();
            }
            return response;
          }}
        />
      )}

      {report && showPaymentForm && (
        <PaymentForm
          companyName={report.company.name}
          currentBalance={report.summary.balance}
          locale={locale}
          onClose={() => setShowPaymentForm(false)}
          onSubmit={async (data) => {
            const response = await recordCompanyPayment(report.company.id, data);
            if (response.success) {
              await refresh();
            }
            return response;
          }}
        />
      )}
    </div>
  );
}
