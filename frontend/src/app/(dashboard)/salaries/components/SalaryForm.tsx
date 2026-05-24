'use client';

import { useState } from 'react';
import { SalaryApiResponse, SalaryPaymentFormData } from '@/hooks/useSalaries';

type Locale = 'fa' | 'ps' | 'en';

interface SalaryFormProps {
  locale: Locale;
  employees: Array<{
    id: string;
    fullName: string;
    role: string;
    isActive: boolean;
  }>;
  initialEmployeeId?: string;
  onSubmit: (data: SalaryPaymentFormData) => SalaryApiResponse<unknown>;
  onClose: () => void;
}

const copy = {
  fa: {
    title: 'ثبت معاش',
    subtitle: 'پس از ثبت معاش، یک مصرف با دسته بندی معاش نیز به طور خودکار ساخته می شود.',
    employeeName: 'کارمند',
    amount: 'مبلغ',
    month: 'ماه',
    year: 'سال',
    note: 'یادداشت',
    employeePlaceholder: 'کارمند را انتخاب کنید',
    cancel: 'انصراف',
    submit: 'ثبت معاش',
    submitting: 'در حال ثبت...',
  },
  ps: {
    title: 'د معاش ثبت',
    subtitle: 'د معاش له ثبت وروسته د معاش په کټګورۍ کې یو لګښت هم په اوتومات ډول جوړېږي.',
    employeeName: 'کارکوونکی',
    amount: 'مبلغ',
    month: 'میاشت',
    year: 'کال',
    note: 'یادښت',
    employeePlaceholder: 'کارکوونکی وټاکئ',
    cancel: 'لغوه',
    submit: 'معاش ثبتول',
    submitting: 'ثبتېږي...',
  },
  en: {
    title: 'Pay Salary',
    subtitle: 'Saving a salary payment also creates an expense entry in the Salary category.',
    employeeName: 'Employee',
    amount: 'Amount',
    month: 'Month',
    year: 'Year',
    note: 'Note',
    employeePlaceholder: 'Choose an employee',
    cancel: 'Cancel',
    submit: 'Record Salary',
    submitting: 'Submitting...',
  },
};

export function SalaryForm({
  locale,
  employees,
  initialEmployeeId,
  onSubmit,
  onClose,
}: SalaryFormProps) {
  const tr = copy[locale];
  const now = new Date();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId ?? '');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [note, setNote] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');
    setIsSubmitting(true);

    const response = await onSubmit({
      employeeId: employeeId || undefined,
      amount: Number(amount),
      month: Number(month),
      year: Number(year),
      note: note.trim() || undefined,
    });

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to record salary payment');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tr.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{tr.subtitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {apiError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.employeeName}</label>
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">{tr.employeePlaceholder}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.amount}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.month}</label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.year}</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.note}</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {tr.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
            >
              {isSubmitting ? tr.submitting : tr.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
