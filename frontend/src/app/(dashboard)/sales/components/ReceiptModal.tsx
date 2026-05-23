'use client';

import { useEffect } from 'react';

type Locale = 'fa' | 'ps' | 'en';

export interface SaleReceipt {
  pharmacyName: string;
  saleId: string;
  prescriptionId: string;
  date: string;
  createdAt: string;
  status: 'PAID' | 'PARTIAL' | 'DEBT';
  customer: {
    id: string;
    name: string;
    phone: string | null;
    totalDebt: number;
  } | null;
  totals: {
    originalTotalAmount: number;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
    profit: number;
    totalReturnedAmount: number;
  };
  items: Array<{
    prescriptionItemId: string;
    medicineId: string;
    medicineName: string;
    barcode: string | null;
    company: string;
    quantity: number;
    returnedQuantity: number;
    availableQuantity: number;
    unitPrice: number;
    total: number;
    currentTotal: number;
    unitProfit: number;
    totalProfit: number;
  }>;
  returns: Array<{
    id: string;
    prescriptionItemId: string;
    medicineId: string;
    medicineName: string;
    quantity: number;
    reason: string | null;
    date: string;
    userId: string;
    amount: number;
  }>;
}

interface ReceiptModalProps {
  isOpen: boolean;
  receipt: SaleReceipt | null;
  locale: Locale;
  onClose: () => void;
}

const copy = {
  fa: {
    title: 'رسید فروش',
    printedAt: 'تاریخ',
    prescription: 'نسخه',
    sale: 'فروش',
    customer: 'مشتری',
    walkIn: 'مشتری حضوری',
    phone: 'تلفن',
    status: 'وضعیت',
    item: 'دوا',
    qty: 'تعداد',
    unitPrice: 'فی واحد',
    total: 'مجموع',
    originalTotal: 'مجموع اولیه',
    returned: 'برگشتی',
    finalTotal: 'مجموع نهایی',
    paid: 'پرداخت شده',
    debt: 'باقی بدهی',
    profit: 'سود',
    print: 'چاپ',
    close: 'بستن',
    paidStatus: 'پرداخت کامل',
    partialStatus: 'پرداخت قسمی',
    debtStatus: 'قرض',
    returnsTitle: 'اقلام برگشتی',
    noReturns: 'برگشتی ثبت نشده است.',
  },
  ps: {
    title: 'د پلور رسید',
    printedAt: 'نېټه',
    prescription: 'نسخه',
    sale: 'پلور',
    customer: 'پیرودونکی',
    walkIn: 'حضوري پیرودونکی',
    phone: 'ټیلیفون',
    status: 'حالت',
    item: 'درمل',
    qty: 'شمېر',
    unitPrice: 'واحد بیه',
    total: 'مجموع',
    originalTotal: 'اصلي مجموع',
    returned: 'بېرته راوړل شوي',
    finalTotal: 'وروستی مجموع',
    paid: 'ورکړل شوي',
    debt: 'پاتې پور',
    profit: 'ګټه',
    print: 'چاپ',
    close: 'بندول',
    paidStatus: 'بشپړ تادیه',
    partialStatus: 'قسمي تادیه',
    debtStatus: 'پور',
    returnsTitle: 'بېرته ورکړل شوي توکي',
    noReturns: 'هیڅ بېرته ستنونه نشته.',
  },
  en: {
    title: 'Sales Receipt',
    printedAt: 'Date',
    prescription: 'Prescription',
    sale: 'Sale',
    customer: 'Customer',
    walkIn: 'Walk-in customer',
    phone: 'Phone',
    status: 'Status',
    item: 'Medicine',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    originalTotal: 'Original Total',
    returned: 'Returned',
    finalTotal: 'Final Total',
    paid: 'Paid',
    debt: 'Debt',
    profit: 'Profit',
    print: 'Print',
    close: 'Close',
    paidStatus: 'Paid in Full',
    partialStatus: 'Partial Payment',
    debtStatus: 'On Debt',
    returnsTitle: 'Returned Medicines',
    noReturns: 'No returned items recorded.',
  },
};

const statusTone: Record<SaleReceipt['status'], string> = {
  PAID: 'bg-emerald-100 text-emerald-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  DEBT: 'bg-rose-100 text-rose-800',
};

function formatMoney(value: number, locale: Locale) {
  return value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF');
}

function getStatusLabel(status: SaleReceipt['status'], locale: Locale) {
  if (status === 'PAID') {
    return copy[locale].paidStatus;
  }

  if (status === 'PARTIAL') {
    return copy[locale].partialStatus;
  }

  return copy[locale].debtStatus;
}

export function ReceiptModal({ isOpen, receipt, locale, onClose }: ReceiptModalProps) {
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !receipt) {
    return null;
  }

  return (
    <div className="receipt-print-shell fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl">
        <div
          className="print-hidden fixed inset-0"
          aria-hidden="true"
          onClick={onClose}
        />

        <section
          dir={dir}
          className="receipt-print-card relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <div className="receipt-print-actions print-hidden flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {tr.close}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              {tr.print}
            </button>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            <header className="flex flex-col gap-6 border-b border-dashed border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">
                  {tr.title}
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  {receipt.pharmacyName}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {tr.printedAt}: {formatDate(receipt.date, locale)}
                </p>
              </div>

              <div className="grid gap-3 text-sm text-slate-600 sm:text-end">
                <p>
                  <span className="font-semibold text-slate-900">{tr.sale}:</span> {receipt.saleId}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">{tr.prescription}:</span>{' '}
                  {receipt.prescriptionId}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">{tr.status}:</span>{' '}
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusTone[receipt.status]}`}>
                    {getStatusLabel(receipt.status, locale)}
                  </span>
                </p>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {tr.customer}
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {receipt.customer?.name ?? tr.walkIn}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {tr.phone}: {receipt.customer?.phone ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {tr.paid}
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-800">
                  {formatMoney(receipt.totals.paidAmount, locale)}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                  {tr.debt}
                </p>
                <p className="mt-2 text-2xl font-black text-rose-800">
                  {formatMoney(receipt.totals.debtAmount, locale)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold text-slate-500">{tr.item}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-500">{tr.qty}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-500">{tr.unitPrice}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-500">{tr.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.items.map((item) => (
                    <tr key={item.prescriptionItemId}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{item.medicineName}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.company}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-4 text-slate-700">{formatMoney(item.unitPrice, locale)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{formatMoney(item.total, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-dashed border-slate-200 p-5">
                <h3 className="text-lg font-bold text-slate-900">{tr.returnsTitle}</h3>
                {receipt.returns.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">{tr.noReturns}</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {receipt.returns.map((returned) => (
                      <div
                        key={returned.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-rose-900">{returned.medicineName}</p>
                          <p className="text-rose-700">
                            {returned.quantity} x {formatMoney(returned.amount / returned.quantity, locale)}
                          </p>
                        </div>
                        <div className="text-rose-800">
                          {formatMoney(returned.amount, locale)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{tr.originalTotal}</span>
                    <span className="font-semibold">{formatMoney(receipt.totals.originalTotalAmount, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{tr.returned}</span>
                    <span className="font-semibold text-rose-300">
                      {formatMoney(receipt.totals.totalReturnedAmount, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{tr.profit}</span>
                    <span className="font-semibold text-emerald-300">
                      {formatMoney(receipt.totals.profit, locale)}
                    </span>
                  </div>
                </div>

                <div className="my-4 border-t border-white/10" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{tr.finalTotal}</span>
                    <span className="text-lg font-bold">{formatMoney(receipt.totals.totalAmount, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{tr.paid}</span>
                    <span className="text-lg font-bold text-emerald-300">
                      {formatMoney(receipt.totals.paidAmount, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{tr.debt}</span>
                    <span className="text-lg font-bold text-rose-300">
                      {formatMoney(receipt.totals.debtAmount, locale)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
