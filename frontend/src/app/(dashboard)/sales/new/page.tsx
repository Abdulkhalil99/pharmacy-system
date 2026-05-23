'use client';

import Link from 'next/link';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useMedicineSearch, MedicineSearchResult } from '@/hooks/useMedicineSearch';
import { ReceiptModal, SaleReceipt } from '../components/ReceiptModal';

type Locale = 'fa' | 'ps' | 'en';

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
  createdAt: string;
}

interface SelectedMedicine extends MedicineSearchResult {
  quantitySelected: number;
}

const copy = {
  fa: {
    back: 'تاریخچه فروش',
    title: 'نسخه جدید',
    subtitle: 'دواها را جستجو کنید، نسخه بسازید و فوراً رسید چاپ کنید.',
    searchMedicine: 'جستجوی دوا',
    searchPlaceholder: 'نام دوا یا بارکد را بنویسید...',
    searchHint: 'دوا را از لیست انتخاب کنید تا به نسخه اضافه شود.',
    stock: 'موجودی',
    expires: 'انقضا',
    noMedicineResults: 'هیچ دوایی پیدا نشد.',
    selectedItems: 'اقلام نسخه',
    noItems: 'هنوز هیچ دوایی به نسخه اضافه نشده است.',
    company: 'شرکت',
    quantity: 'تعداد',
    price: 'قیمت فروش',
    subtotal: 'مجموع',
    profitEstimate: 'برآورد سود',
    remove: 'حذف',
    customer: 'مشتری',
    customerOptional: 'اختیاری',
    customerPlaceholder: 'نام یا شماره تماس مشتری...',
    walkIn: 'مشتری حضوری',
    clearCustomer: 'پاک کردن',
    noCustomerResults: 'مشتری پیدا نشد.',
    currentDebt: 'بدهی فعلی',
    payment: 'پرداخت',
    totalAmount: 'مجموع کل',
    amountPaid: 'مبلغ پرداخت',
    remainingDebt: 'بدهی باقی مانده',
    payInFull: 'پرداخت کامل',
    debtWarning: 'برای فروش قرضی باید یک مشتری انتخاب شود.',
    summary: 'خلاصه نسخه',
    itemsCount: 'تعداد اقلام',
    estimatedProfit: 'سود تخمینی',
    submit: 'ثبت نسخه و چاپ رسید',
    submitting: 'در حال ثبت...',
    overpayment: 'مبلغ پرداخت نمی‌تواند بیشتر از مجموع باشد.',
    addAtLeastOne: 'حداقل یک دوا به نسخه اضافه کنید.',
    outOfStock: 'این دوا موجودی کافی ندارد.',
    lowStock: 'کمبود موجودی',
    walkInNote: 'اگر مشتری انتخاب نشود، نسخه فقط به صورت نقدی ثبت می‌شود.',
    paidBadge: 'پرداخت کامل',
    partialBadge: 'پرداخت قسمی',
    debtBadge: 'قرض',
    searchLoading: 'در حال جستجو...',
  },
  ps: {
    back: 'د پلور تاریخچه',
    title: 'نوې نسخه',
    subtitle: 'درمل ولټوئ، نسخه جوړه کړئ او سمدستي رسید چاپ کړئ.',
    searchMedicine: 'د درملو لټون',
    searchPlaceholder: 'د درمل نوم یا بارکوډ ولیکئ...',
    searchHint: 'له لېست څخه درمل وټاکئ تر څو نسخې ته ورزیات شي.',
    stock: 'ذخیره',
    expires: 'پای',
    noMedicineResults: 'هیڅ درمل ونه موندل شول.',
    selectedItems: 'د نسخې توکي',
    noItems: 'تر اوسه هېڅ درمل نه دي ورزیات شوي.',
    company: 'شرکت',
    quantity: 'شمېر',
    price: 'د پلور بیه',
    subtotal: 'مجموع',
    profitEstimate: 'اټکلي ګټه',
    remove: 'لرې کول',
    customer: 'پیرودونکی',
    customerOptional: 'اختیاري',
    customerPlaceholder: 'د پیرودونکي نوم یا تلیفون...',
    walkIn: 'حضوري پیرودونکی',
    clearCustomer: 'پاکول',
    noCustomerResults: 'پیرودونکی ونه موندل شو.',
    currentDebt: 'اوسنی پور',
    payment: 'تادیه',
    totalAmount: 'ټول مجموع',
    amountPaid: 'ورکړل شوې پیسې',
    remainingDebt: 'پاتې پور',
    payInFull: 'بشپړ تادیه',
    debtWarning: 'د پور پلور لپاره باید یو پیرودونکی وټاکل شي.',
    summary: 'د نسخې لنډیز',
    itemsCount: 'د توکو شمېر',
    estimatedProfit: 'اټکلي ګټه',
    submit: 'نسخه ثبت او رسید چاپ کړئ',
    submitting: 'ثبتېږي...',
    overpayment: 'ورکړل شوې پیسې تر مجموع زیاتې نشي کېدای.',
    addAtLeastOne: 'لږ تر لږه یو درمل ورزیات کړئ.',
    outOfStock: 'د دې درملو ذخیره کافي نه ده.',
    lowStock: 'کمه ذخیره',
    walkInNote: 'که پیرودونکی و نه ټاکل شي، نسخه یوازې نغدي ثبتېږي.',
    paidBadge: 'بشپړ تادیه',
    partialBadge: 'قسمي تادیه',
    debtBadge: 'پور',
    searchLoading: 'لټون روان دی...',
  },
  en: {
    back: 'Sales History',
    title: 'New Prescription',
    subtitle: 'Search medicines, build the prescription, and print the receipt immediately.',
    searchMedicine: 'Medicine Search',
    searchPlaceholder: 'Type medicine name or barcode...',
    searchHint: 'Pick a medicine from the list to add it to the prescription.',
    stock: 'Stock',
    expires: 'Expiry',
    noMedicineResults: 'No medicines found.',
    selectedItems: 'Prescription Items',
    noItems: 'No medicines have been added yet.',
    company: 'Company',
    quantity: 'Quantity',
    price: 'Sell Price',
    subtotal: 'Subtotal',
    profitEstimate: 'Profit Estimate',
    remove: 'Remove',
    customer: 'Customer',
    customerOptional: 'Optional',
    customerPlaceholder: 'Search customer by name or phone...',
    walkIn: 'Walk-in customer',
    clearCustomer: 'Clear',
    noCustomerResults: 'No customers found.',
    currentDebt: 'Current Debt',
    payment: 'Payment',
    totalAmount: 'Total Amount',
    amountPaid: 'Amount Paid',
    remainingDebt: 'Remaining Debt',
    payInFull: 'Pay in Full',
    debtWarning: 'Select a customer if any amount will remain on debt.',
    summary: 'Prescription Summary',
    itemsCount: 'Items Count',
    estimatedProfit: 'Estimated Profit',
    submit: 'Create Prescription and Print Receipt',
    submitting: 'Saving...',
    overpayment: 'Paid amount cannot be greater than the total.',
    addAtLeastOne: 'Add at least one medicine to the prescription.',
    outOfStock: 'This medicine does not have enough stock.',
    lowStock: 'Low stock',
    walkInNote: 'Without a selected customer, the prescription can only be saved as cash sale.',
    paidBadge: 'Paid in Full',
    partialBadge: 'Partial Payment',
    debtBadge: 'On Debt',
    searchLoading: 'Searching...',
  },
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

function formatMoney(value: number, locale: Locale) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function getStatusBadge(total: number, paid: number, locale: Locale) {
  const tr = copy[locale];

  if (total <= 0 || paid >= total) {
    return {
      label: tr.paidBadge,
      className: 'bg-emerald-100 text-emerald-800',
    };
  }

  if (paid <= 0) {
    return {
      label: tr.debtBadge,
      className: 'bg-rose-100 text-rose-800',
    };
  }

  return {
    label: tr.partialBadge,
    className: 'bg-amber-100 text-amber-800',
  };
}

function getCustomerLabel(customer: CustomerOption) {
  return customer.phone ? `${customer.name} • ${customer.phone}` : customer.name;
}

export default function NewSalePage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const [medicineQuery, setMedicineQuery] = useState('');
  const [showMedicineResults, setShowMedicineResults] = useState(false);
  const { medicines, isLoading: medicinesLoading } = useMedicineSearch(medicineQuery);

  const [items, setItems] = useState<SelectedMedicine[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const deferredCustomerQuery = useDeferredValue(customerQuery.trim());
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerLoadingState, setCustomerLoadingState] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const [paidAmountInput, setPaidAmountInput] = useState('0');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.sellPrice * item.quantitySelected, 0);
  const estimatedProfit = items.reduce(
    (sum, item) => sum + (item.sellPrice - item.buyPrice) * item.quantitySelected,
    0
  );
  const parsedPaidAmount = Number(paidAmountInput || 0);
  const paidAmount = Number.isNaN(parsedPaidAmount) ? 0 : Math.max(parsedPaidAmount, 0);
  const remainingDebt = Math.max(totalAmount - paidAmount, 0);
  const statusBadge = getStatusBadge(totalAmount, paidAmount, locale);

  useEffect(() => {
    if (!deferredCustomerQuery) {
      startTransition(() => {
        setCustomers([]);
      });
      return;
    }

    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      setCustomerLoadingState(true);

      try {
        const params = new URLSearchParams({
          q: deferredCustomerQuery,
          limit: '8',
        });

        const response = await api.get<CustomerOption[]>(
          `/sales/customers/search?${params.toString()}`
        );

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          setCustomers(response.success && response.data ? response.data : []);
        });
      } catch {
        if (!isCancelled) {
          startTransition(() => {
            setCustomers([]);
          });
        }
      } finally {
        if (!isCancelled) {
          setCustomerLoadingState(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deferredCustomerQuery]);

  const addMedicine = (medicine: MedicineSearchResult) => {
    if (medicine.quantity <= 0) {
      setFormError(tr.outOfStock);
      return;
    }

    setFormError('');
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === medicine.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === medicine.id
            ? {
                ...item,
                quantitySelected: Math.min(item.quantitySelected + 1, item.quantity),
              }
            : item
        );
      }

      return [...currentItems, { ...medicine, quantitySelected: 1 }];
    });
    setMedicineQuery('');
    setShowMedicineResults(false);
  };

  const updateItemQuantity = (medicineId: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== medicineId) {
          return item;
        }

        const safeQuantity = Math.min(Math.max(quantity, 1), item.quantity);

        return {
          ...item,
          quantitySelected: safeQuantity,
        };
      })
    );
  };

  const removeItem = (medicineId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== medicineId));
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setCustomers([]);
    setShowCustomerResults(false);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setFormError(tr.addAtLeastOne);
      return;
    }

    if (paidAmount > totalAmount) {
      setFormError(tr.overpayment);
      return;
    }

    if (remainingDebt > 0 && !selectedCustomer) {
      setFormError(tr.debtWarning);
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const response = await api.post<SaleReceipt>('/sales/prescription', {
        customerId: selectedCustomer?.id,
        paidAmount,
        items: items.map((item) => ({
          medicineId: item.id,
          quantity: item.quantitySelected,
        })),
      });

      if (response.success && response.data) {
        setReceipt(response.data);
        setReceiptOpen(true);
        setItems([]);
        setMedicineQuery('');
        setPaidAmountInput('0');
        clearCustomer();
      } else {
        setFormError(response.message || 'Failed to create prescription');
      }
    } catch {
      setFormError('Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-800 px-6 py-7 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/sales"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/15"
            >
              {tr.back}
            </Link>
            <h1 className="mt-4 text-3xl font-black tracking-tight">{tr.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">{tr.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">{tr.payment}</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-2xl font-black">{formatMoney(totalAmount, locale)}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {formError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.95fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{tr.searchMedicine}</h2>
              <p className="mt-1 text-sm text-slate-500">{tr.searchHint}</p>
            </div>

            <div className="relative mt-5">
              <input
                value={medicineQuery}
                onChange={(event) => {
                  setMedicineQuery(event.target.value);
                  setShowMedicineResults(true);
                }}
                onFocus={() => setShowMedicineResults(true)}
                onBlur={() => window.setTimeout(() => setShowMedicineResults(false), 120)}
                placeholder={tr.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />

              {showMedicineResults && medicineQuery.trim() && (
                <div className="absolute inset-x-0 top-full z-20 mt-3 max-h-80 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
                  {medicinesLoading ? (
                    <div className="px-4 py-6 text-sm text-slate-500">{tr.searchLoading}</div>
                  ) : medicines.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500">{tr.noMedicineResults}</div>
                  ) : (
                    medicines.map((medicine) => {
                      const lowStock = medicine.quantity <= medicine.minQuantity;

                      return (
                        <button
                          type="button"
                          key={medicine.id}
                          onClick={() => addMedicine(medicine)}
                          className="flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-start transition-colors hover:bg-slate-50"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{medicine.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{medicine.company}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">
                                {tr.stock}: {medicine.quantity}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                {tr.expires}: {formatDate(medicine.expiryDate, locale)}
                              </span>
                              {lowStock && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                                  {tr.lowStock}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-end">
                            <p className="text-sm font-bold text-emerald-700">
                              {formatMoney(medicine.sellPrice, locale)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {medicine.barcode ?? '—'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-xl font-bold text-slate-900">{tr.selectedItems}</h2>
            </div>

            {items.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">{tr.noItems}</div>
            ) : (
              <div className="space-y-4 px-5 py-5">
                {items.map((item) => {
                  const subtotal = item.sellPrice * item.quantitySelected;
                  const lineProfit = (item.sellPrice - item.buyPrice) * item.quantitySelected;

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1.7fr)_140px_140px_140px_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{tr.company}: {item.company}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                            {tr.stock}: {item.quantity}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                            {tr.profitEstimate}: {formatMoney(lineProfit, locale)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {tr.quantity}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantitySelected - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-700"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={item.quantitySelected}
                            onChange={(event) => updateItemQuantity(item.id, Number(event.target.value))}
                            className="h-10 w-16 rounded-2xl border border-slate-200 bg-white text-center text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantitySelected + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {tr.price}
                        </p>
                        <p className="mt-3 text-base font-bold text-slate-900">
                          {formatMoney(item.sellPrice, locale)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {tr.subtotal}
                        </p>
                        <p className="mt-3 text-base font-bold text-emerald-700">
                          {formatMoney(subtotal, locale)}
                        </p>
                      </div>

                      <div className="flex items-start justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          {tr.remove}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{tr.customer}</h2>
                <p className="mt-1 text-sm text-slate-500">{tr.walkInNote}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {tr.customerOptional}
              </span>
            </div>

            <div className="relative mt-5">
              <input
                value={customerQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setCustomerQuery(value);
                  setShowCustomerResults(true);

                  if (selectedCustomer && value !== getCustomerLabel(selectedCustomer)) {
                    setSelectedCustomer(null);
                  }
                }}
                onFocus={() => setShowCustomerResults(true)}
                onBlur={() => window.setTimeout(() => setShowCustomerResults(false), 120)}
                placeholder={tr.customerPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />

              {showCustomerResults && customerQuery.trim() && (
                <div className="absolute inset-x-0 top-full z-20 mt-3 max-h-72 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
                  {Boolean(deferredCustomerQuery) && customerLoadingState ? (
                    <div className="px-4 py-6 text-sm text-slate-500">{tr.searchLoading}</div>
                  ) : customers.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500">{tr.noCustomerResults}</div>
                  ) : (
                    customers.map((customer) => (
                      <button
                        type="button"
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerQuery(getCustomerLabel(customer));
                          setShowCustomerResults(false);
                        }}
                        className="flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-start transition-colors hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{customer.phone ?? '—'}</p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                          {tr.currentDebt}: {formatMoney(customer.totalDebt, locale)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={clearCustomer}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                {tr.walkIn}
              </button>

              {selectedCustomer && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                >
                  {tr.clearCustomer}
                </button>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="mt-1">
                  {tr.currentDebt}: {formatMoney(selectedCustomer.totalDebt, locale)}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">{tr.payment}</h2>
              <button
                type="button"
                onClick={() => setPaidAmountInput(totalAmount.toString())}
                className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-200"
              >
                {tr.payInFull}
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {tr.totalAmount}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">{formatMoney(totalAmount, locale)}</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">{tr.amountPaid}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paidAmountInput}
                  onChange={(event) => setPaidAmountInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                  {tr.remainingDebt}
                </p>
                <p className="mt-2 text-2xl font-black text-rose-700">
                  {formatMoney(remainingDebt, locale)}
                </p>
              </div>
            </div>

            {remainingDebt > 0 && !selectedCustomer && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {tr.debtWarning}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <h2 className="text-xl font-bold">{tr.summary}</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{tr.itemsCount}</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{tr.totalAmount}</span>
                <span className="font-semibold">{formatMoney(totalAmount, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{tr.estimatedProfit}</span>
                <span className="font-semibold text-emerald-300">{formatMoney(estimatedProfit, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{tr.remainingDebt}</span>
                <span className="font-semibold text-rose-300">{formatMoney(remainingDebt, locale)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="mt-6 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800"
            >
              {isSubmitting ? tr.submitting : tr.submit}
            </button>
          </div>
        </aside>
      </div>

      <ReceiptModal
        isOpen={receiptOpen}
        receipt={receipt}
        locale={locale}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}
