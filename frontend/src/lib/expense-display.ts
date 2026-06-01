export type ExpenseDisplayLocale = 'fa' | 'ps' | 'en';

const salaryExpensePattern = /^Salary paid to (.+?)(?: \| (.*))?$/u;

const salaryExpenseCopy: Record<
  ExpenseDisplayLocale,
  {
    paidTo: (employeeName: string) => string;
  }
> = {
  fa: {
    paidTo: (employeeName) => `معاش برای ${employeeName} پرداخت شد`,
  },
  ps: {
    paidTo: (employeeName) => `${employeeName} ته معاش ورکړل شو`,
  },
  en: {
    paidTo: (employeeName) => `Salary paid to ${employeeName}`,
  },
};

export function formatExpenseDescription(
  description: string | null | undefined,
  category: string | null | undefined,
  locale: ExpenseDisplayLocale
) {
  const rawDescription = description?.trim();

  if (!rawDescription) {
    return null;
  }

  if (category !== 'SALARY') {
    return rawDescription;
  }

  const salaryMatch = salaryExpensePattern.exec(rawDescription);

  if (!salaryMatch) {
    return rawDescription;
  }

  const employeeName = salaryMatch[1]?.trim();
  const note = salaryMatch[2]?.trim();

  if (!employeeName) {
    return rawDescription;
  }

  const translatedDescription = salaryExpenseCopy[locale].paidTo(employeeName);

  return note ? `${translatedDescription} | ${note}` : translatedDescription;
}
