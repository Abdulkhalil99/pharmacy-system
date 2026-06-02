'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AtSign,
  Check,
  CheckCircle2,
  KeyRound,
  Languages,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
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
const inputBase =
  'h-12 w-full rounded-xl border bg-white px-10 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10';
const inputNormal = 'border-slate-200 hover:border-slate-300';
const inputError = 'border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-red-400/10';
const iconClass = 'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 start-3';

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
    errors[key] ? (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {errors[key]}
      </p>
    ) : null;

  const fieldClass = (key?: string) => `${inputBase} ${key && errors[key] ? inputError : inputNormal}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-md sm:p-6" dir={dir}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="relative overflow-hidden border-b border-slate-200 bg-slate-900 px-5 py-5 text-white sm:px-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-300 to-red-400" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <UserRound className="h-6 w-6 text-teal-200" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-normal sm:text-2xl">{isEdit ? tr.edit : tr.add}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">{tr.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tr.cancel}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-112px)] overflow-y-auto">
          <div className="space-y-6 px-5 py-6 sm:px-7">
          {apiError ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {apiError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tr.fullName}</label>
              <div className="relative">
                <UserRound className={iconClass} />
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={fieldClass('name')}
                />
              </div>
              {renderError('name')}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tr.username}</label>
              <div className="relative">
                <AtSign className={iconClass} />
                <input
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  className={`${fieldClass('username')} ${usernameState.available === true ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10' : ''}`}
                />
                {usernameState.checking ? (
                  <Loader2 className="absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400 end-3" />
                ) : usernameState.available === true ? (
                  <CheckCircle2 className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 end-3" />
                ) : null}
              </div>
              {usernameState.checking ? (
                <p className="mt-2 text-xs font-medium text-slate-500">{tr.checking}</p>
              ) : null}
              {!usernameState.checking && usernameState.available === true ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  {tr.usernameAvailable}
                </p>
              ) : null}
              {!errors.username && !usernameState.checking && usernameState.available === false ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {tr.usernameTaken}
                </p>
              ) : null}
              {renderError('username')}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                {tr.role}
              </label>
              <div className={`grid grid-cols-3 gap-2 rounded-xl border p-1.5 ${errors.role ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                {roles.map((role) => {
                  const selected = form.role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setForm((current) => ({ ...current, role }))}
                      className={`min-h-10 rounded-lg px-2 text-xs font-bold transition-all sm:text-sm ${
                        selected
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {getRoleLabel(role, locale)}
                    </button>
                  );
                })}
              </div>
              {renderError('role')}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Languages className="h-4 w-4 text-slate-400" />
                {tr.language}
              </label>
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                {languages.map((option) => {
                  const selected = form.language === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setForm((current) => ({ ...current, language: option }))}
                      className={`min-h-10 rounded-lg px-2 text-xs font-bold transition-all sm:text-sm ${
                        selected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {getLanguageLabel(option, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tr.phone}</label>
              <div className="relative">
                <Phone className={iconClass} />
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className={fieldClass()}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{tr.email}</label>
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className={fieldClass()}
                />
              </div>
            </div>
          </div>

          {isEdit ? (
            <button
              type="button"
              onClick={() => setChangePassword((current) => !current)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                changePassword
                  ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              {tr.changePassword}
            </button>
          ) : null}

          {!isEdit || changePassword ? (
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tr.password}</label>
                <div className="relative">
                  <LockKeyhole className={iconClass} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className={fieldClass('password')}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">{tr.passwordHint}</p>
                {renderError('password')}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tr.confirmPassword}</label>
                <div className="relative">
                  <KeyRound className={iconClass} />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    className={fieldClass('confirmPassword')}
                  />
                </div>
                {renderError('confirmPassword')}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${form.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <CheckCircle2 className="h-4 w-4" />
              </span>
              {tr.isActive}
            </span>
            <button
              type="button"
              aria-label={tr.isActive}
              aria-pressed={form.isActive}
              onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                form.isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  form.isActive ? 'start-7' : 'start-1'
                }`}
              />
            </button>
          </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              {tr.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:bg-slate-400"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isSaving ? tr.saving : tr.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
