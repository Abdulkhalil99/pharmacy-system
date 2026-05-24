'use client';

import { useEffect, useState } from 'react';
import type { EmployeeApiResponse, EmployeeFormData, EmployeeRecord } from '@/hooks/useEmployees';
import { getDirectionFromLanguage, getLocaleFromLanguage } from '@/lib/user-meta';

interface EmployeeFormProps {
  language?: string;
  employee?: EmployeeRecord | null;
  onSubmit: (data: EmployeeFormData) => EmployeeApiResponse<EmployeeRecord>;
  onClose: () => void;
}

const copy = {
  fa: {
    add: 'افزودن کارمند',
    edit: 'ویرایش کارمند',
    subtitle: 'اطلاعات پرسونل، وظیفه و معاش ماهوار را برای مدیریت منابع بشری نگهداری کنید.',
    fullName: 'نام کامل',
    phone: 'شماره تماس',
    email: 'ایمیل',
    role: 'سمت / وظیفه',
    salary: 'معاش ماهوار',
    joinDate: 'تاریخ شروع کار',
    isActive: 'فعال',
    save: 'ذخیره',
    cancel: 'انصراف',
    saving: 'در حال ذخیره...',
    requiredName: 'نام کامل الزامی است.',
    requiredPhone: 'شماره تماس الزامی است.',
    requiredRole: 'سمت الزامی است.',
    requiredSalary: 'معاش الزامی است.',
    requiredJoinDate: 'تاریخ شروع کار الزامی است.',
  },
  ps: {
    add: 'کارکوونکی زیاتول',
    edit: 'د کارکوونکي سمول',
    subtitle: 'د پرسونل، دندې او میاشتني معاش معلومات د بشري سرچینو لپاره وساتئ.',
    fullName: 'بشپړ نوم',
    phone: 'د تماس شمېره',
    email: 'ایمیل',
    role: 'سمت / دنده',
    salary: 'میاشتنی معاش',
    joinDate: 'د کار پیل نېټه',
    isActive: 'فعال',
    save: 'خوندي کول',
    cancel: 'لغوه',
    saving: 'خوندي کېږي...',
    requiredName: 'بشپړ نوم اړین دی.',
    requiredPhone: 'د تماس شمېره اړینه ده.',
    requiredRole: 'سمت اړین دی.',
    requiredSalary: 'معاش اړین دی.',
    requiredJoinDate: 'د کار پیل نېټه اړینه ده.',
  },
  en: {
    add: 'Add Employee',
    edit: 'Edit Employee',
    subtitle: 'Keep staff records, job titles, and monthly salary expectations in one place.',
    fullName: 'Full Name',
    phone: 'Phone Number',
    email: 'Email',
    role: 'Position / Role',
    salary: 'Monthly Salary',
    joinDate: 'Join Date',
    isActive: 'Is Active',
    save: 'Save Employee',
    cancel: 'Cancel',
    saving: 'Saving...',
    requiredName: 'Full name is required.',
    requiredPhone: 'Phone number is required.',
    requiredRole: 'Role is required.',
    requiredSalary: 'Monthly salary is required.',
    requiredJoinDate: 'Join date is required.',
  },
};

export function EmployeeForm({
  language,
  employee,
  onSubmit,
  onClose,
}: EmployeeFormProps) {
  const locale = getLocaleFromLanguage(language);
  const dir = getDirectionFromLanguage(language);
  const tr = copy[locale];
  const isEdit = Boolean(employee);

  const [form, setForm] = useState<EmployeeFormData>({
    fullName: '',
    phone: '',
    email: '',
    role: '',
    salary: 0,
    joinDate: '',
    isActive: true,
  });
  const [salaryInput, setSalaryInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!employee) {
      setForm({
        fullName: '',
        phone: '',
        email: '',
        role: '',
        salary: 0,
        joinDate: '',
        isActive: true,
      });
      setSalaryInput('');
      return;
    }

    setForm({
      fullName: employee.fullName,
      phone: employee.phone,
      email: employee.email ?? '',
      role: employee.role,
      salary: employee.salary,
      joinDate: employee.joinDate.slice(0, 10),
      isActive: employee.isActive,
    });
    setSalaryInput(String(employee.salary));
  }, [employee]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = tr.requiredName;
    }

    if (!form.phone.trim()) {
      nextErrors.phone = tr.requiredPhone;
    }

    if (!form.role.trim()) {
      nextErrors.role = tr.requiredRole;
    }

    if (!salaryInput.trim()) {
      nextErrors.salary = tr.requiredSalary;
    }

    if (!form.joinDate) {
      nextErrors.joinDate = tr.requiredJoinDate;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...form,
      salary: Number(salaryInput || 0),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || undefined,
      role: form.role.trim(),
    };

    if (!validate()) {
      return;
    }

    setApiError('');
    setIsSaving(true);

    const response = await onSubmit(payload);

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to save employee');
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" dir={dir}>
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
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
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                className={`w-full rounded-2xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.fullName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.fullName ? <p className="mt-1 text-xs text-red-500">{errors.fullName}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.phone}</label>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className={`w-full rounded-2xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.phone ? <p className="mt-1 text-xs text-red-500">{errors.phone}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.role}</label>
              <input
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                className={`w-full rounded-2xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.role ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.role ? <p className="mt-1 text-xs text-red-500">{errors.role}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.salary}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={salaryInput}
                onChange={(event) => setSalaryInput(event.target.value)}
                className={`w-full rounded-2xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.salary ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.salary ? <p className="mt-1 text-xs text-red-500">{errors.salary}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.joinDate}</label>
              <input
                type="date"
                value={form.joinDate}
                onChange={(event) => setForm((current) => ({ ...current, joinDate: event.target.value }))}
                className={`w-full rounded-2xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.joinDate ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.joinDate ? <p className="mt-1 text-xs text-red-500">{errors.joinDate}</p> : null}
            </div>
          </div>

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
