'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiResponse } from '@/lib/api';

export interface SalaryUser {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CASHIER';
}

export interface SalaryPaymentRecord {
  id: string;
  userId: string;
  employeeName: string;
  amount: number;
  month: number;
  year: number;
  note: string | null;
  date: string;
  createdAt: string;
  user: SalaryUser;
}

export interface SalaryListResponse {
  salaries: SalaryPaymentRecord[];
  summary: {
    totalAmount: number;
    count: number;
  };
  employeeNames: string[];
  filters: {
    employeeName: string | null;
    month: number | null;
    year: number | null;
  };
}

export interface SalarySummaryResponse {
  month: number;
  year: number;
  range: {
    start: string;
    end: string;
  };
  totalAmount: number;
  count: number;
  byEmployee: Array<{
    employeeName: string;
    totalAmount: number;
    count: number;
  }>;
  recentPayments: SalaryPaymentRecord[];
}

export interface SalaryEmployeeHistoryResponse {
  employeeName: string;
  salaries: SalaryPaymentRecord[];
  summary: {
    totalAmount: number;
    count: number;
    lastPaymentDate: string | null;
  };
}

export interface SalaryPaymentFormData {
  employeeName: string;
  amount: number;
  month: number;
  year: number;
  note?: string;
}

export interface SalaryFilters {
  employeeName?: string;
  month?: number;
  year?: number;
}

export async function createSalaryPayment(data: SalaryPaymentFormData) {
  return api.post('/salaries', data);
}

export function useSalaries(filters?: SalaryFilters) {
  const [data, setData] = useState<SalaryListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeName = filters?.employeeName?.trim() ?? '';
  const month = filters?.month;
  const year = filters?.year;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (employeeName) {
        params.set('employeeName', employeeName);
      }

      if (month !== undefined) {
        params.set('month', String(month));
      }

      if (year !== undefined) {
        params.set('year', String(year));
      }

      const query = params.toString();
      const response = await api.get<SalaryListResponse>(`/salaries${query ? `?${query}` : ''}`);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
        setError(response.message || 'Failed to fetch salary payments');
      }
    } catch {
      setData(null);
      setError('Failed to fetch salary payments');
    } finally {
      setIsLoading(false);
    }
  }, [employeeName, month, year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    salaries: data?.salaries ?? [],
    employeeNames: data?.employeeNames ?? [],
    isLoading,
    error,
    refresh,
  };
}

export function useSalarySummary(filters?: { month?: number; year?: number }) {
  const [summary, setSummary] = useState<SalarySummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const month = filters?.month;
  const year = filters?.year;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (month !== undefined) {
        params.set('month', String(month));
      }

      if (year !== undefined) {
        params.set('year', String(year));
      }

      const query = params.toString();
      const response = await api.get<SalarySummaryResponse>(
        `/salaries/summary${query ? `?${query}` : ''}`
      );

      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setSummary(null);
        setError(response.message || 'Failed to fetch salary summary');
      }
    } catch {
      setSummary(null);
      setError('Failed to fetch salary summary');
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    summary,
    isLoading,
    error,
    refresh,
  };
}

export type SalaryApiResponse<T = unknown> = Promise<ApiResponse<T>>;
