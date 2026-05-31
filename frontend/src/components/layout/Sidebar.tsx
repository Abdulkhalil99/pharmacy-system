'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getRoleBadgeClasses, getRoleLabel, type SystemUserRole } from '@/lib/user-meta';

type Role = SystemUserRole;
type SectionKey = 'main' | 'management';

const navItems: Array<{
  href: string;
  labelKey: string;
  icon: ReactNode;
  roles: Role[];
  section: SectionKey;
}> = [
  {
    href: '/dashboard',
    labelKey: 'Navigation.dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/medicines',
    labelKey: 'Navigation.medicines',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
    section: 'main',
  },
  {
    href: '/alerts',
    labelKey: 'Navigation.alerts',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/sales',
    labelKey: 'Navigation.sales',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
    section: 'main',
  },
  {
    href: '/customers',
    labelKey: 'Navigation.customers',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/companies',
    labelKey: 'Navigation.companies',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
    section: 'main',
  },
  {
    href: '/cash',
    labelKey: 'Navigation.cash',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    roles: ['ADMIN', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/expenses',
    labelKey: 'Navigation.expenses',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['ADMIN', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/salaries',
    labelKey: 'Navigation.salaries',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2H9m0 0V9m0 4h6m-6 4h8" />
      </svg>
    ),
    roles: ['ADMIN', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/reports',
    labelKey: 'Navigation.reports',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST', 'CASHIER'],
    section: 'main',
  },
  {
    href: '/users',
    labelKey: 'Navigation.users',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['ADMIN'],
    section: 'management',
  },
  {
    href: '/employees',
    labelKey: 'Navigation.employees',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zm8-4h1m-5 0h1m-5 0h1" />
      </svg>
    ),
    roles: ['ADMIN', 'PHARMACIST'],
    section: 'management',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, dir } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const mainItems = visibleItems.filter((item) => item.section === 'main');
  const managementItems = visibleItems.filter((item) => item.section === 'management');

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-150 ${
          isActive
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-teal-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className={isActive ? 'text-white' : 'text-teal-300 group-hover:text-white'}>
          {item.icon}
        </span>
        {!collapsed ? <span className="text-sm font-medium">{t(item.labelKey)}</span> : null}
        {isActive && !collapsed ? (
          <span className="ms-auto h-1.5 w-1.5 rounded-full bg-teal-300" />
        ) : null}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div
      className="flex h-full flex-col bg-[radial-gradient(circle_at_top,#134e4a,transparent_32%),linear-gradient(180deg,#0f3f39_0%,#062a26_100%)]"
      dir={dir}
    >
      <div className="flex items-center justify-between border-b border-teal-700/40 px-4 py-5">
        {!collapsed ? (
          <div>
            <p className="text-sm font-bold leading-tight text-white">{t('Brand.name')}</p>
            <p className="mt-0.5 text-xs text-teal-300">v1.0</p>
          </div>
        ) : null}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-teal-300 transition-colors hover:bg-teal-700/50 hover:text-white lg:flex"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-1">{mainItems.map(renderNavItem)}</div>

        {managementItems.length > 0 ? (
          <div className="mt-6">
            {!collapsed ? (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-400/80">
                {t('Navigation.management')}
              </p>
            ) : null}
            <div className="space-y-1">{managementItems.map(renderNavItem)}</div>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-teal-700/40 p-3">
        {!collapsed ? (
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
        ) : null}

        <div className={`rounded-2xl border border-white/10 bg-white/10 p-3 ${collapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500/90 text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                {user?.role ? (
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRoleBadgeClasses(user.role as SystemUserRole)}`}
                  >
                    {getRoleLabel(user.role as SystemUserRole, dir === 'ltr' ? 'en' : user?.language === 'ps' ? 'ps' : 'fa')}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {!collapsed ? (
            <div className="mt-3 grid gap-2">
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-teal-100 transition-colors hover:bg-white/15 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 006 18h12a4 4 0 00.879-.196m-13.758 0A4 4 0 014 14V8a4 4 0 014-4h8a4 4 0 014 4v6a4 4 0 01-1.121 3.804m-13.758 0L9 14m6 0 3.879 3.804M9 10h6" />
                </svg>
                <span>{t('Navigation.myProfile')}</span>
              </Link>

              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/20 hover:text-red-100"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{t('Common.logout')}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="mt-3 flex w-full justify-center rounded-xl bg-red-500/10 px-2 py-2 text-red-200 transition-colors hover:bg-red-500/20 hover:text-red-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed right-4 top-4 z-40 rounded-xl bg-teal-900 p-2 text-white shadow-lg lg:hidden"
        aria-label="Open navigation"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-72 max-w-[85vw]" onClick={(event) => event.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      ) : null}

      <aside className={`hidden lg:block ${collapsed ? 'w-24' : 'w-72'} transition-all duration-200`}>
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
