'use client';

import { useEffect, useRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Medicine, MedicineFormData } from '@/hooks/useMedicines';
import { ApiResponse } from '@/lib/api';
import { DRUG_KIND_LABELS, DRUG_KINDS, DrugKind } from '@pharmacy/shared';

interface Props {
  medicine?: Medicine | null;
  onSubmit: (data: MedicineFormData) => Promise<ApiResponse<Medicine>>;
  onClose: () => void;
  locale?: 'fa' | 'ps' | 'en';
}

const labels = {
  fa: {
    add: 'افزودن دوا',
    edit: 'ویرایش دوا',
    name: 'نام دوا',
    kind: 'نوع دوا',
    barcode: 'بارکد',
    company: 'شرکت سازنده',
    buyPrice: 'قیمت خرید (افغانی)',
    sellPrice: 'قیمت فروش (افغانی)',
    quantity: 'موجودی',
    minQuantity: 'حداقل موجودی',
    expiryDate: 'تاریخ انقضا',
    save: 'ذخیره',
    cancel: 'انصراف',
    saving: 'در حال ذخیره...',
  },
  ps: {
    add: 'درمل زیاتول',
    edit: 'درمل سمول',
    name: 'د درمل نوم',
    kind: 'د درمل ډول',
    barcode: 'بارکد',
    company: 'جوړوونکې شرکت',
    buyPrice: 'د پیرود قیمت (افغانی)',
    sellPrice: 'د پلور قیمت (افغانی)',
    quantity: 'ذخیره',
    minQuantity: 'لږترلږه ذخیره',
    expiryDate: 'د پای نیټه',
    save: 'خوندي کول',
    cancel: 'لغوه',
    saving: 'خوندي کیږي...',
  },
  en: {
    add: 'Add Medicine',
    edit: 'Edit Medicine',
    name: 'Medicine Name',
    kind: 'Medicine Kind',
    barcode: 'Barcode',
    company: 'Company',
    buyPrice: 'Buy Price (AFN)',
    sellPrice: 'Sell Price (AFN)',
    quantity: 'Quantity',
    minQuantity: 'Min Quantity',
    expiryDate: 'Expiry Date',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
  },
};

export function MedicineForm({ medicine, onSubmit, onClose, locale = 'fa' }: Props) {
  const tr = labels[locale];
  const isEdit = !!medicine;
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    kind: 'TABLET' as DrugKind,
    barcode: '',
    company: '',
    buyPrice: '',
    sellPrice: '',
    quantity: '',
    minQuantity: '10',
    expiryDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name,
        kind: medicine.kind,
        barcode: medicine.barcode ?? '',
        company: medicine.company,
        buyPrice: String(medicine.buyPrice),
        sellPrice: String(medicine.sellPrice),
        quantity: String(medicine.quantity),
        minQuantity: String(medicine.minQuantity),
        expiryDate: medicine.expiryDate.split('T')[0],
      });
      return;
    }

    setForm({
      name: '',
      kind: 'TABLET',
      barcode: '',
      company: '',
      buyPrice: '',
      sellPrice: '',
      quantity: '',
      minQuantity: '10',
      expiryDate: '',
    });
  }, [medicine]);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = 'Required';
    if (!form.kind) nextErrors.kind = 'Required';
    if (!form.company.trim()) nextErrors.company = 'Required';
    if (!form.buyPrice || Number.isNaN(Number(form.buyPrice))) nextErrors.buyPrice = 'Invalid';
    if (!form.sellPrice || Number.isNaN(Number(form.sellPrice))) nextErrors.sellPrice = 'Invalid';
    if (Number(form.sellPrice) < Number(form.buyPrice)) nextErrors.sellPrice = 'Must be >= buy price';
    if (!form.quantity || Number.isNaN(Number(form.quantity))) nextErrors.quantity = 'Invalid';
    if (!form.expiryDate) nextErrors.expiryDate = 'Required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    const payload: MedicineFormData = {
      name: form.name.trim(),
      kind: form.kind,
      barcode: form.barcode.trim() || undefined,
      company: form.company.trim(),
      buyPrice: Number(form.buyPrice),
      sellPrice: Number(form.sellPrice),
      quantity: Number(form.quantity),
      minQuantity: Number(form.minQuantity),
      expiryDate: form.expiryDate,
    };

    const res = await onSubmit(payload);

    if (res.success === false) {
      setApiError(res.message ?? 'Error');
    } else {
      onClose();
    }

    setIsLoading(false);
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
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? tr.edit : tr.add}</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('name', tr.name)}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.kind}</label>
              <select
                value={form.kind}
                onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value as DrugKind }))}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.kind ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {DRUG_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {DRUG_KIND_LABELS[kind][locale]}
                  </option>
                ))}
              </select>
              {errors.kind && <p className="mt-1 text-xs text-red-500">{errors.kind}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.barcode}</label>
              <div className="relative">
                <input
                  ref={barcodeRef}
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pe-10 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Scan or type..."
                />
                <span className="absolute inset-y-0 end-3 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                  </svg>
                </span>
              </div>
            </div>
            {field('company', tr.company)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('buyPrice', tr.buyPrice, 'number', { min: 0, step: '0.01' })}
            {field('sellPrice', tr.sellPrice, 'number', { min: 0, step: '0.01' })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('quantity', tr.quantity, 'number', { min: 0 })}
            {field('minQuantity', tr.minQuantity, 'number', { min: 0 })}
          </div>

          {field('expiryDate', tr.expiryDate, 'date')}

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
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-400"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {isLoading ? tr.saving : tr.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
