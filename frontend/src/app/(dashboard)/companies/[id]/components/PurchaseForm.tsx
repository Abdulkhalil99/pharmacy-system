'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiResponse } from '@/lib/api';
import {
  fetchMedicineOptions,
  MedicineOption,
  PurchaseFormData,
  PurchaseMedicineItemInput,
} from '@/hooks/useCompanies';
import { DRUG_KIND_LABELS, DRUG_KINDS, DrugKind } from '@pharmacy/shared';

interface Props {
  companyName: string;
  locale: 'fa' | 'ps' | 'en';
  onSubmit: (data: PurchaseFormData) => Promise<ApiResponse<unknown>>;
  onClose: () => void;
}

const copy = {
  fa: {
    title: 'ثبت خرید از شرکت',
    subtitle: 'برای هر قلم دوا می توانید موجودی فعلی را افزایش دهید یا یک قلم جدید بسازید.',
    billNumber: 'شماره بل',
    date: 'تاریخ',
    note: 'یادداشت',
    items: 'اقلام خرید',
    addItem: 'افزودن قلم',
    existingMedicine: 'انتخاب دوا از موجودی',
    newMedicine: 'دوا جدید',
    name: 'نام دوا',
    kind: 'نوع دوا',
    barcode: 'بارکد',
    quantity: 'تعداد',
    buyPrice: 'قیمت خرید',
    sellPrice: 'قیمت فروش',
    minQuantity: 'حداقل موجودی',
    expiryDate: 'تاریخ انقضا',
    total: 'مجموع خرید',
    remove: 'حذف',
    cancel: 'انصراف',
    submit: 'ثبت خرید',
    submitting: 'در حال ثبت...',
    loadingMedicines: 'در حال بارگذاری لیست دواها...',
    supplier: 'شرکت',
  },
  ps: {
    title: 'له شرکت څخه د پېرود ثبت',
    subtitle: 'د هر درمل لپاره کولی شئ موجوده ذخیره زیاته کړئ یا نوی قلم جوړ کړئ.',
    billNumber: 'د بل شمېره',
    date: 'نېټه',
    note: 'یادښت',
    items: 'د پېرود توکي',
    addItem: 'توکی زیاتول',
    existingMedicine: 'له موجوده ذخیرې درمل وټاکئ',
    newMedicine: 'نوی درمل',
    name: 'د درمل نوم',
    kind: 'د درمل ډول',
    barcode: 'بارکوډ',
    quantity: 'شمېر',
    buyPrice: 'د پېرود بیه',
    sellPrice: 'د پلور بیه',
    minQuantity: 'لږترلږه ذخیره',
    expiryDate: 'د پای نېټه',
    total: 'ټول پېرود',
    remove: 'لرې کول',
    cancel: 'لغوه',
    submit: 'پېرود ثبتول',
    submitting: 'ثبتېږي...',
    loadingMedicines: 'د درملو لېست بارېږي...',
    supplier: 'شرکت',
  },
  en: {
    title: 'Record Purchase',
    subtitle: 'For each line you can increase an existing medicine or create a new one.',
    billNumber: 'Bill Number',
    date: 'Date',
    note: 'Note',
    items: 'Purchase Items',
    addItem: 'Add Item',
    existingMedicine: 'Select Existing Medicine',
    newMedicine: 'New Medicine',
    name: 'Medicine Name',
    kind: 'Medicine Kind',
    barcode: 'Barcode',
    quantity: 'Quantity',
    buyPrice: 'Buy Price',
    sellPrice: 'Sell Price',
    minQuantity: 'Min Quantity',
    expiryDate: 'Expiry Date',
    total: 'Purchase Total',
    remove: 'Remove',
    cancel: 'Cancel',
    submit: 'Record Purchase',
    submitting: 'Submitting...',
    loadingMedicines: 'Loading medicine list...',
    supplier: 'Supplier',
  },
};

const createEmptyItem = (): PurchaseMedicineItemInput => ({
  name: '',
  kind: 'TABLET',
  barcode: '',
  quantity: 1,
  buyPrice: 0,
  sellPrice: 0,
  minQuantity: 10,
  expiryDate: new Date().toISOString().slice(0, 10),
});

export function PurchaseForm({ companyName, locale, onSubmit, onClose }: Props) {
  const tr = copy[locale];
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [items, setItems] = useState<PurchaseMedicineItemInput[]>([createEmptyItem()]);
  const [medicineOptions, setMedicineOptions] = useState<MedicineOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      const options = await fetchMedicineOptions();

      if (!cancelled) {
        setMedicineOptions(options);
        setIsLoadingOptions(false);
      }
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.buyPrice), 0),
    [items]
  );

  const updateItem = (index: number, patch: Partial<PurchaseMedicineItemInput>) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  };

  const handleMedicineSelect = (index: number, medicineId: string) => {
    if (!medicineId) {
      updateItem(index, { medicineId: undefined });
      return;
    }

    const option = medicineOptions.find((medicine) => medicine.id === medicineId);
    if (!option) {
      return;
    }

    updateItem(index, {
      medicineId: option.id,
      name: option.name,
      kind: option.kind,
      barcode: option.barcode ?? '',
      buyPrice: option.buyPrice,
      sellPrice: option.sellPrice,
      minQuantity: option.minQuantity,
      expiryDate: option.expiryDate.slice(0, 10),
    });
  };

  const addItem = () => {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setIsSubmitting(true);

    const payload: PurchaseFormData = {
      billNumber: billNumber.trim() || undefined,
      date,
      note: note.trim() || undefined,
      items: items.map((item) => ({
        medicineId: item.medicineId,
        name: item.name.trim(),
        kind: item.kind,
        barcode: item.barcode?.trim() || undefined,
        quantity: Number(item.quantity),
        buyPrice: Number(item.buyPrice),
        sellPrice: Number(item.sellPrice),
        minQuantity: item.minQuantity !== undefined ? Number(item.minQuantity) : undefined,
        expiryDate: item.expiryDate,
      })),
    };

    const response = await onSubmit(payload);

    if (response.success) {
      onClose();
    } else {
      setApiError(response.message || 'Failed to record purchase');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
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

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {apiError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.billNumber}</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.total}</label>
              <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-2.5 text-lg font-bold text-teal-700">
                {totalAmount.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{tr.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{tr.items}</h3>
              {isLoadingOptions && <p className="mt-1 text-xs text-gray-500">{tr.loadingMedicines}</p>}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              {tr.addItem}
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={`${index}-${item.medicineId ?? 'new'}`} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {tr.items} #{index + 1}
                  </p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      {tr.remove}
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.existingMedicine}</label>
                    <select
                      value={item.medicineId ?? ''}
                      onChange={(e) => handleMedicineSelect(index, e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">{tr.newMedicine}</option>
                      {medicineOptions.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name}
                          {medicine.barcode ? ` - ${medicine.barcode}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.name}</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, { name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.kind}</label>
                    <select
                      value={item.kind}
                      onChange={(e) => updateItem(index, { kind: e.target.value as DrugKind })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    >
                      {DRUG_KINDS.map((kind) => (
                        <option key={kind} value={kind}>
                          {DRUG_KIND_LABELS[kind][locale]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.barcode}</label>
                    <input
                      type="text"
                      value={item.barcode ?? ''}
                      onChange={(e) => updateItem(index, { barcode: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.quantity}</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.minQuantity}</label>
                    <input
                      type="number"
                      min={0}
                      value={item.minQuantity ?? 0}
                      onChange={(e) => updateItem(index, { minQuantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.buyPrice}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.buyPrice}
                      onChange={(e) => updateItem(index, { buyPrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.sellPrice}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.sellPrice}
                      onChange={(e) => updateItem(index, { sellPrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{tr.expiryDate}</label>
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) => updateItem(index, { expiryDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
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
