'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authStorage, AuthUser } from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — restore user from localStorage so page refresh doesn't log out
  useEffect(() => {
    const stored = authStorage.getUser();
    if (stored && authStorage.getToken()) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<{ user: AuthUser; token: string }>(
      '/auth/login',
      { username, password }
    );

    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
      setUser(res.data.user);
      return { success: true, message: res.message };
    }

    return { success: false, message: res.message ?? 'Login failed' };
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}