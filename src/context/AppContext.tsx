'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SettingsMap } from '@/types';
import { translations } from '@/lib/i18n';
import { DEFAULT_SETTINGS } from '@/lib/seed-data';

interface AppContextType {
  user: { id: string; username: string; full_name: string; role: string } | null;
  setUser: (u: any) => void;
  lang: 'ur' | 'en';
  setLang: (l: 'ur' | 'en') => void;
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
  const [lang, setLang] = useState<'ur' | 'en'>('ur');
  const [settings, setSettings] = useState<SettingsMap>(DEFAULT_SETTINGS);
  const [counterName] = useState<string>('کاؤنٹر 1 (Main)');
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load session & settings ONCE on initial mount (NOT on every route change)
  useEffect(() => {
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
          if (data.settings.language) {
            setLang(data.settings.language);
          }
        }
      })
      .catch(console.error);
  }, []); // Run only once on mount

  // Clear navigation loading indicator on route change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Global Function Key Shortcuts (COL-11: F1 Counter, F2 Deliveries, F3 Receipts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input/textarea and pressing other keys, but allow F1/F2/F3
      if (e.key === 'F1') {
        e.preventDefault();
        setIsNavigating(true);
        router.push('/counter');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsNavigating(true);
        router.push('/deliveries');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsNavigating(true);
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
      <div dir={lang === 'ur' ? 'rtl' : 'ltr'} className={lang === 'ur' ? 'font-sans' : 'font-sans'}>
        {/* Top Loading Progress Bar when navigating routes */}
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
