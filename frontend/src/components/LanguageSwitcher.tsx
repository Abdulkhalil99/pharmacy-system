'use client';

import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import type { Locale } from '@pharmacy/shared';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_LABELS,
  getDirection,
  getLanguageTag,
  isLocale,
} from '@/i18n/config';
import { useTranslation } from '@/hooks/useTranslation';

const options: Array<{ locale: Locale; icon: string }> = [
  { locale: 'en', icon: 'EN' },
  { locale: 'fa', icon: 'د' },
  { locale: 'ps', icon: 'پ' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const { language, setLanguage } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentLocale: Locale = isLocale(language) ? language : DEFAULT_LOCALE;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyLocaleToDocument = (locale: Locale) => {
    document.documentElement.lang = getLanguageTag(locale);
    document.documentElement.dir = getDirection(locale);
  };

  const handleSelect = (locale: Locale) => {
    setLanguage(locale);
    localStorage.setItem('pharmacy_language', locale);
    Cookies.set(LOCALE_COOKIE_NAME, locale, {
      expires: 365,
      sameSite: 'strict',
      path: '/',
    });
    applyLocaleToDocument(locale);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/15"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-teal-300" />
          <span>{t('Common.language')}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-100">
            {LOCALE_LABELS[currentLocale]}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute inset-x-0 bottom-full z-30 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.4)]"
          role="listbox"
          aria-label={t('Common.switchLanguage')}
        >
          {options.map((option) => {
            const isActive = option.locale === currentLocale;

            return (
              <button
                key={option.locale}
                type="button"
                onClick={() => handleSelect(option.locale)}
                className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {option.icon}
                  </span>
                  <span>{t(`Languages.${option.locale}`)}</span>
                </span>
                {isActive ? <Check className="h-4 w-4 text-teal-600" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
