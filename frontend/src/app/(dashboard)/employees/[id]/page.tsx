'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { linkEmployeeUser, useEmployee } from '@/hooks/useEmployees';
import { useUsers } from '@/hooks/useUsers';
import { getDirectionFromLanguage, getLocaleFromLanguage } from '@/lib/user-meta';
import { RoleBadge } from '../../users/components/RoleBadge';
import { useState } from 'react';

const copy = {
  fa: {
    title: 'جزئیات کارمند',
    back: 'بازگشت به کارمندان',
    employeeInfo: 'اطلاعات کارمند',
    linkedAccount: 'حساب کاربری متصل',
    salaryHistory: 'تاریخچه معاش',
    fullName: 'نام کامل',
    phone: 'شماره تماس',
    role: 'سمت',
    salary: 'معاش ماهوار',
    joinDate: 'تاریخ شروع',
    username: 'نام کاربری',
    noLinkedAccount: 'این کارمند هنوز حساب کاربری سیستم ندارد.',
    linkButton: 'اتصال به حساب کاربری',
    selectUser: 'کاربر بدون اتصال را انتخاب کنید',
    totalPaidThisYear: 'مجموع پرداخت امسال',
    date: 'تاریخ',
    amount: 'مبلغ',
    monthYear: 'ماه / سال',
    note: 'یادداشت',
    recordedBy: 'ثبت کننده',
    recordSalary: 'ثبت پرداخت معاش',
    loading: 'در حال بارگذاری جزئیات کارمند...',
    failed: 'بارگذاری جزئیات کارمند موفق نشد.',
    notFound: 'کارمند پیدا نشد.',
    noSalaryHistory: 'برای این کارمند هنوز پرداخت معاشی ثبت نشده است.',
    linkSuccess: 'حساب کاربری با موفقیت وصل شد.',
    noUnlinkedUsers: 'هیچ کاربر آزاد برای اتصال باقی نمانده است.',
  },
  ps: {
    title: 'د کارکوونکي جزییات',
    back: 'کارکوونکو ته بېرته',
    employeeInfo: 'د کارکوونکي معلومات',
    linkedAccount: 'نښلول شوی حساب',
    salaryHistory: 'د معاش تاریخچه',
    fullName: 'بشپړ نوم',
    phone: 'د تماس شمېره',
    role: 'سمت',
    salary: 'میاشتنی معاش',
    joinDate: 'د پیل نېټه',
    username: 'د کارونکي نوم',
    noLinkedAccount: 'دا کارکوونکی تر اوسه سیستمي حساب نه لري.',
    linkButton: 'د کارن حساب نښلول',
    selectUser: 'له نه نښلول شویو کاروونکو څخه یو وټاکئ',
    totalPaidThisYear: 'د روان کال ټول تادیات',
    date: 'نېټه',
    amount: 'مبلغ',
    monthYear: 'میاشت / کال',
    note: 'یادښت',
    recordedBy: 'ثبتوونکی',
    recordSalary: 'د معاش تادیه ثبتول',
    loading: 'د کارکوونکي جزییات بارېږي...',
    failed: 'د کارکوونکي جزییات بار نه شول.',
    notFound: 'کارکوونکی ونه موندل شو.',
    noSalaryHistory: 'د دې کارکوونکي لپاره لا تر اوسه معاش نه دی ثبت شوی.',
    linkSuccess: 'سیستمي حساب په بریالیتوب ونښلول شو.',
    noUnlinkedUsers: 'د نښلولو لپاره نور ازاد کارنان نشته.',
  },
  en: {
    title: 'Employee Detail',
    back: 'Back to Employees',
    employeeInfo: 'Employee Info',
    linkedAccount: 'Linked Account',
    salaryHistory: 'Salary History',
    fullName: 'Full Name',
    phone: 'Phone',
    role: 'Role',
    salary: 'Monthly Salary',
    joinDate: 'Join Date',
    username: 'Username',
    noLinkedAccount: 'This employee is not linked to a system account yet.',
    linkButton: 'Link to User Account',
    selectUser: 'Select an unlinked user',
    totalPaidThisYear: 'Total Paid This Year',
    date: 'Date',
    amount: 'Amount',
    monthYear: 'Month / Year',
    note: 'Note',
    recordedBy: 'Recorded By',
    recordSalary: 'Record Salary Payment',
    loading: 'Loading employee details...',
    failed: 'Failed to load employee details.',
    notFound: 'Employee not found.',
    noSalaryHistory: 'No salary payments have been recorded for this employee yet.',
    linkSuccess: 'Linked the user account successfully.',
    noUnlinkedUsers: 'There are no unlinked users left to connect.',
  },
};

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const locale = getLocaleFromLanguage(user?.language);
  const dir = getDirectionFromLanguage(user?.language);
  const tr = copy[locale];
  const isAdmin = user?.role === 'ADMIN';

  const [selectedUserId, setSelectedUserId] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { employee, isLoading, error, refresh } = useEmployee(params.id ?? null, Boolean(params.id));
  const { users: unlinkedUsers } = useUsers({
    page: 1,
    limit: 100,
    linkStatus: 'UNLINKED',
    enabled: isAdmin && Boolean(employee) && !employee?.user,
  });

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center text-sm text-slate-500" dir={dir}>
        {tr.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700" dir={dir}>
        {tr.failed}
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800" dir={dir}>
        {tr.notFound}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/employees" className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800">
            {tr.back}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{tr.title}</h1>
        </div>
        <Link
          href={`/salaries?employeeId=${employee.id}`}
          className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          {tr.recordSalary}
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(320px,0.8fr)]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{tr.employeeInfo}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr.fullName}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{employee.fullName}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr.phone}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{employee.phone}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr.role}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{employee.role}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr.salary}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(employee.salary)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr.joinDate}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(employee.joinDate)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{tr.linkedAccount}</h2>

          {employee.user ? (
            <div className="mt-5 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{tr.username}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{employee.user.username}</p>
              </div>
              <RoleBadge role={employee.user.role} language={locale} />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {tr.noLinkedAccount}
              </div>

              {isAdmin ? (
                <>
                  {unlinkedUsers.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {tr.noUnlinkedUsers}
                    </div>
                  ) : null}

                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">{tr.selectUser}</option>
                    {unlinkedUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.username})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedUserId}
                    onClick={async () => {
                      const response = await linkEmployeeUser(employee.id, selectedUserId);

                      if (response.success) {
                        await refresh();
                        setSelectedUserId('');
                        setToast({
                          type: 'success',
                          message: tr.linkSuccess,
                        });
                        return;
                      }

                      setToast({
                        type: 'error',
                        message: response.message || 'Failed to link user',
                      });
                    }}
                    className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:bg-slate-400"
                  >
                    {tr.linkButton}
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section id="salary-history" className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{tr.salaryHistory}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {tr.totalPaidThisYear}: <span className="font-semibold text-teal-700">{formatMoney(employee.salarySummary.totalPaidThisYear)}</span>
            </p>
          </div>
        </div>

        {employee.salaryHistory.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">{tr.noSalaryHistory}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[tr.date, tr.amount, tr.monthYear, tr.note, tr.recordedBy].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employee.salaryHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(payment.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-indigo-700">{formatMoney(payment.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {payment.month}/{payment.year}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{payment.note ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{payment.user.name}</td>
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
