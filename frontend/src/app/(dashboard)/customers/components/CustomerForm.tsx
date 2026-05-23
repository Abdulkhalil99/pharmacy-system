'use client';

import { useEffect, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import {
  CustomerApiResponse,
  CustomerFormData,
  CustomerListItem,
} from '@/hooks/useCustomers';

type Locale = 'fa' | 'ps' | 'en';

interface CustomerFormProps {
  locale: Locale;
  customer?: CustomerListItem | null;
  onSubmit: (data: CustomerFormData) => CustomerApiResponse<CustomerListItem>;
  onClose: () => void;
}

const copy = {
  fa: {
    add: 'افزودن مشتری',
    edit: 'ویرایش مشتری',
    subtitle: 'اطلاعات پایه مشتری را برای فروش های قرضی و ثبت پرداخت نگهداری کنید.',
    name: 'نام مشتری',
    phone: 'شماره تماس',
    phoneHint: 'اختیاری',
    save: 'ذخیره',
    cancel: 'انصراف',
    saving: 'در حال ذخیره...',
    nameRequired: 'نام مشتری الزامی است.',
  },
  ps: {
    add: 'پیرودونکی زیاتول',
    edit: 'پیرودونکی سمول',
    subtitle: 'د پور پلور او پیسو ثبت لپاره د پیرودونکي بنسټیز معلومات وساتئ.',
    name: 'د پیرودونکي نوم',
    phone: 'د تماس شمېره',
    phoneHint: 'اختیاري',
    save: 'خوندي کول',
    cancel: 'لغوه',
    saving: 'خوندي کېږي...',
    nameRequired: 'د پیرودونکي نوم اړین دی.',
  },
  en: {
    add: 'Add Customer',
    edit: 'Edit Customer',
    subtitle: 'Keep basic customer details for debt sales and payment tracking.',
    name: 'Customer Name',
    phone: 'Phone Number',
    phoneHint: 'Optional',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
    nameRequired: 'Customer name is required.',
  },
};

export function CustomerForm({
  locale,
  customer,
  onSubmit,
  onClose,
}: CustomerFormProps) {
  const tr = copy[locale];
  const isEdit = Boolean(customer);

  const [form, setForm] = useState({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone ?? '',
      });
      return;
    }

    setForm({
      name: '',
      phone: '',
    });
  }, [customer]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = tr.nameRequired;
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
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
    });

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to save customer');
    }

    setIsSaving(false);
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    extraProps: InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
          errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
        }`}
        {...extraProps}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          {field('name', tr.name)}
          {field('phone', `${tr.phone} (${tr.phoneHint})`, 'tel', {
            placeholder: '+93700111222',
          })}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {tr.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
            >
              {isSaving ? tr.saving : tr.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
