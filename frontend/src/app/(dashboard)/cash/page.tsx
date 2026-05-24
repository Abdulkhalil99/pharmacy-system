'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiResponse, api } from '@/lib/api';
import { DailyReport } from './components/DailyReport';
import { TransferForm } from './components/TransferForm';
import {
  CashRegisterSnapshot,
  DailyCashReport,
  TransfersResponse,
  formatDate,
  formatDateTime,
  formatMoney,
  getDirection,
  getLocale,
} from './cash.shared';

const copy = {
  fa: {
    title: 'داشبورد صندوق',
    subtitle: 'موجودی امروز، انتقالات، و گزارش روزانه نقدی را از یک صفحه مدیریت کنید.',
    today: 'امروز',
    refresh: 'بارگذاری دوباره',
    openRegister: 'باز کردن صندوق',
    closeRegister: 'بستن صندوق',
    transferMoney: 'انتقال پول',
    transferHistory: 'همه انتقالات',
    openingBalance: 'بیلانس افتتاحیه',
    salesRevenue: 'عواید فروش امروز',
    expenses: 'مصارف امروز',
    transfersOut: 'انتقالات خروجی امروز',
    currentCash: 'نقد موجود در صندوق',
    amount: 'مبلغ',
    note: 'یادداشت',
    notePlaceholder: 'یادداشت اختیاری برای آغاز یا ختم روز',
    openHint: 'صندوق هنوز برای امروز باز نشده است.',
    closeHint: 'بیلانس مورد انتظار را با موجودی واقعی مقایسه کنید، سپس صندوق را ببندید.',
    recentTransfers: 'انتقالات اخیر',
    destination: 'مقصد',
    reason: 'دلیل',
    by: 'ثبت کننده',
    date: 'تاریخ',
    emptyTransfers: 'هنوز هیچ انتقالی ثبت نشده است.',
    loading: 'اطلاعات صندوق در حال بارگذاری است...',
    failed: 'بارگذاری اطلاعات صندوق موفق نشد.',
    save: 'ثبت',
    saving: 'در حال ثبت...',
    openStatus: 'صندوق باز است',
    closedStatus: 'صندوق بسته شده است',
    unopenedStatus: 'صندوق هنوز باز نشده است',
    expectedClosing: 'بیلانس محاسبه شده سیستم',
    recordedClosing: 'بیلانس ثبت شده',
    adminOnly: 'این کنترل فقط برای مدیر سیستم فعال است.',
    registerNote: 'یادداشت روز',
    cashDate: 'تاریخ کاری',
    openSuccess: 'صندوق امروز باز شد.',
    closeSuccess: 'صندوق امروز بسته شد.',
    transferDisabled: 'برای ثبت انتقال، اول صندوق امروز را باز کنید.',
  },
  ps: {
    title: 'د صندوق ډشبورډ',
    subtitle: 'د نن ورځې موجودي، لېږدونه، او ورځنی نغدي راپور له یوې پاڼې اداره کړئ.',
    today: 'نن',
    refresh: 'بیا بارول',
    openRegister: 'صندوق پرانیستل',
    closeRegister: 'صندوق تړل',
    transferMoney: 'د پیسو لېږد',
    transferHistory: 'ټول لېږدونه',
    openingBalance: 'پیلیز بیلانس',
    salesRevenue: 'د نن ورځې پلور عاید',
    expenses: 'د نن ورځې لګښتونه',
    transfersOut: 'د نن ورځې وتلي لېږدونه',
    currentCash: 'په صندوق کې اوسنۍ نغدي',
    amount: 'مبلغ',
    note: 'یادښت',
    notePlaceholder: 'د ورځې د پیل یا پای لپاره اختیاري یادښت',
    openHint: 'صندوق لا د نن ورځې لپاره نه دی پرانیستل شوی.',
    closeHint: 'تمه شوې موجودي له واقعي موجودۍ سره پرتله کړئ، بیا صندوق وتړئ.',
    recentTransfers: 'وروستي لېږدونه',
    destination: 'مقصد',
    reason: 'دلیل',
    by: 'ثبتوونکی',
    date: 'نېټه',
    emptyTransfers: 'تر اوسه هېڅ لېږد نه دی ثبت شوی.',
    loading: 'د صندوق معلومات بارېږي...',
    failed: 'د صندوق معلومات بار نه شول.',
    save: 'ثبتول',
    saving: 'ثبتېږي...',
    openStatus: 'صندوق پرانیستی دی',
    closedStatus: 'صندوق تړل شوی دی',
    unopenedStatus: 'صندوق لا نه دی پرانیستل شوی',
    expectedClosing: 'د سیستم محاسبه شوی بیلانس',
    recordedClosing: 'ثبت شوی بیلانس',
    adminOnly: 'دا کنټرول یوازې د سیسټم مدیر لپاره فعال دی.',
    registerNote: 'د ورځې یادښت',
    cashDate: 'کاري نېټه',
    openSuccess: 'د نن صندوق پرانیستل شو.',
    closeSuccess: 'د نن صندوق وتړل شو.',
    transferDisabled: 'د لېږد لپاره لومړی د نن صندوق پرانیزئ.',
  },
  en: {
    title: 'Cash Register Dashboard',
    subtitle: 'Manage today’s balance, transfers, and daily cash report from one page.',
    today: 'Today',
    refresh: 'Refresh',
    openRegister: 'Open Register',
    closeRegister: 'Close Register',
    transferMoney: 'Transfer Money',
    transferHistory: 'All Transfers',
    openingBalance: 'Opening Balance',
    salesRevenue: 'Today’s Sales Revenue',
    expenses: 'Today’s Expenses',
    transfersOut: 'Today’s Transfers Out',
    currentCash: 'Current Cash in Hand',
    amount: 'Amount',
    note: 'Note',
    notePlaceholder: 'Optional note for the start or end of the day',
    openHint: 'The register has not been opened for today yet.',
    closeHint: 'Compare the expected balance with the real cash, then close the register.',
    recentTransfers: 'Recent Transfers',
    destination: 'Destination',
    reason: 'Reason',
    by: 'Recorded By',
    date: 'Date',
    emptyTransfers: 'No transfers have been recorded yet.',
    loading: 'Loading cash register data...',
    failed: 'Failed to load cash register data.',
    save: 'Save',
    saving: 'Saving...',
    openStatus: 'Register is open',
    closedStatus: 'Register is closed',
    unopenedStatus: 'Register not opened yet',
    expectedClosing: 'System Expected Closing',
    recordedClosing: 'Recorded Closing',
    adminOnly: 'These controls are available to the system admin only.',
    registerNote: 'Day Note',
    cashDate: 'Business Date',
    openSuccess: 'Today’s register was opened.',
    closeSuccess: 'Today’s register was closed.',
    transferDisabled: 'Open today’s register before recording a transfer.',
  },
};

const summaryCardStyles = [
  'from-slate-900 via-slate-800 to-slate-700 text-white',
  'from-emerald-500 via-emerald-400 to-teal-400 text-white',
  'from-amber-400 via-orange-300 to-orange-200 text-slate-900',
  'from-indigo-500 via-sky-500 to-cyan-400 text-white',
  'from-white via-white to-slate-50 text-slate-900 border border-slate-200',
];

export default function CashDashboardPage() {
  const { user } = useAuth();
  const locale = getLocale(user?.language);
  const dir = getDirection(locale);
  const tr = copy[locale];
  const isAdmin = user?.role === 'ADMIN';

  const [todayStatus, setTodayStatus] = useState<CashRegisterSnapshot | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyCashReport | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<TransfersResponse['transfers']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [openAmount, setOpenAmount] = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [registerNote, setRegisterNote] = useState('');
  const [isSavingAction, setIsSavingAction] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [todayResponse, transfersResponse, dailyReportResponse] = await Promise.all([
        api.get<CashRegisterSnapshot>('/cash/today'),
        api.get<TransfersResponse>('/cash/transfers?limit=5'),
        api.get<DailyCashReport>('/cash/report/daily'),
      ]);

      if (!todayResponse.success || !todayResponse.data) {
        setError(todayResponse.message || tr.failed);
        setTodayStatus(null);
        setDailyReport(null);
        setRecentTransfers([]);
        return;
      }

      setTodayStatus(todayResponse.data);
      setDailyReport(dailyReportResponse.success ? dailyReportResponse.data ?? null : null);
      setRecentTransfers(transfersResponse.success && transfersResponse.data
        ? transfersResponse.data.transfers
        : []);
    } catch {
      setError(tr.failed);
      setTodayStatus(null);
      setDailyReport(null);
      setRecentTransfers([]);
    } finally {
      setIsLoading(false);
    }
  }, [tr.failed]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (todayStatus?.isOpen) {
      setCloseAmount(String(todayStatus.expectedClosingBalance));
      setRegisterNote(todayStatus.note ?? '');
      return;
    }

    if (!todayStatus?.isOpened) {
      setOpenAmount('');
      setRegisterNote('');
      return;
    }

    setRegisterNote(todayStatus?.note ?? '');
  }, [todayStatus]);

  const summaryCards = [
    {
      label: tr.openingBalance,
      value: todayStatus?.openingBalance ?? 0,
      tone: 'text-white',
    },
    {
      label: tr.salesRevenue,
      value: todayStatus?.totalSales ?? 0,
      tone: 'text-white',
    },
    {
      label: tr.expenses,
      value: todayStatus?.totalExpenses ?? 0,
      tone: 'text-slate-900',
    },
    {
      label: tr.transfersOut,
      value: todayStatus?.totalTransfersOut ?? 0,
      tone: 'text-white',
    },
    {
      label: tr.currentCash,
      value: todayStatus?.currentCashInHand ?? 0,
      tone: 'text-slate-900',
    },
  ];

  const statusLabel = todayStatus?.isClosed
    ? tr.closedStatus
    : todayStatus?.isOpen
      ? tr.openStatus
      : tr.unopenedStatus;
  const recordedClosingBalance = todayStatus?.recordedClosingBalance;

  const handleOpenRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError('');
    setActionSuccess('');
    setIsSavingAction(true);

    const response = await api.post<CashRegisterSnapshot>('/cash/open', {
      openingBalance: Number(openAmount),
      note: registerNote.trim() || undefined,
    });

    if (response.success) {
      setActionSuccess(tr.openSuccess);
      await fetchDashboard();
    } else {
      setActionError(response.message || tr.failed);
    }

    setIsSavingAction(false);
  };

  const handleCloseRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError('');
    setActionSuccess('');
    setIsSavingAction(true);

    const response = await api.post<CashRegisterSnapshot>('/cash/close', {
      closingBalance: Number(closeAmount),
      note: registerNote.trim() || undefined,
    });

    if (response.success) {
      setActionSuccess(tr.closeSuccess);
      await fetchDashboard();
    } else {
      setActionError(response.message || tr.failed);
    }

    setIsSavingAction(false);
  };

  const handleTransferSubmit = async (data: {
    amount: number;
    fromAccount: 'PHARMACY';
    toAccount: string;
    reason?: string;
    date: string;
  }): Promise<ApiResponse<unknown>> => {
    setActionError('');
    setActionSuccess('');

    const response = await api.post('/cash/transfer', data);

    if (response.success) {
      await fetchDashboard();
    }

    return response;
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.22),_transparent_35%),linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_48%,_#0f766e_100%)] px-6 py-7 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-100">
              {tr.today} • {todayStatus ? formatDate(todayStatus.date, locale) : ''}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{tr.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-cyan-50/85">{tr.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              {tr.refresh}
            </button>
            <button
              type="button"
              onClick={() => setShowTransferForm(true)}
              disabled={!todayStatus?.isOpen}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-slate-600"
            >
              {tr.transferMoney}
            </button>
            <Link
              href="/cash/transfers"
              className="rounded-full border border-white/20 bg-slate-950/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-950/40"
            >
              {tr.transferHistory}
            </Link>
          </div>
        </div>

        {!todayStatus?.isOpen && (
          <p className="mt-4 text-sm text-cyan-100/90">{tr.transferDisabled}</p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {(actionError || actionSuccess) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            actionError
              ? 'border border-rose-200 bg-rose-50 text-rose-700'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {actionError || actionSuccess}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card, index) => (
          <div
            key={card.label}
            className={`overflow-hidden rounded-[28px] bg-gradient-to-br px-5 py-5 shadow-sm ${summaryCardStyles[index]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
              {card.label}
            </p>
            <p className={`mt-4 text-3xl font-bold ${card.tone}`}>
              {formatMoney(card.value, locale)}
            </p>
            <p className="mt-2 text-xs opacity-75">
              {todayStatus ? `${tr.cashDate}: ${formatDate(todayStatus.date, locale)}` : '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{tr.recentTransfers}</h2>
              <p className="mt-1 text-sm text-slate-500">{tr.today}</p>
            </div>
            <Link
              href="/cash/transfers"
              className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
            >
              {tr.transferHistory}
            </Link>
          </div>

          {recentTransfers.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              {tr.emptyTransfers}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">{tr.date}</th>
                    <th className="px-4 py-3 text-start font-medium">{tr.destination}</th>
                    <th className="px-4 py-3 text-start font-medium">{tr.reason}</th>
                    <th className="px-4 py-3 text-start font-medium">{tr.by}</th>
                    <th className="px-4 py-3 text-start font-medium">{tr.amount}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransfers.map((transfer) => (
                    <tr key={transfer.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">
                        {formatDateTime(transfer.date, locale)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{transfer.toAccount}</td>
                      <td className="px-4 py-3 text-slate-600">{transfer.reason ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{transfer.user.name}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">
                        {formatMoney(transfer.amount, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isAdmin ? (todayStatus?.isOpen ? tr.closeRegister : tr.openRegister) : tr.registerNote}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? todayStatus?.isOpen
                    ? tr.closeHint
                    : tr.openHint
                  : tr.adminOnly}
              </p>
            </div>
            {todayStatus?.openedAt && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {formatDateTime(todayStatus.openedAt, locale)}
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {tr.expectedClosing}
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatMoney(todayStatus?.expectedClosingBalance ?? 0, locale)}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {tr.recordedClosing}
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {recordedClosingBalance == null
                  ? '—'
                  : formatMoney(recordedClosingBalance, locale)}
              </p>
            </div>
          </div>

          {isAdmin ? (
            todayStatus?.isOpen ? (
              <form onSubmit={handleCloseRegister} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{tr.amount}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={closeAmount}
                    onChange={(event) => setCloseAmount(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{tr.note}</label>
                  <textarea
                    value={registerNote}
                    onChange={(event) => setRegisterNote(event.target.value)}
                    rows={4}
                    placeholder={tr.notePlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingAction}
                  className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:bg-slate-400"
                >
                  {isSavingAction ? tr.saving : tr.closeRegister}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOpenRegister} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{tr.amount}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={openAmount}
                    onChange={(event) => setOpenAmount(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{tr.note}</label>
                  <textarea
                    value={registerNote}
                    onChange={(event) => setRegisterNote(event.target.value)}
                    rows={4}
                    placeholder={tr.notePlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingAction}
                  className="rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-slate-400"
                >
                  {isSavingAction ? tr.saving : tr.openRegister}
                </button>
              </form>
            )
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
              {tr.adminOnly}
            </div>
          )}
        </section>
      </div>

      <DailyReport locale={locale} report={dailyReport} />

      {showTransferForm && todayStatus && (
        <TransferForm
          locale={locale}
          availableBalance={todayStatus.currentCashInHand}
          onClose={() => setShowTransferForm(false)}
          onSubmit={handleTransferSubmit}
        />
      )}

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {tr.loading}
        </div>
      )}
    </div>
  );
}
