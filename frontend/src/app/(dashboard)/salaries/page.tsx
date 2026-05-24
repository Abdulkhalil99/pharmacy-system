'use client';

import { useDeferredValue, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createSalaryPayment, useSalaries, useSalarySummary } from '@/hooks/useSalaries';
import { SalaryForm } from './components/SalaryForm';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    title: 'پرداخت معاشات',
    subtitle: 'تاریخچه پرداخت معاش، جستجو بر اساس کارمند، و مجموع پرداخت ماهانه را از یک صفحه مدیریت کنید.',
    paySalary: 'پرداخت معاش',
    employeeName: 'نام کارمند',
    month: 'ماه',
    year: 'سال',
    totalThisMonth: 'مجموع معاش این ماه',
    paymentCount: 'تعداد پرداخت ها',
    salaryHistory: 'تاریخچه معاشات',
    date: 'تاریخ',
    amount: 'مبلغ',
    note: 'یادداشت',
    recordedBy: 'ثبت کننده',
    loading: 'در حال بارگذاری معاشات...',
    failed: 'بارگذاری معاشات موفق نشد.',
    empty: 'هنوز هیچ معاشی ثبت نشده است.',
  },
  ps: {
    title: 'د معاشاتو تادیات',
    subtitle: 'د معاش د تادیاتو تاریخچه، د کارکوونکي له مخې لټون، او د میاشتني مجموع مدیریت له یوې پاڼې وکړئ.',
    paySalary: 'معاش ورکول',
    employeeName: 'د کارکوونکي نوم',
    month: 'میاشت',
    year: 'کال',
    totalThisMonth: 'د دې میاشتې د معاش مجموع',
    paymentCount: 'د تادیاتو شمېر',
    salaryHistory: 'د معاشاتو تاریخچه',
    date: 'نېټه',
    amount: 'مبلغ',
    note: 'یادښت',
    recordedBy: 'ثبتوونکی',
    loading: 'معاشات بارېږي...',
    failed: 'معاشات بار نه شول.',
    empty: 'لا تر اوسه هېڅ معاش نه دی ثبت شوی.',
  },
  en: {
    title: 'Salary Payments',
    subtitle: 'Manage salary payment history, employee filters, and monthly totals from one page.',
    paySalary: 'Pay Salary',
    employeeName: 'Employee Name',
    month: 'Month',
    year: 'Year',
    totalThisMonth: 'Total Salaries This Month',
    paymentCount: 'Payments',
    salaryHistory: 'Salary History',
    date: 'Date',
    amount: 'Amount',
    note: 'Note',
    recordedBy: 'Recorded By',
    loading: 'Loading salaries...',
    failed: 'Failed to load salaries.',
    empty: 'No salary payments have been recorded yet.',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

export default function SalariesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const now = new Date();
  const selectedEmployeeId = searchParams.get('employeeId') ?? '';

  const [employeeName, setEmployeeName] = useState('');
  const deferredEmployeeName = useDeferredValue(employeeName);
  const [monthInput, setMonthInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const { salaries, employees, isLoading, error, refresh } = useSalaries({
    employeeId: selectedEmployeeId || undefined,
    employeeName: deferredEmployeeName || undefined,
    month: monthInput ? Number(monthInput) : undefined,
    year: yearInput ? Number(yearInput) : undefined,
  });
  const { summary, refresh: refreshSummary } = useSalarySummary({
    month: monthInput ? Number(monthInput) : now.getMonth() + 1,
    year: yearInput ? Number(yearInput) : now.getFullYear(),
  });

  const [showForm, setShowForm] = useState(false);

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tr.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500">{tr.subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {tr.paySalary}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-sm">
          <p className="text-sm text-slate-300">{tr.totalThisMonth}</p>
          <p className="mt-3 text-3xl font-bold">{formatMoney(summary?.totalAmount ?? 0)}</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{tr.paymentCount}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {(summary?.count ?? 0).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.employeeName}</label>
            <input
              value={employeeName}
              onChange={(event) => setEmployeeName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={tr.employeeName}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.month}</label>
            <input
              type="number"
              min={1}
              max={12}
              value={monthInput}
              onChange={(event) => setMonthInput(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.year}</label>
            <input
              type="number"
              min={2000}
              max={2100}
              value={yearInput}
              onChange={(event) => setYearInput(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">{tr.salaryHistory}</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.loading}</div>
        ) : salaries.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[tr.date, tr.employeeName, tr.month, tr.year, tr.note, tr.recordedBy, tr.amount].map((heading) => (
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
                {salaries.map((salary) => (
                  <tr key={salary.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(salary.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{salary.employeeName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {salary.month.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {salary.year.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{salary.note ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{salary.user.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-indigo-700">
                      {formatMoney(salary.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <SalaryForm
          locale={locale}
          employees={employees}
          initialEmployeeId={selectedEmployeeId || undefined}
          onClose={() => setShowForm(false)}
          onSubmit={async (formData) => {
            const response = await createSalaryPayment(formData);

            if (response.success) {
              await Promise.all([refresh(), refreshSummary()]);
            }

            return response;
          }}
        />
      )}
    </div>
  );
}
