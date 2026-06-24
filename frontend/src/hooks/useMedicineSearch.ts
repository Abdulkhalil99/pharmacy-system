'use client';

import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DrugKind } from '@pharmacy/shared';

export interface MedicineSearchResult {
  id: string;
  name: string;
  kind: DrugKind;
  barcode: string | null;
  company: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minQuantity: number;
  expiryDate: string;
}

export function useMedicineSearch(query: string, limit = 8) {
  const deferredQuery = useDeferredValue(query.trim());
  const [medicines, setMedicines] = useState<MedicineSearchResult[]>([]);
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!deferredQuery) {
      startTransition(() => {
        setMedicines([]);
        setError(null);
      });
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoadingState(true);

      try {
        const params = new URLSearchParams({
          search: deferredQuery,
          page: '1',
          limit: String(limit),
        });

        const response = await api.get<MedicineSearchResult[]>(
          `/medicines?${params.toString()}`
        );

        if (isCancelled) {
          return;
        }

        startTransition(() => {
          if (response.success && response.data) {
            setMedicines(response.data);
            setError(null);
          } else {
            setMedicines([]);
            setError(response.message || 'Medicine search failed');
          }
        });
      } catch {
        if (!isCancelled) {
          startTransition(() => {
            setMedicines([]);
            setError('Medicine search failed');
          });
        }
      } finally {
        if (!isCancelled) {
          setLoadingState(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery, limit]);

  return {
    medicines,
    isLoading: Boolean(deferredQuery) && loadingState,
    error,
  };
}
