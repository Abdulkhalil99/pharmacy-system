'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface MedicineAlert {
  id: string;
  name: string;
  barcode: string | null;
  company: string;
  quantity: number;
  minQuantity: number;
  expiryDate: string;
}

export interface AlertsSummary {
  lowStock: MedicineAlert[];
  expiring: MedicineAlert[];
  lowStockCount: number;
  expiringCount: number;
  total: number;
  windowDays: number;
  generatedAt: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<AlertsSummary>('/alerts');

      if (response.success && response.data) {
        setAlerts(response.data);
      } else {
        setAlerts(null);
        setError(response.message || 'Failed to load alerts');
      }
    } catch {
      setAlerts(null);
      setError('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refresh]);

  return {
    alerts,
    isLoading,
    error,
    refresh,
  };
}
