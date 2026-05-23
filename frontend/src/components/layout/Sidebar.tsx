'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  {
    href: '/dashboard',
    label: { fa: 'داشبورد', ps: 'ډشبورډ', en: 'Dashboard' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
  },
  {
    href: '/medicines',
    label: { fa: 'ادویه جات', ps: 'درمل', en: 'Medicines' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
  },
  {
    href: '/sales',
    label: { fa: 'فروش و نسخه ها', ps: 'پلور او نسخې', en: 'Sales & Rx' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
  },
  {
    href: '/customers',
    label: { fa: 'مشتریان', ps: 'پیرودونکي', en: 'Customers' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
  },
  {
    href: '/companies',
    label: { fa: 'شرکت ها', ps: 'شرکتونه', en: 'Companies' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
  },
  {
    href: '/cash',
    label: { fa: 'صندوق', ps: 'کیسه', en: 'Cash Register' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    href: '/expenses',
    label: { fa: 'مصارف', ps: 'لګښتونه', en: 'Expenses' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    href: '/reports',
    label: { fa: 'گزارشات', ps: 'راپورونه', en: 'Reports' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    roles: ['ADMIN'],
  },
  {
    href: '/users',
    label: { fa: 'کاربران', ps: 'کاروونکي', en: 'Users' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    ),
    roles: ['ADMIN'],
  },
];

const roleLabels: Record<string, Record<string, string>> = {
  ADMIN:       { fa: 'مدیر سیستم', ps: 'سیستم مدیر', en: 'Admin' },
  PHARMACIST:  { fa: 'داروساز',    ps: 'درملساز',    en: 'Pharmacist' },
  CASHIER:     { fa: 'صندوقدار',  ps: 'کیسه وال',   en: 'Cashier' },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { language } = useAuth();
  const locale = language as 'fa' | 'ps' | 'en';
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full bg-gradient-to-b from-teal-900 to-teal-950"
      dir={dir}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-teal-700/50">
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              {locale === 'en' ? 'Pharmacy System' : 'سیستم دواخانه'}
            </p>
            <p className="text-teal-300 text-xs mt-0.5">v1.0</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 text-teal-300 hover:text-white hover:bg-teal-700/50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-teal-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-teal-300 group-hover:text-white'}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label[locale]}</span>
              )}
              {isActive && !collapsed && (
                <span className="ms-auto w-1.5 h-1.5 rounded-full bg-teal-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-teal-700/50 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-teal-300 text-xs truncate">
                {user?.role ? roleLabels[user.role][locale] : ''}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={`mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-teal-200 hover:bg-red-500/20 hover:text-red-300 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {!collapsed && (
            <span className="text-sm">
              {locale === 'en' ? 'Logout' : locale === 'fa' ? 'خروج' : 'وتل'}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 start-4 z-50 w-12 h-12 bg-teal-600 text-white rounded-2xl shadow-lg flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 start-0 z-50 w-64 shadow-2xl">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
