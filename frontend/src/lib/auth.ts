export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CASHIER';
  language: string;
}

const TOKEN_KEY    = 'pharmacy_token';
const USER_KEY     = 'pharmacy_user';
const LANGUAGE_KEY = 'pharmacy_language';
const LOCALE_COOKIE_KEY = 'PHARMACY_LOCALE';

function setLocaleCookie(lang: string) {
  document.cookie = `${LOCALE_COOKIE_KEY}=${lang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Strict`;
}

export const authStorage = {
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `pharmacy_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  },
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = 'pharmacy_token=; path=/; max-age=0';
  },

  setUser: (user: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  removeUser: () => localStorage.removeItem(USER_KEY),

  // Language is stored separately so we can read it before user loads
  setLanguage: (lang: string) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLocaleCookie(lang);
  },
  getLanguage: (): string => localStorage.getItem(LANGUAGE_KEY) ?? 'fa',
  removeLanguage: () => localStorage.removeItem(LANGUAGE_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LANGUAGE_KEY);
    document.cookie = 'pharmacy_token=; path=/; max-age=0';
    document.cookie = `${LOCALE_COOKIE_KEY}=; path=/; max-age=0`;
  },

  isAuthenticated: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};
