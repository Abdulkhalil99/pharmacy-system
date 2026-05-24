'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  createUser,
  deactivateUser,
  resetUserPassword,
  toggleUserActive,
  updateUser,
  useUsers,
  type UserFormData,
  type UserRecord,
} from '@/hooks/useUsers';
import { getDirectionFromLanguage, getLocaleFromLanguage, getRoleLabel } from '@/lib/user-meta';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { RoleBadge } from './components/RoleBadge';
import { UserForm } from './components/UserForm';

const copy = {
  fa: {
    title: 'کاربران سیستم',
    subtitle: 'حساب‌های ورود مدیر، داروساز و صندوقدار را از این بخش مدیریت کنید.',
    addUser: 'کاربر جدید',
    searchPlaceholder: 'جستجو با نام یا نام کاربری...',
    allRoles: 'همه نقش‌ها',
    allStatuses: 'همه وضعیت‌ها',
    active: 'فعال',
    inactive: 'غیرفعال',
    name: 'نام',
    username: 'نام کاربری',
    role: 'نقش',
    phone: 'تلفن',
    status: 'وضعیت',
    lastLogin: 'آخرین ورود',
    actions: 'عملیات',
    edit: 'ویرایش',
    resetPassword: 'بازنشانی رمز',
    activate: 'فعال‌سازی',
    deactivate: 'غیرفعال‌سازی',
    delete: 'حذف',
    noUsers: 'هیچ کاربری یافت نشد.',
    loading: 'در حال بارگذاری کاربران...',
    failed: 'بارگذاری کاربران موفق نشد.',
    never: 'هنوز وارد نشده',
    previous: 'قبلی',
    next: 'بعدی',
    page: 'صفحه',
    accessDenied: 'فقط مدیر سیستم می‌تواند کاربران را ببیند.',
    deleteConfirm: 'این حساب به صورت نرم غیرفعال می‌شود. ادامه می‌دهید؟',
    createdToast: 'کاربر {username} با موفقیت ایجاد شد.',
    updatedToast: 'اطلاعات کاربر {username} ذخیره شد.',
    resetToast: 'رمز عبور {username} بازنشانی شد.',
    toggleOnToast: 'حساب {username} فعال شد.',
    toggleOffToast: 'حساب {username} غیرفعال شد.',
    deletedToast: 'حساب {username} غیرفعال شد.',
  },
  ps: {
    title: 'د سیستم کارونکي',
    subtitle: 'د ادمین، درملساز او کیسه وال د ننوتلو حسابونه له همدې برخې اداره کړئ.',
    addUser: 'نوی کارن',
    searchPlaceholder: 'د نوم یا د کارونکي نوم له مخې لټون...',
    allRoles: 'ټول نقشونه',
    allStatuses: 'ټول حالتونه',
    active: 'فعال',
    inactive: 'غیرفعال',
    name: 'نوم',
    username: 'د کارونکي نوم',
    role: 'نقش',
    phone: 'ټیلیفون',
    status: 'حالت',
    lastLogin: 'وروستی ننوتل',
    actions: 'عملیات',
    edit: 'سمول',
    resetPassword: 'پټنوم بیا ټاکل',
    activate: 'فعالول',
    deactivate: 'غیرفعالول',
    delete: 'حذف',
    noUsers: 'هیڅ کارن ونه موندل شو.',
    loading: 'کارنان بارېږي...',
    failed: 'کارنان بار نه شول.',
    never: 'لا تر اوسه نه دی ننوتی',
    previous: 'مخکینی',
    next: 'بل',
    page: 'پاڼه',
    accessDenied: 'یوازې ادمین د کاروونکو لیدلو اجازه لري.',
    deleteConfirm: 'دا حساب به نرم ډول غیرفعال شي. دوام ورکوئ؟',
    createdToast: 'کارن {username} په بریالیتوب جوړ شو.',
    updatedToast: 'د {username} معلومات خوندي شول.',
    resetToast: 'د {username} پټنوم بیا وټاکل شو.',
    toggleOnToast: 'د {username} حساب فعال شو.',
    toggleOffToast: 'د {username} حساب غیرفعال شو.',
    deletedToast: 'د {username} حساب غیرفعال شو.',
  },
  en: {
    title: 'System Users',
    subtitle: 'Manage Admin, Pharmacist, and Cashier login accounts from one place.',
    addUser: 'Add New User',
    searchPlaceholder: 'Search by name or username...',
    allRoles: 'All Roles',
    allStatuses: 'All Statuses',
    active: 'Active',
    inactive: 'Inactive',
    name: 'Name',
    username: 'Username',
    role: 'Role',
    phone: 'Phone',
    status: 'Status',
    lastLogin: 'Last Login',
    actions: 'Actions',
    edit: 'Edit',
    resetPassword: 'Reset Password',
    activate: 'Activate',
    deactivate: 'Deactivate',
    delete: 'Delete',
    noUsers: 'No users found.',
    loading: 'Loading users...',
    failed: 'Failed to load users.',
    never: 'Never logged in',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    accessDenied: 'Only admins can view system users.',
    deleteConfirm: 'This will soft-delete the account by deactivating it. Continue?',
    createdToast: 'User {username} was created successfully.',
    updatedToast: 'Saved updates for {username}.',
    resetToast: 'Password was reset for {username}.',
    toggleOnToast: 'Activated {username}.',
    toggleOffToast: 'Deactivated {username}.',
    deletedToast: 'Deactivated {username}.',
  },
};

function formatMessage(template: string, username: string) {
  return template.replace('{username}', username);
}

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const locale = getLocaleFromLanguage(user?.language);
  const dir = getDirectionFromLanguage(user?.language);
  const tr = copy[locale];
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'PHARMACIST' | 'CASHIER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { users, meta, isLoading, error, refresh } = useUsers({
    search: deferredSearch,
    page,
    limit: 10,
    role: roleFilter,
    status: statusFilter,
    enabled: isAdmin,
  });

  const totalPages = meta?.totalPages ?? 1;

  const headings = useMemo(
    () => [tr.name, tr.username, tr.role, tr.phone, tr.status, tr.lastLogin, tr.actions],
    [tr.actions, tr.lastLogin, tr.name, tr.phone, tr.role, tr.status, tr.username]
  );

  const formatDate = (value: string | null) => {
    if (!value) {
      return tr.never;
    }

    return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
  };

  if (authLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center text-sm text-slate-500" dir={dir}>
        {tr.loading}
      </div>
    );
  }

  if (!isAdmin) {
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
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
          className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          {tr.addUser}
        </button>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),220px,220px]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={tr.searchPlaceholder}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as typeof roleFilter);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">{tr.allRoles}</option>
            <option value="ADMIN">{getRoleLabel('ADMIN', locale)}</option>
            <option value="PHARMACIST">{getRoleLabel('PHARMACIST', locale)}</option>
            <option value="CASHIER">{getRoleLabel('CASHIER', locale)}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setPage(1);
            }}
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
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">{tr.noUsers}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headings.map((heading) => (
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
                {users.map((row) => (
                  <tr key={row.id} className={!row.isActive ? 'bg-slate-50/70 text-slate-400' : 'bg-white'}>
                    <td className={`px-4 py-3 font-semibold ${!row.isActive ? 'line-through' : 'text-slate-900'}`}>
                      {row.name}
                    </td>
                    <td className={`px-4 py-3 ${!row.isActive ? 'line-through' : 'text-slate-700'}`}>
                      {row.username}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={row.role} language={locale} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.phone ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {row.isActive ? tr.active : tr.inactive}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(row.lastLogin)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(row);
                            setShowForm(true);
                          }}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          {tr.edit}
                        </button>
                        <button
                          onClick={() => setResettingUser(row)}
                          className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200"
                        >
                          {tr.resetPassword}
                        </button>
                        <button
                          onClick={async () => {
                            const response = await toggleUserActive(row.id);

                            if (response.success) {
                              await refresh();
                              setToast({
                                type: 'success',
                                message: formatMessage(
                                  row.isActive ? tr.toggleOffToast : tr.toggleOnToast,
                                  row.username
                                ),
                              });
                              return;
                            }

                            setToast({
                              type: 'error',
                              message: response.message || 'Failed to change status',
                            });
                          }}
                          className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200"
                        >
                          {row.isActive ? tr.deactivate : tr.activate}
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm(tr.deleteConfirm)) {
                              return;
                            }

                            const response = await deactivateUser(row.id);

                            if (response.success) {
                              await refresh();
                              setToast({
                                type: 'success',
                                message: formatMessage(tr.deletedToast, row.username),
                              });
                              return;
                            }

                            setToast({
                              type: 'error',
                              message: response.message || 'Failed to delete user',
                            });
                          }}
                          className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200"
                        >
                          {tr.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">
            {tr.page} {meta?.page ?? 1} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tr.previous}
            </button>
            <button
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tr.next}
            </button>
          </div>
        </div>
      </section>

      {showForm ? (
        <UserForm
          language={locale}
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSubmit={async ({ user: formData, resetPassword: passwordReset }) => {
            const payload: UserFormData = {
              ...formData,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            };

            const response = editingUser
              ? await updateUser(editingUser.id, payload)
              : await createUser(payload);

            if (!response.success) {
              return response;
            }

            if (editingUser && passwordReset) {
              const passwordResponse = await resetUserPassword(editingUser.id, passwordReset);

              if (!passwordResponse.success) {
                return {
                  success: false,
                  message: passwordResponse.message,
                };
              }
            }

            await refresh();
            setToast({
              type: 'success',
              message: formatMessage(
                editingUser ? tr.updatedToast : tr.createdToast,
                response.data?.username ?? payload.username
              ),
            });

            return response;
          }}
        />
      ) : null}

      {resettingUser ? (
        <ResetPasswordModal
          language={locale}
          username={resettingUser.username}
          onClose={() => setResettingUser(null)}
          onSubmit={async (data) => {
            const response = await resetUserPassword(resettingUser.id, data);

            if (response.success) {
              setToast({
                type: 'success',
                message: formatMessage(tr.resetToast, resettingUser.username),
              });
            }

            return response;
          }}
        />
      ) : null}
    </div>
  );
}
