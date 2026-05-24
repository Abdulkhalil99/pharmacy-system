'use client';

import { useEffect, useState } from 'react';
import type { UserApiResponse, UserFormData, UserRecord } from '@/hooks/useUsers';
import { checkUsernameAvailability } from '@/hooks/useUsers';
import {
  getDirectionFromLanguage,
  getLanguageLabel,
  getLocaleFromLanguage,
  getRoleLabel,
  type SystemLanguage,
  type SystemUserRole,
} from '@/lib/user-meta';

interface UserFormSubmitPayload {
  user: UserFormData;
  resetPassword?: {
    newPassword: string;
    confirmPassword: string;
  };
}

interface UserFormProps {
  language?: string;
  user?: UserRecord | null;
  onSubmit: (data: UserFormSubmitPayload) => UserApiResponse<UserRecord>;
  onClose: () => void;
}

const roles: SystemUserRole[] = ['ADMIN', 'PHARMACIST', 'CASHIER'];
const languages: SystemLanguage[] = ['en', 'fa', 'ps'];

const copy = {
  fa: {
    add: 'کاربر جدید',
    edit: 'ویرایش کاربر',
    subtitle: 'حساب‌های ورود سیستم را با نقش، زبان و وضعیت فعال‌بودن مدیریت کنید.',
    fullName: 'نام کامل',
    username: 'نام کاربری',
    password: 'رمز عبور',
    confirmPassword: 'تایید رمز عبور',
    role: 'نقش',
    phone: 'شماره تماس',
    email: 'ایمیل',
    language: 'زبان ترجیحی',
    isActive: 'فعال',
    changePassword: 'تغییر رمز عبور',
    save: 'ذخیره',
    cancel: 'انصراف',
    saving: 'در حال ذخیره...',
    passwordHint: 'حداقل ۶ کاراکتر',
    usernameAvailable: 'این نام کاربری قابل استفاده است.',
    usernameTaken: 'این نام کاربری قبلاً گرفته شده است.',
    checking: 'در حال بررسی...',
    requiredName: 'نام کامل الزامی است.',
    requiredUsername: 'نام کاربری الزامی است.',
    invalidUsername: 'نام کاربری فقط باید شامل حروف انگلیسی و اعداد باشد و فاصله نداشته باشد.',
    usernameTooShort: 'نام کاربری باید حداقل ۳ کاراکتر باشد.',
    passwordTooShort: 'رمز عبور باید حداقل ۶ کاراکتر باشد.',
    passwordMismatch: 'رمزهای عبور با هم مطابقت ندارند.',
    roleRequired: 'نقش الزامی است.',
  },
  ps: {
    add: 'نوی کارن',
    edit: 'د کارن سمول',
    subtitle: 'د سیستم د ننوتلو حسابونه د نقش، ژبې او فعال حالت سره مدیریت کړئ.',
    fullName: 'بشپړ نوم',
    username: 'د کارونکي نوم',
    password: 'پټنوم',
    confirmPassword: 'د پټنوم تایید',
    role: 'نقش',
    phone: 'د تماس شمېره',
    email: 'ایمیل',
    language: 'غوره ژبه',
    isActive: 'فعال',
    changePassword: 'پټنوم بدلول',
    save: 'خوندي کول',
    cancel: 'لغوه',
    saving: 'خوندي کېږي...',
    passwordHint: 'لږ تر لږه ۶ توري',
    usernameAvailable: 'دغه د کارونکي نوم شته.',
    usernameTaken: 'دغه د کارونکي نوم مخکې اخیستل شوی دی.',
    checking: 'کتل کېږي...',
    requiredName: 'بشپړ نوم اړین دی.',
    requiredUsername: 'د کارونکي نوم اړین دی.',
    invalidUsername: 'د کارونکي نوم باید یوازې انګلیسي حروف او شمېرې ولري او تشه ونه لري.',
    usernameTooShort: 'د کارونکي نوم باید لږ تر لږه ۳ توري ولري.',
    passwordTooShort: 'پټنوم باید لږ تر لږه ۶ توري ولري.',
    passwordMismatch: 'پټنومونه سره نه سمون خوري.',
    roleRequired: 'نقش اړین دی.',
  },
  en: {
    add: 'Add User',
    edit: 'Edit User',
    subtitle: 'Manage login accounts with role, preferred language, and active status.',
    fullName: 'Full Name',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    role: 'Role',
    phone: 'Phone Number',
    email: 'Email',
    language: 'Preferred Language',
    isActive: 'Is Active',
    changePassword: 'Change Password',
    save: 'Save User',
    cancel: 'Cancel',
    saving: 'Saving...',
    passwordHint: 'Minimum 6 characters',
    usernameAvailable: 'This username is available.',
    usernameTaken: 'This username is already taken.',
    checking: 'Checking...',
    requiredName: 'Full name is required.',
    requiredUsername: 'Username is required.',
    invalidUsername: 'Username must use letters and numbers only, with no spaces.',
    usernameTooShort: 'Username must be at least 3 characters.',
    passwordTooShort: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    roleRequired: 'Role is required.',
  },
};

const usernamePattern = /^[A-Za-z0-9]+$/;

export function UserForm({ language, user, onSubmit, onClose }: UserFormProps) {
  const locale = getLocaleFromLanguage(language);
  const dir = getDirectionFromLanguage(language);
  const tr = copy[locale];
  const isEdit = Boolean(user);

  const [form, setForm] = useState<UserFormData>({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'PHARMACIST',
    phone: '',
    email: '',
    language: locale,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [usernameState, setUsernameState] = useState<{
    checking: boolean;
    available: boolean | null;
  }>({
    checking: false,
    available: null,
  });

  useEffect(() => {
    if (!user) {
      setForm({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'PHARMACIST',
        phone: '',
        email: '',
        language: locale,
        isActive: true,
      });
      setChangePassword(false);
      return;
    }

    setForm({
      name: user.name,
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role,
      phone: user.phone ?? '',
      email: user.email ?? '',
      language: user.language,
      isActive: user.isActive,
    });
    setChangePassword(false);
  }, [locale, user]);

  useEffect(() => {
    const username = form.username.trim();
    const originalUsername = user?.username ?? '';

    if (!username || username === originalUsername || username.length < 3 || !usernamePattern.test(username)) {
      setUsernameState({
        checking: false,
        available: null,
      });
      return;
    }

    const timer = window.setTimeout(async () => {
      setUsernameState({
        checking: true,
        available: null,
      });

      const response = await checkUsernameAvailability(username, user?.id);
      setUsernameState({
        checking: false,
        available: response.success && response.data ? response.data.available : null,
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.username, user?.id, user?.username]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const username = form.username.trim();
    const shouldValidatePassword = !isEdit || changePassword;

    if (!form.name.trim()) {
      nextErrors.name = tr.requiredName;
    }

    if (!username) {
      nextErrors.username = tr.requiredUsername;
    } else if (username.length < 3) {
      nextErrors.username = tr.usernameTooShort;
    } else if (!usernamePattern.test(username)) {
      nextErrors.username = tr.invalidUsername;
    } else if (usernameState.available === false) {
      nextErrors.username = tr.usernameTaken;
    }

    if (!form.role) {
      nextErrors.role = tr.roleRequired;
    }

    if (shouldValidatePassword) {
      if (!form.password || form.password.length < 6) {
        nextErrors.password = tr.passwordTooShort;
      }

      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = tr.passwordMismatch;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setApiError('');
    setIsSaving(true);

    const response = await onSubmit({
      user: {
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        language: form.language,
        isActive: form.isActive,
      },
      resetPassword:
        isEdit && changePassword
          ? {
              newPassword: form.password ?? '',
              confirmPassword: form.confirmPassword ?? '',
            }
          : undefined,
    });

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to save user');
    }

    setIsSaving(false);
  };

  const renderError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p> : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" dir={dir}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isEdit ? tr.edit : tr.add}</h2>
              <p className="mt-1 text-sm text-slate-500">{tr.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {apiError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.fullName}</label>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className={`w-full rounded-2xl border px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {renderError('name')}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.username}</label>
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                className={`w-full rounded-2xl border px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.username ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {usernameState.checking ? (
                <p className="mt-1 text-xs text-slate-500">{tr.checking}</p>
              ) : null}
              {!usernameState.checking && usernameState.available === true ? (
                <p className="mt-1 text-xs text-emerald-600">{tr.usernameAvailable}</p>
              ) : null}
              {!errors.username && !usernameState.checking && usernameState.available === false ? (
                <p className="mt-1 text-xs text-red-500">{tr.usernameTaken}</p>
              ) : null}
              {renderError('username')}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.role}</label>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value as SystemUserRole }))
                }
                className={`w-full rounded-2xl border px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.role ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role, locale)}
                  </option>
                ))}
              </select>
              {renderError('role')}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.language}</label>
              <select
                value={form.language}
                onChange={(event) =>
                  setForm((current) => ({ ...current, language: event.target.value as SystemLanguage }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {languages.map((option) => (
                  <option key={option} value={option}>
                    {getLanguageLabel(option, locale)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.phone}</label>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {isEdit ? (
            <button
              type="button"
              onClick={() => setChangePassword((current) => !current)}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              {tr.changePassword}
            </button>
          ) : null}

          {!isEdit || changePassword ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{tr.password}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className={`w-full rounded-2xl border px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                <p className="mt-1 text-xs text-slate-500">{tr.passwordHint}</p>
                {renderError('password')}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{tr.confirmPassword}</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  className={`w-full rounded-2xl border px-3 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                {renderError('confirmPassword')}
              </div>
            </div>
          ) : null}

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">{tr.isActive}</span>
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                form.isActive ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                  form.isActive ? 'start-6' : 'start-1'
                }`}
              />
            </button>
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {tr.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-slate-400"
            >
              {isSaving ? tr.saving : tr.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
