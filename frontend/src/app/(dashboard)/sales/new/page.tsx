'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Minus, Package, Plus, Trash2 } from 'lucide-react';
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

interface SaleDraft {
  items: SelectedMedicine[];
  paidAmountInput: string;
  medicineQuery: string;
  customer: CustomerOption | null;
}

const copy = {
  fa: {
    back: 'تاریخچه فروش',
    title: 'نسخه جدید',
    editTitle: 'ویرایش نسخه',
    subtitle: 'دواها را جستجو کنید، نسخه بسازید و فوراً رسید چاپ کنید.',
    editSubtitle: 'اقلام، مشتری و پرداخت نسخه ثبت شده را اصلاح کنید.',
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
    registerCustomer: 'ثبت مشتری',
    summary: 'خلاصه نسخه',
    itemsCount: 'تعداد اقلام',
    estimatedProfit: 'سود تخمینی',
    submit: 'ثبت نسخه و چاپ رسید',
    update: 'ذخیره تغییرات',
    submitting: 'در حال ثبت...',
    updating: 'در حال ذخیره...',
    overpayment: 'مبلغ پرداخت نمی‌تواند بیشتر از مجموع باشد.',
    addAtLeastOne: 'حداقل یک دوا به نسخه اضافه کنید.',
    outOfStock: 'این دوا موجودی کافی ندارد.',
    lowStock: 'کمبود موجودی',
    walkInNote: 'اگر مشتری انتخاب نشود، نسخه فقط به صورت نقدی ثبت می‌شود.',
    paidBadge: 'پرداخت کامل',
    partialBadge: 'پرداخت قسمی',
    debtBadge: 'قرض',
    searchLoading: 'در حال جستجو...',
    loadFailed: 'بارگذاری فروش موفق نشد.',
    updateFailed: 'ذخیره تغییرات موفق نشد.',
    draftRestored: 'نسخه قبلی شما بازیابی شد. مشتری جدید انتخاب شده است.',
  },
  ps: {
    back: 'د پلور تاریخچه',
    title: 'نوې نسخه',
    editTitle: 'نسخه سمول',
    subtitle: 'درمل ولټوئ، نسخه جوړه کړئ او سمدستي رسید چاپ کړئ.',
    editSubtitle: 'د ثبت شوې نسخې توکي، پیرودونکی او تادیه اصلاح کړئ.',
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
    registerCustomer: 'پیرودونکی ثبت کړئ',
    summary: 'د نسخې لنډیز',
    itemsCount: 'د توکو شمېر',
    estimatedProfit: 'اټکلي ګټه',
    submit: 'نسخه ثبت او رسید چاپ کړئ',
    update: 'بدلونونه خوندي کړئ',
    submitting: 'ثبتېږي...',
    updating: 'خوندي کېږي...',
    overpayment: 'ورکړل شوې پیسې تر مجموع زیاتې نشي کېدای.',
    addAtLeastOne: 'لږ تر لږه یو درمل ورزیات کړئ.',
    outOfStock: 'د دې درملو ذخیره کافي نه ده.',
    lowStock: 'کمه ذخیره',
    walkInNote: 'که پیرودونکی و نه ټاکل شي، نسخه یوازې نغدي ثبتېږي.',
    paidBadge: 'بشپړ تادیه',
    partialBadge: 'قسمي تادیه',
    debtBadge: 'پور',
    searchLoading: 'لټون روان دی...',
    loadFailed: 'پلور بار نه شو.',
    updateFailed: 'بدلونونه خوندي نه شول.',
    draftRestored: 'ستاسو پخوانۍ نسخه بېرته راوستل شوه. نوی پیرودونکی ټاکل شوی دی.',
  },
  en: {
    back: 'Sales History',
    title: 'New Prescription',
    editTitle: 'Edit Prescription',
    subtitle: 'Search medicines, build the prescription, and print the receipt immediately.',
    editSubtitle: 'Adjust the medicines, customer, and payment for this saved prescription.',
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
    registerCustomer: 'Register Customer',
    summary: 'Prescription Summary',
    itemsCount: 'Items Count',
    estimatedProfit: 'Estimated Profit',
    submit: 'Create Prescription and Print Receipt',
    update: 'Save Changes',
    submitting: 'Saving...',
    updating: 'Saving Changes...',
    overpayment: 'Paid amount cannot be greater than the total.',
    addAtLeastOne: 'Add at least one medicine to the prescription.',
    outOfStock: 'This medicine does not have enough stock.',
    lowStock: 'Low stock',
    walkInNote: 'Without a selected customer, the prescription can only be saved as cash sale.',
    paidBadge: 'Paid in Full',
    partialBadge: 'Partial Payment',
    debtBadge: 'On Debt',
    searchLoading: 'Searching...',
    loadFailed: 'Failed to load sale.',
    updateFailed: 'Failed to save changes.',
    draftRestored: 'Your sale draft was restored with the new customer selected.',
  },
};

const SALE_DRAFT_KEY = 'pharmacy:new-sale-draft';
const SALE_DRAFT_CUSTOMER_KEY = 'pharmacy:new-sale-draft-customer';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSaleId = searchParams.get('edit');
  const shouldRestoreDraft = searchParams.get('restoreSaleDraft') === '1';
  const isEditMode = Boolean(editSaleId);
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const [restoredDraft] = useState<SaleDraft | null>(() => {
    if (isEditMode || !shouldRestoreDraft || typeof window === 'undefined') {
      return null;
    }

    const savedDraft = window.sessionStorage.getItem(SALE_DRAFT_KEY);
    const savedCustomer = window.sessionStorage.getItem(SALE_DRAFT_CUSTOMER_KEY);

    if (!savedDraft) {
      return null;
    }

    try {
      const draft = JSON.parse(savedDraft) as Partial<SaleDraft>;
      const customer = savedCustomer ? (JSON.parse(savedCustomer) as CustomerOption) : null;

      return {
        items: Array.isArray(draft.items) ? draft.items : [],
        paidAmountInput: draft.paidAmountInput ?? '0',
        medicineQuery: draft.medicineQuery ?? '',
        customer,
      };
    } catch {
      return null;
    }
  });

  const [medicineQuery, setMedicineQuery] = useState(restoredDraft?.medicineQuery ?? '');
  const [showMedicineResults, setShowMedicineResults] = useState(false);
  const { medicines, isLoading: medicinesLoading } = useMedicineSearch(medicineQuery);

  const [items, setItems] = useState<SelectedMedicine[]>(restoredDraft?.items ?? []);
  const [customerQuery, setCustomerQuery] = useState(
    restoredDraft?.customer ? getCustomerLabel(restoredDraft.customer) : ''
  );
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const deferredCustomerQuery = useDeferredValue(customerQuery.trim());
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerLoadingState, setCustomerLoadingState] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(
    restoredDraft?.customer ?? null
  );

  const [paidAmountInput, setPaidAmountInput] = useState(restoredDraft?.paidAmountInput ?? '0');
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState(
    restoredDraft?.customer ? tr.draftRestored : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [isLoadingSale, setIsLoadingSale] = useState(false);

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
    if (!shouldRestoreDraft) {
      return;
    }

    window.sessionStorage.removeItem(SALE_DRAFT_KEY);
    window.sessionStorage.removeItem(SALE_DRAFT_CUSTOMER_KEY);
    router.replace('/sales/new');
  }, [router, shouldRestoreDraft]);

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

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
    setCustomers([]);
    setShowCustomerResults(false);
  };

  useEffect(() => {
    if (!editSaleId) {
      return;
    }

    let isCancelled = false;

    const loadSale = async () => {
      setIsLoadingSale(true);
      setFormError('');

      try {
        const response = await api.get<SaleReceipt>(`/sales/${editSaleId}`);

        if (!response.success || !response.data) {
          setFormError(response.message || tr.loadFailed);
          return;
        }

        const sale = response.data;
        const loadedItems = await Promise.all(
          sale.items.map(async (item) => {
            const medicineResponse = await api.get<MedicineSearchResult>(`/medicines/${item.medicineId}`);
            const medicine = medicineResponse.success && medicineResponse.data
              ? medicineResponse.data
              : null;

            return {
              id: item.medicineId,
              name: item.medicineName,
              kind: medicine?.kind ?? 'TABLET',
              barcode: item.barcode,
              company: item.company,
              buyPrice: item.unitPrice - item.unitProfit,
              sellPrice: item.unitPrice,
              quantity: (medicine?.quantity ?? 0) + item.quantity,
              minQuantity: medicine?.minQuantity ?? 0,
              expiryDate: medicine?.expiryDate ?? new Date().toISOString(),
              quantitySelected: item.quantity,
            };
          })
        );

        if (isCancelled) {
          return;
        }

        setItems(loadedItems);
        setPaidAmountInput(String(sale.totals.paidAmount));
        setReceipt(sale);

        if (sale.customer) {
          const customer = {
            id: sale.customer.id,
            name: sale.customer.name,
            phone: sale.customer.phone,
            totalDebt: sale.customer.totalDebt,
            createdAt: sale.createdAt,
          };
          setSelectedCustomer(customer);
          setCustomerQuery(getCustomerLabel(customer));
        } else {
          clearCustomer();
        }
      } catch {
        if (!isCancelled) {
          setFormError(tr.loadFailed);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSale(false);
        }
      }
    };

    void loadSale();

    return () => {
      isCancelled = true;
    };
  }, [editSaleId, tr.loadFailed]);

  const addMedicine = (medicine: MedicineSearchResult) => {
    if (medicine.quantity <= 0) {
      setFormError(tr.outOfStock);
      return;
    }

    setFormError('');
    setFormNotice('');
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

  const saveDraftAndRegisterCustomer = () => {
    window.sessionStorage.setItem(
      SALE_DRAFT_KEY,
      JSON.stringify({
        items,
        paidAmountInput,
        medicineQuery,
      })
    );

    router.push('/customers?fromSaleDraft=1');
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
    setFormNotice('');
    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomer?.id,
        paidAmount,
        items: items.map((item) => ({
          medicineId: item.id,
          quantity: item.quantitySelected,
        })),
      };

      const response = isEditMode && editSaleId
        ? await api.put<SaleReceipt>(`/sales/${editSaleId}`, payload)
        : await api.post<SaleReceipt>('/sales/prescription', payload);

      if (response.success && response.data) {
        setReceipt(response.data);
        setReceiptOpen(true);
        if (!isEditMode) {
          setItems([]);
          setMedicineQuery('');
          setPaidAmountInput('0');
          clearCustomer();
        }
      } else {
        setFormError(response.message || (isEditMode ? tr.updateFailed : 'Failed to create prescription'));
      }
    } catch {
      setFormError(isEditMode ? tr.updateFailed : 'Failed to create prescription');
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
            <h1 className="mt-4 text-3xl font-black tracking-tight">
              {isEditMode ? tr.editTitle : tr.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              {isEditMode ? tr.editSubtitle : tr.subtitle}
            </p>
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

      {isLoadingSale && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
          {tr.searchLoading}
        </div>
      )}

      {formError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}

      {formNotice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {formNotice}
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

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{tr.selectedItems}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {items.length} {tr.itemsCount}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-end">
                <p className="text-xs font-semibold text-emerald-700">{tr.totalAmount}</p>
                <p className="mt-1 text-lg font-black text-emerald-800">
                  {formatMoney(totalAmount, locale)}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-14 text-center text-sm text-slate-500">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </div>
                {tr.noItems}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const subtotal = item.sellPrice * item.quantitySelected;
                  const lineProfit = (item.sellPrice - item.buyPrice) * item.quantitySelected;

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(220px,1fr)_170px_115px_130px_44px] lg:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                          <Package className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{tr.company}: {item.company}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                            {tr.stock}: {item.quantity}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                              {tr.profitEstimate}: {formatMoney(lineProfit, locale)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          {tr.quantity}
                        </p>
                        <div className="mt-2 grid h-11 grid-cols-[40px_minmax(58px,1fr)_40px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantitySelected - 1)}
                            className="flex items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            aria-label="-"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={item.quantitySelected}
                            onChange={(event) => updateItemQuantity(item.id, Number(event.target.value))}
                            className="min-w-0 border-x border-slate-200 bg-white text-center text-sm font-bold text-slate-900 outline-none focus:bg-emerald-50"
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, item.quantitySelected + 1)}
                            className="flex items-center justify-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            aria-label="+"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-3 py-2 lg:bg-transparent lg:px-0 lg:py-0">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          {tr.price}
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {formatMoney(item.sellPrice, locale)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 px-3 py-2 lg:bg-transparent lg:px-0 lg:py-0">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          {tr.subtotal}
                        </p>
                        <p className="mt-1 text-base font-black text-emerald-700">
                          {formatMoney(subtotal, locale)}
                        </p>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-1"
                          title={tr.remove}
                          aria-label={tr.remove}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
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
                <p>{tr.debtWarning}</p>
                <button
                  type="button"
                  onClick={saveDraftAndRegisterCustomer}
                  className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                >
                  {tr.registerCustomer}
                </button>
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
              disabled={isSubmitting || isLoadingSale}
              onClick={handleSubmit}
              className="mt-6 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800"
            >
              {isSubmitting
                ? (isEditMode ? tr.updating : tr.submitting)
                : (isEditMode ? tr.update : tr.submit)}
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
