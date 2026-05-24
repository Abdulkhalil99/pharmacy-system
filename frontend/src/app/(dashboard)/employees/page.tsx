'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  createEmployee,
  deactivateEmployee,
  linkEmployeeUser,
  updateEmployee,
  useEmployees,
  type EmployeeFormData,
  type EmployeeRecord,
} from '@/hooks/useEmployees';
import { useUsers } from '@/hooks/useUsers';
import { getDirectionFromLanguage, getLocaleFromLanguage } from '@/lib/user-meta';
import { EmployeeForm } from './components/EmployeeForm';

const copy = {
  fa: {
    title: 'کارمندان',
    subtitle: 'تمام کارکنان دواخانه را نگهداری کنید؛ چه حساب کاربری داشته باشند و چه نداشته باشند.',
    addEmployee: 'افزودن کارمند',
    searchPlaceholder: 'جستجو با نام، تماس یا سمت...',
    allStatuses: 'همه وضعیت‌ها',
    active: 'فعال',
    inactive: 'غیرفعال',
    fullName: 'نام کامل',
    phone: 'تلفن',
    role: 'سمت / وظیفه',
    salary: 'معاش ماهوار',
    joinDate: 'تاریخ شروع',
    hasLogin: 'حساب کاربری',
    status: 'وضعیت',
    actions: 'عملیات',
    edit: 'ویرایش',
    salaryHistory: 'تاریخچه معاش',
    linkAccount: 'اتصال به حساب کاربری',
    deactivate: 'غیرفعال',
    loading: 'در حال بارگذاری کارمندان...',
    failed: 'بارگذاری کارمندان موفق نشد.',
    empty: 'هیچ کارمندی ثبت نشده است.',
    accessDenied: 'فقط مدیر و داروساز می‌توانند کارمندان را ببینند.',
    linkTitle: 'اتصال حساب کاربری',
    selectUser: 'انتخاب کاربر بدون اتصال',
    confirmLink: 'اتصال حساب',
    cancel: 'انصراف',
    noUnlinkedUsers: 'هیچ کاربر آزاد برای اتصال موجود نیست.',
    createdToast: 'کارمند {name} ایجاد شد.',
    updatedToast: 'اطلاعات {name} ذخیره شد.',
    linkedToast: 'حساب کاربری به {name} وصل شد.',
    deactivatedToast: 'کارمند {name} غیرفعال شد.',
  },
  ps: {
    title: 'کارکوونکي',
    subtitle: 'د درملتون ټول کارکوونکي وساتئ، که د سیستم حساب ولري یا نه.',
    addEmployee: 'کارکوونکی زیاتول',
    searchPlaceholder: 'د نوم، تماس یا دندې له مخې لټون...',
    allStatuses: 'ټول حالتونه',
    active: 'فعال',
    inactive: 'غیرفعال',
    fullName: 'بشپړ نوم',
    phone: 'ټیلیفون',
    role: 'سمت / دنده',
    salary: 'میاشتنی معاش',
    joinDate: 'د پیل نېټه',
    hasLogin: 'سیستمي حساب',
    status: 'حالت',
    actions: 'عملیات',
    edit: 'سمول',
    salaryHistory: 'د معاش تاریخچه',
    linkAccount: 'د کارن حساب نښلول',
    deactivate: 'غیرفعال',
    loading: 'کارکوونکي بارېږي...',
    failed: 'کارکوونکي بار نه شول.',
    empty: 'هیڅ کارکوونکی نه دی ثبت شوی.',
    accessDenied: 'یوازې ادمین او درملساز کارکوونکي لیدلی شي.',
    linkTitle: 'د کارن حساب نښلول',
    selectUser: 'له نه نښلول شویو کاروونکو څخه یو وټاکئ',
    confirmLink: 'حساب نښلول',
    cancel: 'لغوه',
    noUnlinkedUsers: 'د نښلولو لپاره ازاد کارن نشته.',
    createdToast: 'کارکوونکی {name} جوړ شو.',
    updatedToast: 'د {name} معلومات خوندي شول.',
    linkedToast: 'سیستمي حساب له {name} سره ونښلول شو.',
    deactivatedToast: 'کارکوونکی {name} غیرفعال شو.',
  },
  en: {
    title: 'Employees',
    subtitle: 'Keep records for all pharmacy staff, whether they have a system login or not.',
    addEmployee: 'Add Employee',
    searchPlaceholder: 'Search by name, phone, or role...',
    allStatuses: 'All Statuses',
    active: 'Active',
    inactive: 'Inactive',
    fullName: 'Full Name',
    phone: 'Phone',
    role: 'Role / Position',
    salary: 'Monthly Salary',
    joinDate: 'Join Date',
    hasLogin: 'Has Login Account',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    salaryHistory: 'View Salary History',
    linkAccount: 'Link to User Account',
    deactivate: 'Deactivate',
    loading: 'Loading employees...',
    failed: 'Failed to load employees.',
    empty: 'No employees have been added yet.',
    accessDenied: 'Only admins and pharmacists can view employees.',
    linkTitle: 'Link User Account',
    selectUser: 'Select an unlinked user',
    confirmLink: 'Link Account',
    cancel: 'Cancel',
    noUnlinkedUsers: 'No unlinked users are available.',
    createdToast: 'Created employee {name}.',
    updatedToast: 'Saved updates for {name}.',
    linkedToast: 'Linked a system account to {name}.',
    deactivatedToast: 'Deactivated employee {name}.',
  },
};

function formatMessage(template: string, name: string) {
  return template.replace('{name}', name);
}

export default function EmployeesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const locale = getLocaleFromLanguage(user?.language);
  const dir = getDirectionFromLanguage(user?.language);
  const tr = copy[locale];
  const canView = user?.role === 'ADMIN' || user?.role === 'PHARMACIST';
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [linkingEmployee, setLinkingEmployee] = useState<EmployeeRecord | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { employees, isLoading, error, refresh } = useEmployees({
    search: deferredSearch,
    status,
    enabled: canView,
  });
  const { users: unlinkedUsers } = useUsers({
    page: 1,
    limit: 100,
    linkStatus: 'UNLINKED',
    enabled: isAdmin && Boolean(linkingEmployee),
  });

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');

  if (authLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center text-sm text-slate-500" dir={dir}>
        {tr.loading}
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800" dir={dir}>
        {tr.accessDenied}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{tr.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{tr.subtitle}</p>
        </div>
        {isAdmin ? (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowForm(true);
            }}
            className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            {tr.addEmployee}
          </button>
        ) : null}
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),220px]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr.searchPlaceholder}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">{tr.allStatuses}</option>
            <option value="ACTIVE">{tr.active}</option>
            <option value="INACTIVE">{tr.inactive}</option>
          </select>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">{tr.loading}</div>
        ) : employees.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">{tr.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[tr.fullName, tr.phone, tr.role, tr.salary, tr.joinDate, tr.hasLogin, tr.status, tr.actions].map((heading) => (
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
                {employees.map((employee) => (
                  <tr key={employee.id} className={!employee.isActive ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className={`px-4 py-3 font-semibold ${employee.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      <Link href={`/employees/${employee.id}`} className="transition-colors hover:text-teal-700">
                        {employee.fullName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{employee.role}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(employee.salary)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(employee.joinDate)}</td>
                    <td className="px-4 py-3">
                      {employee.hasLoginAccount ? (
                        <span className="text-lg text-emerald-600">✓</span>
                      ) : (
                        <span className="text-lg text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          employee.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {employee.isActive ? tr.active : tr.inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowForm(true);
                            }}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            {tr.edit}
                          </button>
                        ) : null}
                        <Link
                          href={`/employees/${employee.id}`}
                          className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200"
                        >
                          {tr.salaryHistory}
                        </Link>
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              setLinkingEmployee(employee);
                              setSelectedUserId(employee.userId ?? '');
                            }}
                            className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-800 transition-colors hover:bg-violet-200"
                          >
                            {tr.linkAccount}
                          </button>
                        ) : null}
                        {isAdmin ? (
                          <button
                            onClick={async () => {
                              const response = await deactivateEmployee(employee.id);

                              if (response.success) {
                                await refresh();
                                setToast({
                                  type: 'success',
                                  message: formatMessage(tr.deactivatedToast, employee.fullName),
                                });
                                return;
                              }

                              setToast({
                                type: 'error',
                                message: response.message || 'Failed to deactivate employee',
                              });
                            }}
                            className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200"
                          >
                            {tr.deactivate}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm ? (
        <EmployeeForm
          language={locale}
          employee={editingEmployee}
          onClose={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
          onSubmit={async (formData: EmployeeFormData) => {
            const response = editingEmployee
              ? await updateEmployee(editingEmployee.id, formData)
              : await createEmployee(formData);

            if (response.success) {
              await refresh();
              setToast({
                type: 'success',
                message: formatMessage(
                  editingEmployee ? tr.updatedToast : tr.createdToast,
                  response.data?.fullName ?? formData.fullName
                ),
              });
            }

            return response;
          }}
        />
      ) : null}

      {linkingEmployee ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" dir={dir}>
          <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">{tr.linkTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{linkingEmployee.fullName}</p>
            </div>

            <div className="space-y-4 px-6 py-6">
              {unlinkedUsers.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {tr.noUnlinkedUsers}
                </div>
              ) : null}

              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{tr.selectUser}</option>
                {unlinkedUsers.map((linkedUser) => (
                  <option key={linkedUser.id} value={linkedUser.id}>
                    {linkedUser.name} ({linkedUser.username})
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setLinkingEmployee(null);
                    setSelectedUserId('');
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {tr.cancel}
                </button>
                <button
                  type="button"
                  disabled={!selectedUserId}
                  onClick={async () => {
                    const response = await linkEmployeeUser(linkingEmployee.id, selectedUserId);

                    if (response.success) {
                      await refresh();
                      setToast({
                        type: 'success',
                        message: formatMessage(tr.linkedToast, linkingEmployee.fullName),
                      });
                      setLinkingEmployee(null);
                      setSelectedUserId('');
                      return;
                    }

                    setToast({
                      type: 'error',
                      message: response.message || 'Failed to link user account',
                    });
                  }}
                  className="rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:bg-slate-400"
                >
                  {tr.confirmLink}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
