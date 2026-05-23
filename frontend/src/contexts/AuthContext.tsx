'use client';

import {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { authStorage, AuthUser } from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  language: string;
  login: (username: string, password: string, chosenLanguage?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setLanguage: (lang: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Read language from storage immediately — before user object loads
  const [language, setLanguageState] = useState<string>('fa');

  useEffect(() => {
    const stored = authStorage.getUser();
    const savedLang = authStorage.getLanguage();
    if (stored && authStorage.getToken()) {
      setUser(stored);
    }
    setLanguageState(savedLang);
    setIsLoading(false);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    authStorage.setLanguage(lang);
    setLanguageState(lang);
  }, []);

  const login = useCallback(async (
    username: string,
    password: string,
    chosenLanguage?: string,
  ) => {
    const res = await api.post<{ user: AuthUser; token: string }>(
      '/auth/login',
      { username, password },
    );

    if (res.success && res.data) {
      // Save token and user from backend
      authStorage.setToken(res.data.token);

      // Override language: use what the user selected on the login page,
      // falling back to whatever the backend has stored for this user.
      const lang = chosenLanguage ?? res.data.user.language ?? 'fa';
      const userWithLang: AuthUser = { ...res.data.user, language: lang };

      authStorage.setUser(userWithLang);
      authStorage.setLanguage(lang);

      setUser(userWithLang);
      setLanguageState(lang);

      return { success: true, message: res.message };
    }

    return { success: false, message: res.message ?? 'Login failed' };
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    setLanguageState('fa');
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user,
      language, login, logout, setLanguage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
