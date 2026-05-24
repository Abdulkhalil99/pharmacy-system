'use client';

import { useMemo, useState } from 'react';
import { ApiResponse } from '@/lib/api';
import { PaymentFormData } from '@/hooks/useCompanies';

interface Props {
  companyName: string;
  currentBalance: number;
  locale: 'fa' | 'ps' | 'en';
  onSubmit: (data: PaymentFormData) => Promise<ApiResponse<unknown>>;
  onClose: () => void;
}

const copy = {
  fa: {
    title: 'ثبت پرداخت به شرکت',
    subtitle: 'پس از پرداخت، بدهی شرکت به صورت خودکار کاهش می یابد.',
    amount: 'مبلغ پرداخت',
    date: 'تاریخ',
    note: 'یادداشت',
    currentBalance: 'بیلانس فعلی',
    afterPayment: 'بیلانس بعد از پرداخت',
    cancel: 'انصراف',
    submit: 'ثبت پرداخت',
    submitting: 'در حال ثبت...',
    supplier: 'شرکت',
  },
  ps: {
    title: 'شرکت ته د پیسو ثبت',
    subtitle: 'د پیسو له ثبت وروسته به بیلانس په اوتومات ډول کم شي.',
    amount: 'د پیسو اندازه',
    date: 'نېټه',
    note: 'یادښت',
    currentBalance: 'اوسنی بیلانس',
    afterPayment: 'له پیسو وروسته بیلانس',
    cancel: 'لغوه',
    submit: 'پیسې ثبتول',
    submitting: 'ثبتېږي...',
    supplier: 'شرکت',
  },
  en: {
    title: 'Record Payment',
    subtitle: 'After saving, the supplier balance is reduced automatically.',
    amount: 'Payment Amount',
    date: 'Date',
    note: 'Note',
    currentBalance: 'Current Balance',
    afterPayment: 'Balance After Payment',
    cancel: 'Cancel',
    submit: 'Record Payment',
    submitting: 'Submitting...',
    supplier: 'Supplier',
  },
};

export function PaymentForm({
  companyName,
  currentBalance,
  locale,
  onSubmit,
  onClose,
}: Props) {
  const tr = copy[locale];
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const balanceAfterPayment = useMemo(
    () => currentBalance - (Number(amount) || 0),
    [amount, currentBalance]
  );

  const formatMoney = (value: number) =>
    value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setIsSubmitting(true);

    const response = await onSubmit({
      amount: Number(amount),
      date,
      note: note.trim() || undefined,
    });

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to record payment');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tr.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{tr.subtitle}</p>
              <p className="mt-2 text-sm font-medium text-teal-700">
                {tr.supplier}: {companyName}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.amount}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                {tr.currentBalance}
              </p>
              <p className={`mt-2 text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-teal-700'}`}>
                {formatMoney(currentBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                {tr.afterPayment}
              </p>
              <p className={`mt-2 text-2xl font-bold ${balanceAfterPayment > 0 ? 'text-red-600' : 'text-teal-700'}`}>
                {formatMoney(balanceAfterPayment)}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
