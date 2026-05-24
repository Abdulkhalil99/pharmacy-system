'use client';

import { useState } from 'react';
import { ApiResponse } from '@/lib/api';
import {
  Locale,
  formatMoney,
  getTodayDateInputValue,
} from '../cash.shared';

interface TransferFormProps {
  locale: Locale;
  availableBalance: number;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    fromAccount: 'PHARMACY';
    toAccount: string;
    reason?: string;
    date: string;
  }) => Promise<ApiResponse<unknown>>;
}

const copy = {
  fa: {
    title: 'انتقال پول از صندوق',
    subtitle: 'این عملیات پول را از حساب دواخانه کم می کند و در گزارش روزانه ثبت می شود.',
    amount: 'مبلغ انتقال',
    toAccount: 'حساب مقصد',
    reason: 'دلیل انتقال',
    date: 'تاریخ',
    currentBalance: 'موجودی فعلی صندوق',
    remainingBalance: 'موجودی باقی مانده بعد از انتقال',
    cancel: 'انصراف',
    submit: 'ثبت انتقال',
    submitting: 'در حال ثبت...',
    reasonPlaceholder: 'مثلاً واریز به بانک یا انتقال به صندوق کوچک',
    toAccountPlaceholder: 'مثلاً BANK, SAFE, PETTY CASH',
    confirm: 'آیا مطمئن هستید که می خواهید این انتقال را ثبت کنید؟',
    exceedsBalance: 'مبلغ انتقال بیشتر از موجودی فعلی صندوق است.',
    amountRequired: 'مبلغ انتقال باید بیشتر از صفر باشد.',
  },
  ps: {
    title: 'له صندوق څخه د پیسو لېږد',
    subtitle: 'دا کار د دواخانې له حسابه پیسې کموي او په ورځني راپور کې ثبتېږي.',
    amount: 'د لېږد اندازه',
    toAccount: 'مقصد حساب',
    reason: 'د لېږد دلیل',
    date: 'نېټه',
    currentBalance: 'د صندوق اوسنۍ موجودي',
    remainingBalance: 'له لېږد وروسته پاتې موجودي',
    cancel: 'لغوه',
    submit: 'لېږد ثبتول',
    submitting: 'ثبتېږي...',
    reasonPlaceholder: 'لکه بانک ته اېښودل یا کوچني صندوق ته انتقال',
    toAccountPlaceholder: 'لکه BANK, SAFE, PETTY CASH',
    confirm: 'ایا تاسو ډاډه یاست چې دا لېږد ثبت کړئ؟',
    exceedsBalance: 'د لېږد اندازه د صندوق له موجودۍ زیاته ده.',
    amountRequired: 'د لېږد اندازه باید له صفر زیاته وي.',
  },
  en: {
    title: 'Transfer Money Out',
    subtitle: 'This moves cash out of the pharmacy account and records it in today’s report.',
    amount: 'Transfer Amount',
    toAccount: 'Destination Account',
    reason: 'Reason',
    date: 'Date',
    currentBalance: 'Current Cash Balance',
    remainingBalance: 'Remaining Balance After Transfer',
    cancel: 'Cancel',
    submit: 'Record Transfer',
    submitting: 'Saving...',
    reasonPlaceholder: 'For example: bank deposit or petty cash handoff',
    toAccountPlaceholder: 'For example: BANK, SAFE, PETTY CASH',
    confirm: 'Are you sure you want to record this transfer?',
    exceedsBalance: 'Transfer amount is greater than the available cash balance.',
    amountRequired: 'Transfer amount must be greater than zero.',
  },
};

export function TransferForm({
  locale,
  availableBalance,
  onClose,
  onSubmit,
}: TransferFormProps) {
  const tr = copy[locale];
  const [amount, setAmount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(getTodayDateInputValue());
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = Number(amount) || 0;
  const remainingBalance = availableBalance - numericAmount;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError('');

    if (numericAmount <= 0) {
      setApiError(tr.amountRequired);
      return;
    }

    if (numericAmount > availableBalance) {
      setApiError(tr.exceedsBalance);
      return;
    }

    if (!window.confirm(tr.confirm)) {
      return;
    }

    setIsSubmitting(true);

    const response = await onSubmit({
      amount: numericAmount,
      fromAccount: 'PHARMACY',
      toAccount: toAccount.trim(),
      reason: reason.trim() || undefined,
      date,
    });

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || tr.exceedsBalance);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{tr.title}</h2>
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
          {apiError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {apiError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.amount}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{tr.date}</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{tr.toAccount}</label>
            <input
              type="text"
              value={toAccount}
              onChange={(event) => setToAccount(event.target.value)}
              placeholder={tr.toAccountPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{tr.reason}</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder={tr.reasonPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {tr.currentBalance}
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatMoney(availableBalance, locale)}
              </p>
            </div>
            <div className="rounded-3xl border border-teal-200 bg-teal-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                {tr.remainingBalance}
              </p>
              <p
                className={`mt-3 text-2xl font-bold ${
                  remainingBalance < 0 ? 'text-rose-600' : 'text-teal-700'
                }`}
              >
                {formatMoney(Math.max(remainingBalance, 0), locale)}
              </p>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-slate-400"
            >
              {isSubmitting ? tr.submitting : tr.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
