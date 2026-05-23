'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  createExpense,
  deleteExpense,
  ExpenseCategory,
  ExpenseDailySummary,
  ExpenseMonthlySummary,
  ExpenseRecord,
  ExpenseYearlySummary,
  EXPENSE_CATEGORIES,
  getExpenseCategoryLabel,
  Locale,
  updateExpense,
  useExpenses,
} from '@/hooks/useExpenses';
import { ExpenseForm } from './components/ExpenseForm';

const copy = {
  fa: {
    title: 'مصارف و معاشات',
    subtitle: 'مصارف روزانه را ثبت کنید، تفکیک دسته بندی را ببینید و روند مصرف را در طول زمان دنبال کنید.',
    addExpense: 'ثبت مصرف',
    today: 'امروز',
    thisMonth: 'این ماه',
    thisYear: 'امسال',
    breakdown: 'تفکیک دسته بندی ماه جاری',
    breakdownHint: 'نمای سریع از این که کدام بخش بیشترین مصرف را دارد.',
    dateRange: 'بازه زمانی',
    category: 'دسته بندی',
    allCategories: 'همه دسته ها',
    fromDate: 'از تاریخ',
    toDate: 'تا تاریخ',
    apply: 'اعمال',
    reset: 'پاک کردن',
    expenseList: 'لیست مصارف',
    date: 'تاریخ',
    description: 'توضیحات',
    amount: 'مبلغ',
    actions: 'عملیات',
    edit: 'ویرایش',
    delete: 'حذف',
    deleteConfirm: 'آیا مطمئن هستید که می خواهید این مصرف را حذف کنید؟',
    loading: 'در حال بارگذاری مصارف...',
    failed: 'بارگذاری مصارف موفق نشد.',
    empty: 'هنوز هیچ مصرفی ثبت نشده است.',
    refreshFailed: 'بارگذاری خلاصه مصارف موفق نشد.',
  },
  ps: {
    title: 'لګښتونه او معاشونه',
    subtitle: 'ورځني لګښتونه ثبت کړئ، د کټګورۍ وېش وګورئ، او د وخت په اوږدو کې د لګښتونو بهیر تعقیب کړئ.',
    addExpense: 'لګښت ثبتول',
    today: 'نن',
    thisMonth: 'دا میاشت',
    thisYear: 'سږکال',
    breakdown: 'د روانې میاشتې د کټګورۍ وېش',
    breakdownHint: 'چټکه کتنه چې کومه برخه تر ټولو ډېر لګښت لري.',
    dateRange: 'د نېټې موده',
    category: 'کټګوري',
    allCategories: 'ټولې کټګورۍ',
    fromDate: 'له نېټې',
    toDate: 'تر نېټې',
    apply: 'پلي کول',
    reset: 'پاکول',
    expenseList: 'د لګښتونو لېست',
    date: 'نېټه',
    description: 'تشریح',
    amount: 'مبلغ',
    actions: 'عملیات',
    edit: 'سمول',
    delete: 'ړنګول',
    deleteConfirm: 'ایا تاسو ډاډه یاست چې دا لګښت ړنګ کړئ؟',
    loading: 'لګښتونه بارېږي...',
    failed: 'لګښتونه بار نه شول.',
    empty: 'لا تر اوسه هېڅ لګښت نه دی ثبت شوی.',
    refreshFailed: 'د لګښتونو لنډیز بار نه شو.',
  },
  en: {
    title: 'Expenses & Salaries',
    subtitle: 'Record daily expenses, review category breakdowns, and track spending over time.',
    addExpense: 'Add Expense',
    today: 'Today',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    breakdown: 'Current Month Category Breakdown',
    breakdownHint: 'A quick view of which area is consuming the most cash.',
    dateRange: 'Date Range',
    category: 'Category',
    allCategories: 'All Categories',
    fromDate: 'From Date',
    toDate: 'To Date',
    apply: 'Apply',
    reset: 'Reset',
    expenseList: 'Expense List',
    date: 'Date',
    description: 'Description',
    amount: 'Amount',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this expense?',
    loading: 'Loading expenses...',
    failed: 'Failed to load expenses.',
    empty: 'No expenses have been recorded yet.',
    refreshFailed: 'Failed to load expense summaries.',
  },
};

const categoryTone = {
  RENT: 'border-rose-100 bg-rose-50 text-rose-700',
  ELECTRICITY: 'border-amber-100 bg-amber-50 text-amber-700',
  SALARY: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  TRANSPORT: 'border-sky-100 bg-sky-50 text-sky-700',
  OTHER: 'border-slate-100 bg-slate-50 text-slate-700',
} satisfies Record<ExpenseCategory, string>;

function getLocale(language?: string): Locale {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const tr = copy[locale];
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const isAdmin = user?.role === 'ADMIN';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const { data, expenses, isLoading, error, refresh } = useExpenses({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    category: category || undefined,
  });

  const [dailySummary, setDailySummary] = useState<ExpenseDailySummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<ExpenseMonthlySummary | null>(null);
  const [yearlySummary, setYearlySummary] = useState<ExpenseYearlySummary | null>(null);
  const [summaryError, setSummaryError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const fetchSummaries = useCallback(async () => {
    setSummaryError('');

    try {
      const [dailyResponse, monthlyResponse, yearlyResponse] = await Promise.all([
        api.get<ExpenseDailySummary>('/expenses/summary/daily'),
        api.get<ExpenseMonthlySummary>('/expenses/summary/monthly'),
        api.get<ExpenseYearlySummary>('/expenses/summary/yearly'),
      ]);

      if (dailyResponse.success && dailyResponse.data) {
        setDailySummary(dailyResponse.data);
      }

      if (monthlyResponse.success && monthlyResponse.data) {
        setMonthlySummary(monthlyResponse.data);
      }

      if (yearlyResponse.success && yearlyResponse.data) {
        setYearlySummary(yearlyResponse.data);
      }

      if (!dailyResponse.success || !monthlyResponse.success || !yearlyResponse.success) {
        setSummaryError(tr.refreshFailed);
      }
    } catch {
      setSummaryError(tr.refreshFailed);
    }
  }, [tr.refreshFailed]);

  useEffect(() => {
    void fetchSummaries();
  }, [fetchSummaries]);

  const formatMoney = (value: number) =>
    `؋ ${value.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}`;

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'fa-AF');

  const handleReset = async () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
  };

  const openCreateForm = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const openEditForm = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm(tr.deleteConfirm)) {
      return;
    }

    const response = await deleteExpense(expenseId);

    if (response.success) {
      await Promise.all([refresh(), fetchSummaries()]);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tr.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500">{tr.subtitle}</p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {tr.addExpense}
        </button>
      </div>

      {summaryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-sm">
          <p className="text-sm text-slate-300">{tr.today}</p>
          <p className="mt-3 text-3xl font-bold">{formatMoney(dailySummary?.totalAmount ?? 0)}</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-300 to-orange-200 p-5 text-slate-900 shadow-sm">
          <p className="text-sm text-slate-700">{tr.thisMonth}</p>
          <p className="mt-3 text-3xl font-bold">{formatMoney(monthlySummary?.totalAmount ?? 0)}</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400 p-5 text-white shadow-sm">
          <p className="text-sm text-emerald-50">{tr.thisYear}</p>
          <p className="mt-3 text-3xl font-bold">{formatMoney(yearlySummary?.totalAmount ?? 0)}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{tr.breakdown}</h2>
          <p className="mt-1 text-sm text-gray-500">{tr.breakdownHint}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {(monthlySummary?.byCategory ?? []).map((row) => (
            <div
              key={row.category}
              className={`rounded-2xl border px-4 py-4 ${categoryTone[row.category]}`}
            >
              <p className="text-sm font-semibold">{getExpenseCategoryLabel(row.category, locale)}</p>
              <p className="mt-2 text-2xl font-bold">{formatMoney(row.totalAmount)}</p>
              <p className="mt-1 text-xs opacity-80">
                {row.count.toLocaleString(locale === 'en' ? 'en-US' : 'fa-AF')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{tr.dateRange}</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.fromDate}</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.toDate}</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{tr.category}</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ExpenseCategory | '')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{tr.allCategories}</option>
                {EXPENSE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {getExpenseCategoryLabel(item, locale)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => void refresh()}
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              {tr.apply}
            </button>
            <button
              onClick={() => void handleReset()}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {tr.reset}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tr.failed}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">{tr.expenseList}</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.loading}</div>
        ) : expenses.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">{tr.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[tr.date, tr.category, tr.description, tr.amount, tr.actions].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(expense.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryTone[expense.category]}`}>
                        {getExpenseCategoryLabel(expense.category, locale)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{expense.description ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-red-600">
                      {formatMoney(expense.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(expense)}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          {tr.edit}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => void handleDelete(expense.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            {tr.delete}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <ExpenseForm
          locale={locale}
          expense={editingExpense}
          onClose={() => setShowForm(false)}
          onSubmit={async (formData) => {
            const response = editingExpense
              ? await updateExpense(editingExpense.id, formData)
              : await createExpense(formData);

            if (response.success) {
              await Promise.all([refresh(), fetchSummaries()]);
            }

            return response;
          }}
        />
      )}
    </div>
  );
}
