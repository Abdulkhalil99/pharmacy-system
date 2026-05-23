'use client';

import { useEffect, useState } from 'react';
import {
  ExpenseApiResponse,
  ExpenseCategory,
  ExpenseFormData,
  ExpenseRecord,
  EXPENSE_CATEGORIES,
  getExpenseCategoryLabel,
  Locale,
} from '@/hooks/useExpenses';

interface ExpenseFormProps {
  locale: Locale;
  expense?: ExpenseRecord | null;
  onSubmit: (data: ExpenseFormData) => ExpenseApiResponse<ExpenseRecord>;
  onClose: () => void;
}

const copy = {
  fa: {
    add: 'ثبت مصرف جدید',
    edit: 'ویرایش مصرف',
    subtitle: 'مصارف روزانه دواخانه را با دسته بندی درست ثبت کنید.',
    category: 'دسته بندی',
    amount: 'مبلغ',
    description: 'توضیحات',
    date: 'تاریخ',
    save: 'ذخیره',
    cancel: 'انصراف',
    saving: 'در حال ذخیره...',
    amountRequired: 'مبلغ باید بیشتر از صفر باشد.',
  },
  ps: {
    add: 'نوی لګښت ثبتول',
    edit: 'لګښت سمول',
    subtitle: 'د دواخانې ورځني لګښتونه په سمه کټګورۍ کې ثبت کړئ.',
    category: 'کټګوري',
    amount: 'مبلغ',
    description: 'تشریح',
    date: 'نېټه',
    save: 'خوندي کول',
    cancel: 'لغوه',
    saving: 'خوندي کېږي...',
    amountRequired: 'مبلغ باید له صفر زیاته وي.',
  },
  en: {
    add: 'Add Expense',
    edit: 'Edit Expense',
    subtitle: 'Record daily pharmacy expenses with the correct category.',
    category: 'Category',
    amount: 'Amount',
    description: 'Description',
    date: 'Date',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
    amountRequired: 'Amount must be greater than zero.',
  },
};

export function ExpenseForm({
  locale,
  expense,
  onSubmit,
  onClose,
}: ExpenseFormProps) {
  const tr = copy[locale];
  const isEdit = Boolean(expense);

  const [category, setCategory] = useState<ExpenseCategory>('OTHER');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setDescription(expense.description ?? '');
      setDate(expense.date.slice(0, 10));
      return;
    }

    setCategory('OTHER');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().slice(0, 10));
  }, [expense]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setApiError(tr.amountRequired);
      return;
    }

    setIsSaving(true);

    const response = await onSubmit({
      category,
      amount: numericAmount,
      description: description.trim() || undefined,
      date,
    });

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to save expense');
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? tr.edit : tr.add}</h2>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.category}</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {EXPENSE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {getExpenseCategoryLabel(item, locale)}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.description}</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.date}</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
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
              disabled={isSaving}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
            >
              {isSaving ? tr.saving : tr.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
