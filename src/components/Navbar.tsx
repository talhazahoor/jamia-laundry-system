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
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-emerald-700/40">
      {/* Top Banner: Jamia Title, Status & User Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs sm:text-sm">
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-3 hover:opacity-90 transition group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow group-hover:scale-105 transition transform">
            ج
          </div>
          <div>
            <div className="font-bold text-base tracking-wide text-emerald-400 urdu-compact leading-tight">
              {settings.jamia_name}
            </div>
            <div className="text-slate-400 text-[11px] leading-tight">
              {settings.laundry_name} | {settings.jamia_name_en}
            </div>
          </div>
        </Link>

        {/* Right side controls (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Collection Day Status Pill */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition ${
              isTodaySarkariDay
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
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
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-2.5 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-200 text-xs font-medium truncate max-w-[150px]">
                {user.full_name || user.username}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  user.role === 'Administrator'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50'
                    : 'bg-blue-900/80 text-blue-200 border border-blue-500/50'
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition p-1 hover:bg-slate-700 rounded"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
            className="p-1.5 bg-slate-800 rounded text-slate-300 text-xs"
          >
            {lang === 'ur' ? 'EN' : 'اردو'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar (Desktop) */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 hidden md:flex items-center gap-1.5 py-1.5 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
              <span>{item.label}</span>
              {item.keyHint && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                    isActive
                      ? 'bg-emerald-700 border-emerald-500 text-emerald-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
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
        <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-2 animate-fade-in">
          {/* Day status badge */}
          <div
            className={`p-2 rounded-lg text-xs font-semibold mb-3 flex items-center gap-2 ${
              isTodaySarkariDay ? 'bg-emerald-900/50 text-emerald-300' : 'bg-amber-900/50 text-amber-300'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 shrink-0" />
            <span>
              {isTodaySarkariDay ? 'آج سرکاری دن ہے (منگل/جمعہ)' : 'صرف پرائیویٹ کپڑے'}
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
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition ${
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
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">لاگ ان صارف:</span>
                <span className="font-bold text-slate-200">{user.full_name || user.username}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-red-700/50"
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
