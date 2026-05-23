'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  recordCustomerPayment,
  useCustomerReport,
} from '@/hooks/useCustomers';
import { PaymentForm } from './components/PaymentForm';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    back: 'بازگشت به مشتریان',
    title: 'پروفایل بدهی مشتری',
    subtitle: 'وضعیت بدهی، پرداخت ها و همه تراکنش های این مشتری را از یک صفحه ببینید.',
    phone: 'تلفن',
    totalDebt: 'کل بدهی',
    totalPaid: 'کل پرداخت',
    totalPrescriptions: 'تعداد نسخه ها',
    debtCreated: 'کل بدهی ایجاد شده',
    recordPayment: 'ثبت پرداخت',
    paymentDisabled: 'این مشتری فعلاً بدهی ندارد.',
    history: 'تاریخچه تراکنش ها',
    date: 'تاریخ',
    type: 'نوع',
    amount: 'مبلغ',
    description: 'توضیحات',
    debt: 'بدهی',
    payment: 'پرداخت',
    loading: 'در حال بارگذاری حساب مشتری...',
    failed: 'بارگذاری حساب مشتری موفق نشد.',
    notFound: 'مشتری پیدا نشد.',
    noTransactions: 'هنوز تراکنشی برای این مشتری ثبت نشده است.',
    lastPayment: 'آخرین پرداخت',
    lastDebt: 'آخرین بدهی',
    none: '—',
  },
  ps: {
    back: 'پیرودونکو ته بېرته',
    title: 'د پیرودونکي د پور پروفایل',
    subtitle: 'د دې پیرودونکي پور، پیسې، او ټول تراکنشونه له یوې پاڼې وګورئ.',
    phone: 'ټیلیفون',
    totalDebt: 'ټول پور',
    totalPaid: 'ټولې پیسې',
    totalPrescriptions: 'د نسخو شمېر',
    debtCreated: 'ټول جوړ شوی پور',
    recordPayment: 'پیسې ثبتول',
    paymentDisabled: 'دا پیرودونکی اوس پور نه لري.',
    history: 'د تراکنش تاریخچه',
    date: 'نېټه',
    type: 'ډول',
    amount: 'اندازه',
    description: 'تشریح',
    debt: 'پور',
    payment: 'تادیه',
    loading: 'د پیرودونکي حساب بارېږي...',
    failed: 'د پیرودونکي حساب بار نه شو.',
    notFound: 'پیرودونکی ونه موندل شو.',
    noTransactions: 'د دې پیرودونکي لپاره لا تراکنش نشته.',
    lastPayment: 'وروستۍ تادیه',
    lastDebt: 'وروستی پور',
    none: '—',
  },
  en: {
    back: 'Back to Customers',
    title: 'Customer Debt Profile',
    subtitle: 'See this customer’s debt balance, payments, and full transaction history in one place.',
    phone: 'Phone',
    totalDebt: 'Total Debt',
    totalPaid: 'Total Paid',
    totalPrescriptions: 'Total Prescriptions',
    debtCreated: 'Total Debt Created',
    recordPayment: 'Record Payment',
    paymentDisabled: 'This customer does not currently owe anything.',
    history: 'Transaction History',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    description: 'Description',
    debt: 'Debt',
    payment: 'Payment',
    loading: 'Loading customer account...',
    failed: 'Failed to load customer account.',
    notFound: 'Customer not found.',
    noTransactions: 'No transactions have been recorded for this customer yet.',
    lastPayment: 'Last Payment',
    lastDebt: 'Last Debt',
    none: '—',
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

export default function CustomerDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const customerId = getRouteParam(params.id);
  const { report, isLoading, error, refresh } = useCustomerReport(customerId);

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF') : tr.none;

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');

  if (!customerId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
        {tr.notFound}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
          {tr.notFound}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{report.customer.name}</h1>
              <p className="mt-2 text-sm text-gray-500">{tr.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>{tr.phone}: {report.customer.phone ?? tr.none}</span>
                <span>{tr.lastPayment}: {formatDate(report.summary.lastPaymentDate)}</span>
                <span>{tr.lastDebt}: {formatDate(report.summary.lastDebtDate)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentForm(true)}
              disabled={report.summary.totalDebt <= 0}
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              title={report.summary.totalDebt <= 0 ? tr.paymentDisabled : tr.recordPayment}
            >
              {tr.recordPayment}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              {
                label: tr.totalDebt,
                value: formatMoney(report.summary.totalDebt),
                valueClassName: 'text-red-600',
              },
              {
                label: tr.totalPaid,
                value: formatMoney(report.summary.totalPaid),
                valueClassName: 'text-emerald-700',
              },
              {
                label: tr.totalPrescriptions,
                value: report.summary.totalPrescriptions.toLocaleString(
                  locale === 'en' ? 'en-US' : 'fa-AF'
                ),
                valueClassName: 'text-slate-900',
              },
              {
                label: tr.debtCreated,
                value: formatMoney(report.summary.totalDebtCreated),
                valueClassName: 'text-orange-600',
              },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`mt-3 text-3xl font-bold ${card.valueClassName}`}>{card.value}</p>
              </div>
            ))}
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
                      {[tr.date, tr.type, tr.amount, tr.description].map((heading) => (
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
                      const isDebt = transaction.type === 'DEBT';

                      return (
                        <tr key={transaction.id} className={isDebt ? 'bg-red-50/40' : 'bg-emerald-50/40'}>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                            {formatDateTime(transaction.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isDebt ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {isDebt ? tr.debt : tr.payment}
                            </span>
                          </td>
                          <td
                            className={`whitespace-nowrap px-4 py-3 font-semibold ${
                              isDebt ? 'text-red-700' : 'text-emerald-700'
                            }`}
                          >
                            {formatMoney(transaction.amount)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div>{transaction.description}</div>
                            {transaction.prescriptionId && (
                              <div className="mt-1 text-xs text-gray-400">
                                Rx: {transaction.prescriptionId}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {showPaymentForm && (
            <PaymentForm
              locale={locale}
              customerName={report.customer.name}
              currentDebt={report.summary.totalDebt}
              onClose={() => setShowPaymentForm(false)}
              onSubmit={async (data) => {
                const response = await recordCustomerPayment(customerId, data);

                if (response.success) {
                  await refresh();
                }

                return response;
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
