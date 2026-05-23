'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiResponse } from '@/lib/api';

export interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  totalPurchased: number;
  totalPaid: number;
  balance: number;
  createdAt: string;
  transactionCount?: number;
}

export interface CompanyTransaction {
  id: string;
  companyId: string;
  type: 'PURCHASE' | 'PAYMENT';
  amount: number;
  billNumber: string | null;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface CompanyReport {
  company: Company;
  transactions: CompanyTransaction[];
  summary: {
    totalPurchased: number;
    totalPaid: number;
    balance: number;
    purchaseCount: number;
    paymentCount: number;
    lastPurchaseDate: string | null;
    lastPaymentDate: string | null;
  };
}

export interface CompanyFormData {
  name: string;
  phone?: string;
  address?: string;
}

export interface PurchaseMedicineItemInput {
  medicineId?: string;
  name: string;
  barcode?: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  minQuantity?: number;
  expiryDate: string;
}

export interface PurchaseFormData {
  billNumber?: string;
  note?: string;
  date?: string;
  items: PurchaseMedicineItemInput[];
}

export interface PaymentFormData {
  amount: number;
  note?: string;
  date?: string;
}

export interface MedicineOption {
  id: string;
  name: string;
  barcode: string | null;
  company: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  expiryDate: string;
}

export async function fetchMedicineOptions(): Promise<MedicineOption[]> {
  const response = await api.get<MedicineOption[]>('/medicines?limit=200');
  return response.success && response.data ? response.data : [];
}

export async function createCompany(data: CompanyFormData) {
  return api.post<Company>('/companies', data);
}

export async function updateCompany(id: string, data: Partial<CompanyFormData>) {
  return api.put<Company>(`/companies/${id}`, data);
}

export async function recordCompanyPurchase(id: string, data: PurchaseFormData) {
  return api.post(`/companies/${id}/purchase`, data);
}

export async function recordCompanyPayment(id: string, data: PaymentFormData) {
  return api.post(`/companies/${id}/payment`, data);
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Company[]>('/companies');

      if (response.success && response.data) {
        setCompanies(response.data);
      } else {
        setCompanies([]);
        setError(response.message || 'Failed to fetch companies');
      }
    } catch {
      setCompanies([]);
      setError('Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    companies,
    isLoading,
    error,
    refresh,
  };
}

export function useCompanyReport(companyId: string | null) {
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setReport(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<CompanyReport>(`/companies/${companyId}/report`);

      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setReport(null);
        setError(response.message || 'Failed to fetch company report');
      }
    } catch {
      setReport(null);
      setError('Failed to fetch company report');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

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

export type CompanyApiResponse<T = unknown> = Promise<ApiResponse<T>>;
