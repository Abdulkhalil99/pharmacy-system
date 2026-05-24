'use client';

import { getLocaleFromLanguage, getRoleBadgeClasses, getRoleLabel, type SystemLanguage, type SystemUserRole } from '@/lib/user-meta';

interface RoleBadgeProps {
  role: SystemUserRole;
  language?: string;
}

export function RoleBadge({ role, language }: RoleBadgeProps) {
  const locale: SystemLanguage = getLocaleFromLanguage(language);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClasses(role)}`}
    >
      {getRoleLabel(role, locale)}
    </span>
  );
}
