'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiResponse } from '@/lib/api';
import type { SystemLanguage, SystemUserRole } from '@/lib/user-meta';

export interface EmployeeLinkedUser {
  id: string;
  name: string;
  username: string;
  role: SystemUserRole;
  isActive: boolean;
  language: SystemLanguage;
  lastLogin: string | null;
}

export interface EmployeeRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  salary: number;
  joinDate: string;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  hasLoginAccount: boolean;
  user: EmployeeLinkedUser | null;
}

export interface EmployeeSalaryPayment {
  id: string;
  employeeId: string | null;
  employeeName: string;
  amount: number;
  month: number;
  year: number;
  note: string | null;
  date: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: SystemUserRole;
  };
}

export interface EmployeeDetail extends EmployeeRecord {
  salaryHistory: EmployeeSalaryPayment[];
  salarySummary: {
    totalPaidThisYear: number;
    totalPaidAllTime: number;
    count: number;
  };
}

export interface EmployeeFormData {
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  salary: number;
  joinDate: string;
  isActive: boolean;
}

export interface EmployeeSalaryHistoryResponse {
  employee: EmployeeRecord;
  payments: EmployeeSalaryPayment[];
  totalPaidThisYear: number;
  totalPaidAllTime: number;
  count: number;
}

export async function createEmployee(data: EmployeeFormData) {
  return api.post<EmployeeRecord>('/employees', data);
}

export async function updateEmployee(id: string, data: Partial<EmployeeFormData>) {
  return api.put<EmployeeRecord>(`/employees/${id}`, data);
}

export async function deactivateEmployee(id: string) {
  return api.delete<EmployeeRecord>(`/employees/${id}`);
}

export async function linkEmployeeUser(id: string, userId: string) {
  return api.put<EmployeeRecord>(`/employees/${id}/link-user`, { userId });
}

export function useEmployees(options?: {
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  enabled?: boolean;
}) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const search = options?.search?.trim() ?? '';
  const status = options?.status ?? 'ALL';

  const refresh = useCallback(async () => {
    if (!enabled) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (search) {
        params.set('search', search);
      }

      if (status === 'ACTIVE') {
        params.set('isActive', 'true');
      }

      if (status === 'INACTIVE') {
        params.set('isActive', 'false');
      }

      const query = params.toString();
      const response = await api.get<EmployeeRecord[]>(`/employees${query ? `?${query}` : ''}`);

      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        setEmployees([]);
        setError(response.message || 'Failed to fetch employees');
      }
    } catch {
      setEmployees([]);
      setError('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, search, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    employees,
    isLoading,
    error,
    refresh,
  };
}

export function useEmployee(employeeId: string | null, enabled = true) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!employeeId || !enabled) {
      setEmployee(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<EmployeeDetail>(`/employees/${employeeId}`);

      if (response.success && response.data) {
        setEmployee(response.data);
      } else {
        setEmployee(null);
        setError(response.message || 'Failed to fetch employee');
      }
    } catch {
      setEmployee(null);
      setError('Failed to fetch employee');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    employee,
    isLoading,
    error,
    refresh,
  };
}

export async function fetchEmployeeSalaryHistory(employeeId: string) {
  return api.get<EmployeeSalaryHistoryResponse>(`/employees/${employeeId}/salary-history`);
}

export type EmployeeApiResponse<T = unknown> = Promise<ApiResponse<T>>;
