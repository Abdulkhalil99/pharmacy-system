'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiResponse } from '@/lib/api';

export type ExpenseCategory = 'RENT' | 'ELECTRICITY' | 'SALARY' | 'TRANSPORT' | 'OTHER';
export type Locale = 'fa' | 'ps' | 'en';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'RENT',
  'ELECTRICITY',
  'SALARY',
  'TRANSPORT',
  'OTHER',
];

export const expenseCategoryLabels: Record<ExpenseCategory, Record<Locale, string>> = {
  RENT: {
    fa: 'کرایه',
    ps: 'کرایه',
    en: 'Rent',
  },
  ELECTRICITY: {
    fa: 'برق',
    ps: 'برېښنا',
    en: 'Electricity',
  },
  SALARY: {
    fa: 'معاش',
    ps: 'معاش',
    en: 'Salary',
  },
  TRANSPORT: {
    fa: 'ترانسپورت',
    ps: 'ترانسپورت',
    en: 'Transport',
  },
  OTHER: {
    fa: 'دیگر',
    ps: 'نور',
    en: 'Other',
  },
};

export interface ExpenseUser {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CASHIER';
}

export interface ExpenseRecord {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  user: ExpenseUser;
}

export interface ExpenseCategoryBreakdownRow {
  category: ExpenseCategory;
  totalAmount: number;
  count: number;
}

export interface ExpenseListResponse {
  expenses: ExpenseRecord[];
  summary: {
    totalAmount: number;
    count: number;
    byCategory: ExpenseCategoryBreakdownRow[];
  };
  filters: {
    startDate: string | null;
    endDate: string | null;
    category: ExpenseCategory | null;
  };
}

export interface ExpenseDailySummary {
  period: 'daily';
  date: string;
  totalAmount: number;
  count: number;
  byCategory: ExpenseCategoryBreakdownRow[];
  expenses: ExpenseRecord[];
}

export interface ExpenseMonthlySummary {
  period: 'monthly';
  month: number;
  year: number;
  range: {
    start: string;
    end: string;
  };
  totalAmount: number;
  count: number;
  byCategory: ExpenseCategoryBreakdownRow[];
  byDay: Array<{
    date: string;
    totalAmount: number;
  }>;
  recentExpenses: ExpenseRecord[];
}

export interface ExpenseYearlySummary {
  period: 'yearly';
  year: number;
  range: {
    start: string;
    end: string;
  };
  totalAmount: number;
  count: number;
  byCategory: ExpenseCategoryBreakdownRow[];
  byMonth: Array<{
    month: string;
    totalAmount: number;
  }>;
  recentExpenses: ExpenseRecord[];
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date?: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}

export async function createExpense(data: ExpenseFormData) {
  return api.post<ExpenseRecord>('/expenses', data);
}

export async function updateExpense(id: string, data: Partial<ExpenseFormData>) {
  return api.put<ExpenseRecord>(`/expenses/${id}`, data);
}

export async function deleteExpense(id: string) {
  return api.delete(`/expenses/${id}`);
}

export function getExpenseCategoryLabel(category: ExpenseCategory, locale: Locale) {
  return expenseCategoryLabels[category][locale];
}

export function useExpenses(filters?: ExpenseFilters) {
  const [data, setData] = useState<ExpenseListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = filters?.startDate ?? '';
  const endDate = filters?.endDate ?? '';
  const category = filters?.category ?? '';

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (startDate) {
        params.set('startDate', startDate);
      }

      if (endDate) {
        params.set('endDate', endDate);
      }

      if (category) {
        params.set('category', category);
      }

      const query = params.toString();
      const response = await api.get<ExpenseListResponse>(`/expenses${query ? `?${query}` : ''}`);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
        setError(response.message || 'Failed to fetch expenses');
      }
    } catch {
      setData(null);
      setError('Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  }, [category, endDate, startDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    expenses: data?.expenses ?? [],
    isLoading,
    error,
    refresh,
  };
}

export type ExpenseApiResponse<T = unknown> = Promise<ApiResponse<T>>;
