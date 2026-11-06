'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Shirt,
  CalendarCheck2,
  PackageCheck,
  ReceiptText,
  Users,
  Tags,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Languages,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, lang, setLang, t, settings, isTodaySarkariDay, logout } = useApp();

  if (pathname === '/login') return null;

  const navItems = [
    { href: '/counter', label: t.nav_collection, icon: Shirt, keyHint: 'F1' },
    { href: '/deliveries', label: t.nav_deliveries, icon: PackageCheck, keyHint: 'F2' },
    { href: '/receipts', label: t.nav_receipts, icon: ReceiptText, keyHint: 'F3' },
    { href: '/students', label: t.nav_students, icon: Users },
    { href: '/items', label: t.nav_items, icon: Tags },
    { href: '/reports', label: t.nav_reports, icon: BarChart3 },
    ...(user?.role === 'Administrator' ? [{ href: '/settings', label: t.nav_settings, icon: Settings }] : []),
    ...(user?.role === 'Administrator' ? [{ href: '/users', label: t.nav_users, icon: ShieldCheck }] : []),
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-emerald-700/40">
      {/* Top Banner: Jamia Title & Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between border-b border-slate-800 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
            ج
          </div>
          <div>
            <div className="font-bold text-base tracking-wide text-emerald-400 urdu-compact">
              {settings.jamia_name}
            </div>
            <div className="text-slate-400 text-xs">{settings.laundry_name} | {settings.jamia_name_en}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {/* Collection Day Status Pill */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm ${
            isTodaySarkariDay
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            <CalendarCheck2 className="w-3.5 h-3.5" />
            {isTodaySarkariDay ? (
              <span>آج سرکاری کلیکشن کا دن ہے (منگل / جمعہ)</span>
            ) : (
              <span>صرف پرائیویٹ کپڑے (سرکاری دن نہیں)</span>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 text-xs font-medium transition"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'ur' ? 'English' : 'اردو'}
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
              <span className="text-slate-300 text-xs font-medium truncate max-w-[140px]">
                {user.full_name || user.username}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                user.role === 'Administrator'
                  ? 'bg-purple-900 text-purple-200 border border-purple-600'
                  : 'bg-blue-900 text-blue-200 border border-blue-600'
              }`}>
                {user.role}
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition ml-1"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 py-1 scrollbar-none">
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            pathname === '/'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {t.nav_dashboard}
        </Link>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 text-emerald-400" />
              <span>{item.label}</span>
              {item.keyHint && (
                <span className="text-[10px] bg-slate-800/90 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                  {item.keyHint}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
