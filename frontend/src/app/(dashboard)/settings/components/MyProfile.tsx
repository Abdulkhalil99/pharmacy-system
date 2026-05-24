'use client';

import { useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { changeOwnPassword, updateUser } from '@/hooks/useUsers';
import {
  getDirectionFromLanguage,
  getLanguageLabel,
  getLocaleFromLanguage,
  type SystemLanguage,
} from '@/lib/user-meta';
import { RoleBadge } from '../../users/components/RoleBadge';

const languages: SystemLanguage[] = ['en', 'fa', 'ps'];

const copy = {
  fa: {
    title: 'پروفایل من',
    subtitle: 'اطلاعات حساب خود را ببینید، رمز عبور را تغییر دهید و زبان دلخواه را تنظیم کنید.',
    name: 'نام',
    username: 'نام کاربری',
    role: 'نقش',
    language: 'زبان',
    lastLogin: 'آخرین ورود',
    never: 'هنوز وارد نشده',
    changePassword: 'تغییر رمز عبور من',
    currentPassword: 'رمز عبور فعلی',
    newPassword: 'رمز عبور جدید',
    confirmPassword: 'تایید رمز عبور جدید',
    savePassword: 'ذخیره رمز عبور',
    saving: 'در حال ذخیره...',
    passwordChanged: 'رمز عبور شما با موفقیت تغییر کرد.',
    languageChanged: 'زبان شما به‌روزرسانی شد.',
  },
  ps: {
    title: 'زما پروفایل',
    subtitle: 'خپل حساب وګورئ، پټنوم بدل کړئ، او غوره ژبه وټاکئ.',
    name: 'نوم',
    username: 'د کارونکي نوم',
    role: 'نقش',
    language: 'ژبه',
    lastLogin: 'وروستی ننوتل',
    never: 'لا تر اوسه نه دی ننوتی',
    changePassword: 'زما پټنوم بدلول',
    currentPassword: 'اوسنی پټنوم',
    newPassword: 'نوی پټنوم',
    confirmPassword: 'د نوي پټنوم تایید',
    savePassword: 'پټنوم خوندي کول',
    saving: 'خوندي کېږي...',
    passwordChanged: 'ستاسو پټنوم په بریالیتوب بدل شو.',
    languageChanged: 'ستاسو ژبه تازه شوه.',
  },
  en: {
    title: 'My Profile',
    subtitle: 'Review your account, change your password, and update your preferred language.',
    name: 'Name',
    username: 'Username',
    role: 'Role',
    language: 'Language',
    lastLogin: 'Last Login',
    never: 'Never logged in',
    changePassword: 'Change My Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    savePassword: 'Save Password',
    saving: 'Saving...',
    passwordChanged: 'Your password was changed successfully.',
    languageChanged: 'Your language preference was updated.',
  },
};

export function MyProfile() {
  const { user, refreshUser, setLanguage } = useAuth();
  const locale = getLocaleFromLanguage(user?.language);
  const dir = getDirectionFromLanguage(user?.language);
  const tr = copy[locale];

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!user) {
    return null;
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return tr.never;
    }

    return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
  };

  return (
    <div className="space-y-6" dir={dir}>
      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}

      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{tr.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">{tr.subtitle}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{tr.name}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user.name}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{tr.username}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user.username}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{tr.role}</p>
            <div className="mt-2">
              <RoleBadge role={user.role} language={locale} />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{tr.lastLogin}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(user.lastLogin)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">{tr.language}</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={user.language}
              onChange={async (event) => {
                const nextLanguage = event.target.value as SystemLanguage;
                setIsSavingLanguage(true);
                const response = await updateUser(user.id, { language: nextLanguage });

                if (response.success) {
                  setLanguage(nextLanguage);
                  await refreshUser();
                  setToast({
                    type: 'success',
                    message: tr.languageChanged,
                  });
                } else {
                  setToast({
                    type: 'error',
                    message: response.message || 'Failed to update language',
                  });
                }

                setIsSavingLanguage(false);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isSavingLanguage}
            >
              {languages.map((option) => (
                <option key={option} value={option}>
                  {getLanguageLabel(option, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{tr.changePassword}</h2>
          <button
            type="button"
            onClick={() => setShowPasswordForm((current) => !current)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {tr.changePassword}
          </button>
        </div>

        {showPasswordForm ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsSavingPassword(true);

              const response = await changeOwnPassword(user.id, passwordForm);

              if (response.success) {
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                setShowPasswordForm(false);
                setToast({
                  type: 'success',
                  message: tr.passwordChanged,
                });
              } else {
                setToast({
                  type: 'error',
                  message: response.message || 'Failed to change password',
                });
              }

              setIsSavingPassword(false);
            }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{tr.currentPassword}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{tr.newPassword}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{tr.confirmPassword}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-slate-400"
            >
              {isSavingPassword ? tr.saving : tr.savePassword}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
