import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@pharmacy/shared';
import { AuthProvider } from '@/contexts/AuthContext';
import { getDirection, getLanguageTag, isLocale } from '@/i18n/config';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Brand');

  return {
    title: {
      default: t('name'),
      template: `%s | ${t('shortName')}`,
    },
    description: t('name'),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const localeFromRequest = await getLocale();
  const locale: Locale = isLocale(localeFromRequest) ? localeFromRequest : 'fa';
  const dir = getDirection(locale);
  const lang = getLanguageTag(locale);

  return (
    <html
      lang={lang}
      dir={dir}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen bg-gray-50 text-gray-900 antialiased ${
          dir === 'rtl' ? 'font-arabic' : 'font-latin'
        }`}
      >
        <NextIntlClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
