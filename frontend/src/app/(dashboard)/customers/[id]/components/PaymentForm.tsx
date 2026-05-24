'use client';

import { useState } from 'react';
import { ApiResponse } from '@/lib/api';

type Locale = 'fa' | 'ps' | 'en';

interface PaymentFormProps {
  locale: Locale;
  customerName: string;
  currentDebt: number;
  onSubmit: (data: {
    amount: number;
    note?: string;
    date: string;
  }) => Promise<ApiResponse<unknown>>;
  onClose: () => void;
}

const copy = {
  fa: {
    title: 'ثبت پرداخت مشتری',
    subtitle: 'بعد از ثبت، بدهی باقی مانده مشتری به صورت خودکار کم می شود.',
    amount: 'مبلغ پرداخت',
    date: 'تاریخ',
    note: 'یادداشت',
    currentDebt: 'بدهی فعلی',
    afterPayment: 'بدهی بعد از پرداخت',
    cancel: 'انصراف',
    submit: 'ثبت پرداخت',
    submitting: 'در حال ثبت...',
    customer: 'مشتری',
    paymentTooLarge: 'مبلغ پرداخت نمی تواند بیشتر از بدهی فعلی باشد.',
    paymentRequired: 'مبلغ پرداخت باید بیشتر از صفر باشد.',
  },
  ps: {
    title: 'د پیرودونکي د پیسو ثبت',
    subtitle: 'له ثبت وروسته د پیرودونکي پاتې پور په اوتومات ډول کمېږي.',
    amount: 'د پیسو اندازه',
    date: 'نېټه',
    note: 'یادښت',
    currentDebt: 'اوسنی پور',
    afterPayment: 'له پیسو وروسته پور',
    cancel: 'لغوه',
    submit: 'پیسې ثبتول',
    submitting: 'ثبتېږي...',
    customer: 'پیرودونکی',
    paymentTooLarge: 'د پیسو اندازه له اوسني پور څخه زیاته نشي کېدای.',
    paymentRequired: 'د پیسو اندازه باید له صفر زیاته وي.',
  },
  en: {
    title: 'Record Customer Payment',
    subtitle: 'After saving, the customer’s remaining debt is reduced automatically.',
    amount: 'Payment Amount',
    date: 'Date',
    note: 'Note',
    currentDebt: 'Current Debt',
    afterPayment: 'Debt After Payment',
    cancel: 'Cancel',
    submit: 'Record Payment',
    submitting: 'Submitting...',
    customer: 'Customer',
    paymentTooLarge: 'Payment amount cannot be greater than the current debt.',
    paymentRequired: 'Payment amount must be greater than zero.',
  },
};

export function PaymentForm({
  locale,
  customerName,
  currentDebt,
  onSubmit,
  onClose,
}: PaymentFormProps) {
  const tr = copy[locale];
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = Number(amount) || 0;
  const remainingDebt = Math.max(currentDebt - numericAmount, 0);

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');

    if (numericAmount <= 0) {
      setApiError(tr.paymentRequired);
      return;
    }

    if (numericAmount > currentDebt) {
      setApiError(tr.paymentTooLarge);
      return;
    }

    setIsSubmitting(true);

    const response = await onSubmit({
      amount: numericAmount,
      note: note.trim() || undefined,
      date,
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
                {tr.customer}: {customerName}
              </p>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.amount}</label>
              <input
                type="number"
                min={0}
                max={currentDebt}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                {tr.currentDebt}
              </p>
              <p className="mt-2 text-2xl font-bold text-red-700">{formatMoney(currentDebt)}</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                {tr.afterPayment}
              </p>
              <p className="mt-2 text-2xl font-bold text-teal-700">{formatMoney(remainingDebt)}</p>
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
              disabled={isSubmitting || currentDebt <= 0}
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
