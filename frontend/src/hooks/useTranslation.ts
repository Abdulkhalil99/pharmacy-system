'use client';

import type { Locale } from '@pharmacy/shared';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection } from '@/i18n/config';

export function useTranslation(namespace?: Parameters<typeof useTranslations>[0]) {
  const t = useTranslations(namespace);
  const locale = useLocale() as Locale;
  const dir = getDirection(locale);

  return {
    t,
    locale,
    dir,
  };
}
