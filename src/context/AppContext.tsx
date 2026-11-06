'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SettingsMap } from '@/types';
import { translations, Locale } from '@/lib/i18n';
import { DEFAULT_SETTINGS } from '@/lib/seed-data';

interface AppContextType {
  user: { id: string; username: string; full_name: string; role: string } | null;
  setUser: (u: any) => void;
  lang: Locale;
  setLang: (l: Locale) => void;
  t: typeof translations.ur;
  settings: SettingsMap;
  updateLocalSettings: (s: SettingsMap) => void;
  isTodaySarkariDay: boolean;
  logout: () => Promise<void>;
  counterName: string;
  isNavigating: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [lang, setLangState] = useState<Locale>('ur');
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS);
  const [counterName] = useState<string>('کاؤنٹر 1 (Main)');
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const setLang = (newLang: Locale) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jamia_laundry_lang', newLang);
      document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    // Initial language setup from localStorage if available
    const savedLang = localStorage.getItem('jamia_laundry_lang') as Locale | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'ur')) {
      setLangState(savedLang);
      document.documentElement.dir = savedLang === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
    }

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else if (pathname !== '/login') {
          router.push('/login');
        }
      })
      .catch(() => {
        if (pathname !== '/login') router.push('/login');
      });

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setIsNavigating(true);
        router.push('/counter');
      } else if (e.key === 'F2') {
        e.preventDefault();
        router.push('/deliveries');
      } else if (e.key === 'F3') {
        e.preventDefault();
        router.push('/receipts');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const dayOfWeek = new Date().getDay();
  const isTodaySarkariDay = settings.sarkari_collection_days?.includes(dayOfWeek) ?? false;

  const t = translations[lang] || translations.ur;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        lang,
        setLang,
        t,
        settings,
        updateLocalSettings: setSettings,
        isTodaySarkariDay,
        logout,
        counterName,
        isNavigating,
      }}
    >
      <div dir={lang === 'ur' ? 'rtl' : 'ltr'}>
        {isNavigating && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-50 animate-pulse shadow-sm" />
        )}
        {children}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
