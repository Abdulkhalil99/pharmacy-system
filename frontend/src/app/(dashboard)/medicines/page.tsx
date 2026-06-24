'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Medicine, MedicineFormData, MedicineStatus, useMedicines } from '@/hooks/useMedicines';
import { LowStockAlert } from './components/LowStockAlert';
import { MedicineForm } from './components/MedicineForm';
import { DRUG_KIND_LABELS } from '@pharmacy/shared';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: {
    title: 'مدیریت ادویه جات',
    add: 'افزودن دوا',
    search: 'جستجو بر اساس نام یا بارکد...',
    all: 'همه',
    lowStock: 'کمبود موجودی',
    expiring: 'در حال انقضا',
    expired: 'منقضی شده',
    name: 'نام',
    kind: 'نوع',
    barcode: 'بارکد',
    company: 'شرکت',
    buyPrice: 'قیمت خرید',
    sellPrice: 'قیمت فروش',
    quantity: 'موجودی',
    expiry: 'انقضا',
    status: 'وضعیت',
    actions: 'عملیات',
    edit: 'ویرایش',
    delete: 'حذف',
    confirmDelete: 'آیا مطمئن هستید؟',
    cancel: 'انصراف',
    noData: 'هیچ دوایی یافت نشد',
    loading: 'در حال بارگذاری...',
    normal: 'موجود',
    lowStockLabel: 'کمبود',
    expiringLabel: 'در حال انقضا',
    expiredLabel: 'منقضی',
    afn: 'افغانی',
    page: 'صفحه',
    of: 'از',
    totalMedicines: 'قلم دوا',
  },
  ps: {
    title: 'د درملو مدیریت',
    add: 'درمل زیاتول',
    search: 'د نوم یا بارکوډ له مخې ولټوئ...',
    all: 'ټول',
    lowStock: 'لږ ذخیره',
    expiring: 'پای ته رسیدونکي',
    expired: 'پای شوي',
    name: 'نوم',
    kind: 'ډول',
    barcode: 'بارکوډ',
    company: 'شرکت',
    buyPrice: 'د پېرود بیه',
    sellPrice: 'د پلور بیه',
    quantity: 'ذخیره',
    expiry: 'پای',
    status: 'حالت',
    actions: 'عملیات',
    edit: 'سمول',
    delete: 'ړنګول',
    confirmDelete: 'ایا ډاډه یاست؟',
    cancel: 'لغوه',
    noData: 'هیڅ درمل ونه موندل شول',
    loading: 'بارېږي...',
    normal: 'شته',
    lowStockLabel: 'کمه ذخیره',
    expiringLabel: 'د پای په حال کې',
    expiredLabel: 'پای شوی',
    afn: 'افغانۍ',
    page: 'پاڼه',
    of: 'له',
    totalMedicines: 'توکي',
  },
  en: {
    title: 'Medicine Management',
    add: 'Add Medicine',
    search: 'Search by name or barcode...',
    all: 'All',
    lowStock: 'Low Stock',
    expiring: 'Expiring Soon',
    expired: 'Expired',
    name: 'Name',
    kind: 'Kind',
    barcode: 'Barcode',
    company: 'Company',
    buyPrice: 'Buy Price',
    sellPrice: 'Sell Price',
    quantity: 'Quantity',
    expiry: 'Expiry',
    status: 'Status',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure?',
    cancel: 'Cancel',
    noData: 'No medicines found',
    loading: 'Loading...',
    normal: 'In Stock',
    lowStockLabel: 'Low Stock',
    expiringLabel: 'Expiring',
    expiredLabel: 'Expired',
    afn: 'AFN',
    page: 'Page',
    of: 'of',
    totalMedicines: 'medicines',
  },
};

const rowColor: Record<string, string> = {
  expired: 'bg-red-50 hover:bg-red-100',
  expiring: 'bg-orange-50 hover:bg-orange-100',
  low_stock: 'bg-amber-50 hover:bg-amber-100',
  normal: 'bg-white hover:bg-gray-50',
};

const statusBadge: Record<string, string> = {
  expired: 'bg-red-100 text-red-700',
  expiring: 'bg-orange-100 text-orange-700',
  low_stock: 'bg-amber-100 text-amber-700',
  normal: 'bg-green-100 text-green-700',
};

const summaryTone = {
  total: 'text-teal-600',
  lowStock: 'text-amber-600',
  expiringSoon: 'text-orange-600',
  expired: 'text-red-600',
};

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

function getMedicineStatus(medicine: Medicine): 'expired' | 'expiring' | 'low_stock' | 'normal' {
  const now = new Date();
  const expiry = new Date(medicine.expiryDate);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (expiry < now) return 'expired';
  if (expiry <= in30Days) return 'expiring';
  if (medicine.quantity <= medicine.minQuantity) return 'low_stock';
  return 'normal';
}

export default function MedicinesPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const {
    medicines,
    summary,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    totalPages,
    total,
    createMedicine,
    updateMedicine,
    deleteMedicine,
  } = useMedicines();

  const [showForm, setShowForm] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (data: MedicineFormData) => {
    if (editMedicine) {
      return updateMedicine(editMedicine.id, data);
    }

    return createMedicine(data);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    setDeleteLoading(true);
    await deleteMedicine(deleteId);
    setDeleteId(null);
    setDeleteLoading(false);
  };

  const openEdit = (medicine: Medicine) => {
    setEditMedicine(medicine);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditMedicine(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-5" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr.title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} {tr.totalMedicines}
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'PHARMACIST') && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            {tr.add}
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{locale === 'en' ? 'Total' : tr.all}</p>
            <p className={`mt-1 text-2xl font-bold ${summaryTone.total}`}>{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{tr.lowStock}</p>
            <p className={`mt-1 text-2xl font-bold ${summaryTone.lowStock}`}>{summary.lowStock}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{tr.expiring}</p>
            <p className={`mt-1 text-2xl font-bold ${summaryTone.expiringSoon}`}>{summary.expiringSoon}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{tr.expired}</p>
            <p className={`mt-1 text-2xl font-bold ${summaryTone.expired}`}>{summary.expired}</p>
          </div>
        </div>
      )}

      <LowStockAlert
        summary={summary}
        activeStatus={status}
        onFilterChange={setStatus}
        locale={locale}
      />

      <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative min-w-52 flex-1">
          <div className="pointer-events-none absolute inset-y-0 start-3 flex items-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tr.search}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 ps-9 pe-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'low_stock', 'expiring_soon', 'expired'] as MedicineStatus[]).map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => {
                setStatus(nextStatus);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                status === nextStatus
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {nextStatus === 'all'
                ? tr.all
                : nextStatus === 'low_stock'
                  ? tr.lowStock
                  : nextStatus === 'expiring_soon'
                    ? tr.expiring
                    : tr.expired}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">{tr.loading}</div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-red-500">
            {error}
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <svg className="mb-3 h-12 w-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            <p className="text-sm">{tr.noData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[tr.name, tr.kind, tr.barcode, tr.company, tr.buyPrice, tr.sellPrice, tr.quantity, tr.expiry, tr.status, tr.actions].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {medicines.map((medicine) => {
                  const medicineStatus = getMedicineStatus(medicine);
                  const statusLabel =
                    medicineStatus === 'expired'
                      ? tr.expiredLabel
                      : medicineStatus === 'expiring'
                        ? tr.expiringLabel
                        : medicineStatus === 'low_stock'
                          ? tr.lowStockLabel
                          : tr.normal;

                  return (
                    <tr key={medicine.id} className={`transition-colors ${rowColor[medicineStatus]}`}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{medicine.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {DRUG_KIND_LABELS[medicine.kind]?.[locale] ?? medicine.kind}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{medicine.barcode ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{medicine.company}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {medicine.buyPrice.toLocaleString()} {tr.afn}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {medicine.sellPrice.toLocaleString()} {tr.afn}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`font-semibold ${medicine.quantity <= medicine.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>
                          {medicine.quantity}
                        </span>
                        <span className="ms-1 text-xs text-gray-400">/ {medicine.minQuantity}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {new Date(medicine.expiryDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[medicineStatus]}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(medicine)}
                            className="rounded-lg p-1.5 text-teal-600 transition-colors hover:bg-teal-50"
                            title={tr.edit}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setDeleteId(medicine.id)}
                              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                              title={tr.delete}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              {tr.page} {page} {tr.of} {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                ‹
              </button>
              <button
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <p className="mb-5 font-semibold text-gray-900">{tr.confirmDelete}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                {tr.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? '...' : tr.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <MedicineForm
          medicine={editMedicine}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditMedicine(null);
          }}
          locale={locale}
        />
      )}
    </div>
  );
}
