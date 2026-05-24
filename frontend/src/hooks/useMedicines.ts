'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Medicine {
  id: string;
  name: string;
  barcode: string | null;
  company: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineSummary {
  total: number;
  lowStock: number;
  expiringSoon: number;
  expired: number;
  statusBreakdown: {
    normal: number;
    lowStock: number;
    expiringSoon: number;
    expired: number;
  };
  companyBreakdown: Array<{
    company: string;
    quantity: number;
    medicines: number;
  }>;
  expiryBuckets: Array<{
    key: 'expired' | 'within30Days' | 'within90Days' | 'later';
    count: number;
  }>;
}

export interface MedicineFormData {
  name: string;
  barcode?: string;
  company: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  expiryDate: string;
}

export type MedicineStatus = 'all' | 'low_stock' | 'expiring_soon' | 'expired';

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [summary, setSummary] = useState<MedicineSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MedicineStatus>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
        ...(status !== 'all' ? { status } : {}),
      });

      const res = await api.get<Medicine[]>(`/medicines?${params.toString()}`);

      if (res.success && res.data) {
        setMedicines(res.data);
        setTotal(res.meta?.total ?? 0);
        setTotalPages(res.meta?.totalPages ?? 1);
      } else {
        setMedicines([]);
        setTotal(0);
        setTotalPages(1);
        setError(res.message || 'Failed to fetch medicines');
      }
    } catch {
      setMedicines([]);
      setTotal(0);
      setTotalPages(1);
      setError('Failed to fetch medicines');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get<MedicineSummary>('/medicines/summary');

      if (res.success && res.data) {
        setSummary(res.data);
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const createMedicine = async (data: MedicineFormData) => {
    const res = await api.post<Medicine>('/medicines', data);

    if (res.success) {
      await fetchMedicines();
      await fetchSummary();
    }

    return res;
  };

  const updateMedicine = async (id: string, data: Partial<MedicineFormData>) => {
    const res = await api.put<Medicine>(`/medicines/${id}`, data);

    if (res.success) {
      await fetchMedicines();
      await fetchSummary();
    }

    return res;
  };

  const deleteMedicine = async (id: string) => {
    const res = await api.delete(`/medicines/${id}`);

    if (res.success) {
      await fetchMedicines();
      await fetchSummary();
    }

    return res;
  };

  return {
    medicines,
    summary,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    totalPages,
    total,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    refresh: fetchMedicines,
  };
}
