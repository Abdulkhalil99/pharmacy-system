'use client';

import { useState } from 'react';
import type { UserApiResponse } from '@/hooks/useUsers';
import { getDirectionFromLanguage, getLocaleFromLanguage } from '@/lib/user-meta';

interface ResetPasswordModalProps {
  language?: string;
  username: string;
  onSubmit: (data: { newPassword: string; confirmPassword: string }) => UserApiResponse<unknown>;
  onClose: () => void;
}

const copy = {
  fa: {
    title: 'بازنشانی رمز عبور',
    warning: 'این کار رمز عبور کاربر را فوراً تغییر می‌دهد.',
    newPassword: 'رمز عبور جدید',
    confirmPassword: 'تایید رمز عبور جدید',
    confirm: 'بازنشانی رمز',
    cancel: 'انصراف',
    submitting: 'در حال بازنشانی...',
    passwordShort: 'رمز عبور باید حداقل ۶ کاراکتر باشد.',
    mismatch: 'رمزهای عبور با هم مطابقت ندارند.',
  },
  ps: {
    title: 'د پټنوم بیا ټاکل',
    warning: 'دا کار به د کارونکي پټنوم سمدلاسه بدل کړي.',
    newPassword: 'نوی پټنوم',
    confirmPassword: 'د نوي پټنوم تایید',
    confirm: 'پټنوم بیا ټاکل',
    cancel: 'لغوه',
    submitting: 'بیا ټاکل کېږي...',
    passwordShort: 'پټنوم باید لږ تر لږه ۶ توري ولري.',
    mismatch: 'پټنومونه سره نه سمون خوري.',
  },
  en: {
    title: 'Reset Password',
    warning: "This will reset the user's password immediately.",
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    confirm: 'Confirm Reset',
    cancel: 'Cancel',
    submitting: 'Resetting...',
    passwordShort: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.',
  },
};

export function ResetPasswordModal({
  language,
  username,
  onSubmit,
  onClose,
}: ResetPasswordModalProps) {
  const locale = getLocaleFromLanguage(language);
  const dir = getDirectionFromLanguage(language);
  const tr = copy[locale];

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(tr.passwordShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(tr.mismatch);
      return;
    }

    setIsSubmitting(true);
    const response = await onSubmit({ newPassword, confirmPassword });

    if (response.success) {
      onClose();
    } else {
      setError(response.message || 'Failed to reset password');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" dir={dir}>
      <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">{tr.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{username}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {tr.warning}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{tr.newPassword}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{tr.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
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
              className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-slate-400"
            >
              {isSubmitting ? tr.submitting : tr.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
