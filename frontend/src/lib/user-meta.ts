export type SystemUserRole = 'ADMIN' | 'PHARMACIST' | 'CASHIER';
export type SystemLanguage = 'fa' | 'ps' | 'en';

export function getLocaleFromLanguage(language?: string): SystemLanguage {
  if (language === 'en' || language === 'ps') {
    return language;
  }

  return 'fa';
}

export function getDirectionFromLanguage(language?: string): 'rtl' | 'ltr' {
  return getLocaleFromLanguage(language) === 'en' ? 'ltr' : 'rtl';
}

export function getRoleLabel(role: SystemUserRole, locale: SystemLanguage): string {
  const labels: Record<SystemLanguage, Record<SystemUserRole, string>> = {
    fa: {
      ADMIN: 'ادمین',
      PHARMACIST: 'داروساز',
      CASHIER: 'صندوقدار',
    },
    ps: {
      ADMIN: 'ادمین',
      PHARMACIST: 'درملساز',
      CASHIER: 'کیسه وال',
    },
    en: {
      ADMIN: 'Admin',
      PHARMACIST: 'Pharmacist',
      CASHIER: 'Cashier',
    },
  };

  return labels[locale][role];
}

export function getLanguageLabel(
  language: SystemLanguage,
  locale: SystemLanguage
): string {
  const labels: Record<SystemLanguage, Record<SystemLanguage, string>> = {
    fa: {
      fa: 'دری',
      ps: 'پښتو',
      en: 'انگلیسی',
    },
    ps: {
      fa: 'دری',
      ps: 'پښتو',
      en: 'انګلیسي',
    },
    en: {
      fa: 'Dari',
      ps: 'Pashto',
      en: 'English',
    },
  };

  return labels[locale][language];
}

export function getRoleBadgeClasses(role: SystemUserRole): string {
  if (role === 'ADMIN') {
    return 'border border-red-200 bg-red-50 text-red-700';
  }

  if (role === 'PHARMACIST') {
    return 'border border-blue-200 bg-blue-50 text-blue-700';
  }

  return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
}
