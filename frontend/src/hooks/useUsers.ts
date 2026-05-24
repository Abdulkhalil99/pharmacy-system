'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiMeta, ApiResponse } from '@/lib/api';
import type { SystemLanguage, SystemUserRole } from '@/lib/user-meta';

export type UserStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
export type UserLinkStatus = 'ALL' | 'LINKED' | 'UNLINKED';

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  role: SystemUserRole;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  language: SystemLanguage;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  createdBy: {
    id: string;
    name: string;
    username: string;
  } | null;
  employee: {
    id: string;
    fullName: string;
    role: string;
    isActive: boolean;
  } | null;
}

export interface UserFormData {
  name: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  role: SystemUserRole;
  phone?: string;
  email?: string;
  language: SystemLanguage;
  isActive: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface UsersQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
  role?: SystemUserRole | 'ALL';
  status?: UserStatusFilter;
  linkStatus?: UserLinkStatus;
  enabled?: boolean;
}

export async function createUser(data: UserFormData) {
  return api.post<UserRecord>('/users', data);
}

export async function updateUser(id: string, data: Partial<UserFormData>) {
  return api.put<UserRecord>(`/users/${id}`, data);
}

export async function deactivateUser(id: string) {
  return api.delete<UserRecord>(`/users/${id}`);
}

export async function toggleUserActive(id: string) {
  return api.put<UserRecord>(`/users/${id}/toggle-active`, {});
}

export async function resetUserPassword(id: string, data: ResetPasswordPayload) {
  return api.put<{ id: string; passwordResetAt: string }>(`/users/${id}/reset-password`, data);
}

export async function changeOwnPassword(id: string, data: ChangePasswordPayload) {
  return api.put<{ id: string; passwordChangedAt: string }>(`/users/${id}/change-password`, data);
}

export async function checkUsernameAvailability(username: string, excludeId?: string) {
  const params = new URLSearchParams({ username });

  if (excludeId) {
    params.set('excludeId', excludeId);
  }

  return api.get<{ username: string; available: boolean }>(
    `/users/check-username?${params.toString()}`
  );
}

export function useUsers(options?: UsersQueryOptions) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const search = options?.search?.trim() ?? '';
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const role = options?.role ?? 'ALL';
  const status = options?.status ?? 'ALL';
  const linkStatus = options?.linkStatus ?? 'ALL';

  const refresh = useCallback(async () => {
    if (!enabled) {
      setUsers([]);
      setMeta(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        linkStatus,
      });

      if (search) {
        params.set('search', search);
      }

      if (role !== 'ALL') {
        params.set('role', role);
      }

      if (status === 'ACTIVE') {
        params.set('isActive', 'true');
      }

      if (status === 'INACTIVE') {
        params.set('isActive', 'false');
      }

      const response = await api.get<UserRecord[]>(`/users?${params.toString()}`);

      if (response.success && response.data) {
        setUsers(response.data);
        setMeta(response.meta ?? null);
      } else {
        setUsers([]);
        setMeta(null);
        setError(response.message || 'Failed to fetch users');
      }
    } catch {
      setUsers([]);
      setMeta(null);
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, linkStatus, limit, page, role, search, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    users,
    meta,
    isLoading,
    error,
    refresh,
  };
}

export type UserApiResponse<T = unknown> = Promise<ApiResponse<T>>;
