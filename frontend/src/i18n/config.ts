import type { Locale } from '@pharmacy/shared';
import { RTL_LOCALES } from '@pharmacy/shared';

export const LOCALES = ['fa', 'ps', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'fa';
export const LOCALE_COOKIE_NAME = 'PHARMACY_LOCALE';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fa: 'دری',
  ps: 'پښتو',
};

export const LOCALE_LANGUAGE_TAGS: Record<Locale, string> = {
  fa: 'fa-AF',
  ps: 'ps-AF',
  en: 'en',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'fa' || value === 'ps' || value === 'en';
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

export function getLanguageTag(locale: Locale): string {
  return LOCALE_LANGUAGE_TAGS[locale];
}
