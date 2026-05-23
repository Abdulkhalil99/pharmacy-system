'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiResponse } from '@/lib/api';

export type CustomerFilter = 'ALL' | 'WITH_DEBT' | 'NO_DEBT';

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string | null;
  totalDebt: number;
  createdAt: string;
  totalPrescriptions: number;
  transactionCount: number;
  lastTransactionDate: string | null;
  lastTransactionType: 'DEBT' | 'PAYMENT' | null;
  lastTransactionAmount: number | null;
}

export interface CustomerProfile extends CustomerListItem {
  totalPaid: number;
  totalDebtCreated: number;
  paymentCount?: number;
}

export interface CustomerPrescriptionSummary {
  id: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: 'PAID' | 'PARTIAL' | 'DEBT';
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  prescriptionId: string | null;
  type: 'DEBT' | 'PAYMENT';
  amount: number;
  note: string | null;
  description: string;
  date: string;
  createdAt: string;
  prescription: CustomerPrescriptionSummary | null;
}

export interface CustomerReport {
  customer: CustomerProfile;
  transactions: CustomerTransaction[];
  prescriptions: CustomerPrescriptionSummary[];
  summary: {
    totalDebt: number;
    totalDebtCreated: number;
    totalPaid: number;
    totalPrescriptions: number;
    transactionCount: number;
    paymentCount: number;
    debtEntryCount: number;
    lastTransactionDate: string | null;
    lastPaymentDate: string | null;
    lastDebtDate: string | null;
  };
}

export interface CustomerFormData {
  name: string;
  phone?: string;
}

export interface CustomerPaymentFormData {
  amount: number;
  note?: string;
  date?: string;
}

export async function createCustomer(data: CustomerFormData) {
  return api.post<CustomerListItem>('/customers', data);
}

export async function updateCustomer(id: string, data: Partial<CustomerFormData>) {
  return api.put<CustomerListItem>(`/customers/${id}`, data);
}

export async function recordCustomerPayment(id: string, data: CustomerPaymentFormData) {
  return api.post(`/customers/${id}/payment`, data);
}

export async function fetchCustomerTransactions(id: string) {
  return api.get<CustomerTransaction[]>(`/customers/${id}/transactions`);
}

export function useCustomers(options?: { search?: string; filter?: CustomerFilter }) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = options?.search?.trim() ?? '';
  const filter = options?.filter ?? 'ALL';

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (search) {
        params.set('search', search);
      }

      const query = params.toString();
      const endpoint =
        filter === 'WITH_DEBT'
          ? `/customers/debtors${query ? `?${query}` : ''}`
          : `/customers${query ? `?${query}` : ''}`;

      const response = await api.get<CustomerListItem[]>(endpoint);

      if (response.success && response.data) {
        const nextCustomers =
          filter === 'NO_DEBT'
            ? response.data.filter((customer) => customer.totalDebt <= 0)
            : response.data;

        setCustomers(nextCustomers);
      } else {
        setCustomers([]);
        setError(response.message || 'Failed to fetch customers');
      }
    } catch {
      setCustomers([]);
      setError('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    customers,
    isLoading,
    error,
    refresh,
  };
}

export function useCustomerReport(customerId: string | null) {
  const [report, setReport] = useState<CustomerReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!customerId) {
      setReport(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<CustomerReport>(`/customers/${customerId}/report`);

      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setReport(null);
        setError(response.message || 'Failed to fetch customer report');
      }
    } catch {
      setReport(null);
      setError('Failed to fetch customer report');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    report,
    isLoading,
    error,
    refresh,
  };
}

export type CustomerApiResponse<T = unknown> = Promise<ApiResponse<T>>;
