'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const translations = {
  fa: {
    dir: 'rtl',
    systemName: 'سیستم مدیریت دواخانه',
    subtitle: 'به سیستم مدیریت دواخانه خوش آمدید',
    username: 'نام کاربری',
    password: 'رمز عبور',
    usernamePlaceholder: 'نام کاربری خود را وارد کنید',
    passwordPlaceholder: 'رمز عبور خود را وارد کنید',
    login: 'ورود به سیستم',
    loggingIn: 'در حال ورود...',
    language: 'زبان',
    welcomeBack: 'خوش آمدید',
    loginToContinue: 'برای ادامه وارد شوید',
  },
  ps: {
    dir: 'rtl',
    systemName: 'د درملتون د مدیریت سیستم',
    subtitle: 'د درملتون د مدیریت سیستم ته ښه راغلاست',
    username: 'د کارونکي نوم',
    password: 'پټنوم',
    usernamePlaceholder: 'خپل د کارونکي نوم دننه کړئ',
    passwordPlaceholder: 'خپل پټنوم دننه کړئ',
    login: 'سیستم ته ننوتل',
    loggingIn: 'ننوتل...',
    language: 'ژبه',
    welcomeBack: 'ښه راغلاست',
    loginToContinue: 'دوام لپاره ننوځئ',
  },
  en: {
    dir: 'ltr',
    systemName: 'Pharmacy Management System',
    subtitle: 'Welcome to Pharmacy Management System',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Enter your username',
    passwordPlaceholder: 'Enter your password',
    login: 'Sign In',
    loggingIn: 'Signing in...',
    language: 'Language',
    welcomeBack: 'Welcome Back',
    loginToContinue: 'Sign in to continue',
  },
};

type Locale = 'fa' | 'ps' | 'en';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [locale, setLocale] = useState<Locale>('fa');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[locale];

  useEffect(() => {
    if (isAuthenticated) {
      const from = searchParams.get('from') ?? '/dashboard';
      router.replace(from);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      const from = searchParams.get('from') ?? '/dashboard';
      router.replace(from);
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-900 flex items-center justify-center p-4"
      dir={t.dir}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Language Selector — always top right regardless of RTL */}
      <div className="fixed top-4 right-4 z-50">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="bg-white/10 backdrop-blur-sm text-white text-sm border border-white/20 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="fa" className="text-gray-900">دری</option>
          <option value="ps" className="text-gray-900">پښتو</option>
          <option value="en" className="text-gray-900">English</option>
        </select>
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-teal-600 to-cyan-600 px-8 py-10 text-center relative">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-20 translate-y-20" />

            {/* Pharmacy Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl mb-4 mx-auto">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                <path d="M10.5 2a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM2 10.5a8.5 8.5 0 1 1 17 0 8.5 8.5 0 0 1-17 0Z"/>
                <path d="M10.5 6.5a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2h-2a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1Z"/>
                <path d="M20.5 20.5a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414Z"/>
              </svg>
            </div>

            <h1 className="text-white text-2xl font-bold leading-tight mb-1">
              {t.systemName}
            </h1>
            <p className="text-teal-100 text-sm opacity-90">{t.loginToContinue}</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-gray-800 text-xl font-semibold mb-6 text-center">
              {t.welcomeBack}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.username}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.usernamePlaceholder}
                    required
                    autoComplete="username"
                    className="w-full ps-10 pe-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    autoComplete="current-password"
                    className="w-full ps-10 pe-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-200 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {t.loggingIn}
                  </>
                ) : (
                  t.login
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              {locale === 'en'
                ? 'Pharmacy Management System © 2025'
                : 'سیستم مدیریت دواخانه © ۱۴۰۴'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}