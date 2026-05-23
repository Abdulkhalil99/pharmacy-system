export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CASHIER';
  language: string;
}

const TOKEN_KEY = 'pharmacy_token';
const USER_KEY  = 'pharmacy_user';

export const authStorage = {
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    // Set cookie for Next.js proxy (server-side route guard can't read localStorage)
    document.cookie = `pharmacy_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  },
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    // Clear the cookie too
    document.cookie = 'pharmacy_token=; path=/; max-age=0; SameSite=Strict';
  },

  setUser: (user: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    authStorage.removeToken();
    authStorage.removeUser();
  },

  isAuthenticated: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};
