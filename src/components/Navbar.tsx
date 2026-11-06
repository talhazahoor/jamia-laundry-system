'use client';

import React, { useState } from 'react';
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
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, lang, setLang, t, settings, isTodaySarkariDay, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/login') return null;

  const navItems = [
    { href: '/', label: t.nav_dashboard, icon: LayoutDashboard },
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
    <header className="bg-gradient-to-b from-jamia-950 to-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-emerald-600/30">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-white/10 text-xs sm:text-sm">
        
        {/* Brand Logo & Name */}
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-3 hover:opacity-95 transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-emerald-400/30 group-hover:scale-105 transition transform">
            <span className="text-xl urdu-compact font-nastaliq">ج</span>
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg tracking-wide text-emerald-300 font-nastaliq leading-tight flex items-center gap-2">
              <span>{settings.jamia_name}</span>
            </div>
            <div className="text-emerald-100/70 text-[11px] font-medium flex items-center gap-1.5 leading-tight">
              <span>{settings.laundry_name}</span>
              <span className="opacity-40">•</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{settings.jamia_name_en}</span>
            </div>
          </div>
        </Link>

        {/* Right side status & profile (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Collection Day Status Pill */}
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm transition border ${
              isTodaySarkariDay
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTodaySarkariDay ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isTodaySarkariDay ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span className="font-medium">
              {isTodaySarkariDay ? 'آج سرکاری کلیکشن کا دن ہے (منگل / جمعہ)' : 'صرف پرائیویٹ کلیکشن'}
            </span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-medium transition hover:border-emerald-500/40 shadow-sm"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-2.5 bg-slate-800/90 pl-3 pr-2 py-1.5 rounded-xl border border-slate-700/80 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-500/40">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-200 text-xs font-semibold truncate max-w-[140px] font-nastaliq">
                {user.full_name || user.username}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase ${
                  user.role === 'Administrator'
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                    : 'bg-blue-900/60 text-blue-200 border border-blue-500/40'
                }`}
              >
                {user.role === 'Administrator' ? 'ایڈمن' : user.role === 'Counter Operator' ? 'آپریٹر' : 'حسابات'}
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
            className="px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300 text-xs font-semibold border border-slate-700"
          >
            {lang === 'ur' ? 'EN' : 'اردو'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar (Desktop) */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 hidden lg:flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-900/40 border border-emerald-400/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
              <span className={lang === 'ur' ? 'font-nastaliq text-[13px]' : ''}>{item.label}</span>
              {item.keyHint && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.keyHint}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-md p-4 space-y-3">
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              isTodaySarkariDay ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-600/30' : 'bg-amber-900/40 text-amber-300 border border-amber-600/30'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 shrink-0" />
            <span>
              {isTodaySarkariDay ? 'آج سرکاری کلیکشن کا دن ہے (منگل / جمعہ)' : 'صرف پرائیویٹ کلیکشن'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">لاگ ان صارف:</span>
                <span className="font-bold text-slate-200">{user.full_name || user.username} ({user.role})</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-950/60 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-medium border border-red-700/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logout}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
