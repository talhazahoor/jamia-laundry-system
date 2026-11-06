'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, lang, setLang, t, settings, isTodaySarkariDay, logout } = useApp();

  // SIDEBAR IS OPENED BY DEFAULT FROM THE LEFT
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Global F1, F2, F3 shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'F1') {
        e.preventDefault();
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

  if (pathname === '/login') {
    return <main className="min-h-screen">{children}</main>;
  }

  const navSections = [
    {
      title: 'مرکزی کاؤنٹر (Desk Operations)',
      items: [
        { href: '/', label: t.nav_dashboard, icon: LayoutDashboard },
        { href: '/counter', label: t.nav_collection, icon: Shirt, keyHint: 'F1' },
        { href: '/deliveries', label: t.nav_deliveries, icon: PackageCheck, keyHint: 'F2' },
        { href: '/receipts', label: t.nav_receipts, icon: ReceiptText, keyHint: 'F3' },
      ],
    },
    {
      title: 'کوائف و نرخ (Records & Rates)',
      items: [
        { href: '/students', label: t.nav_students, icon: Users },
        { href: '/items', label: t.nav_items, icon: Tags },
        { href: '/reports', label: t.nav_reports, icon: BarChart3 },
      ],
    },
    ...(user?.role === 'Administrator'
      ? [
          {
            title: 'انتظامیہ (Administration)',
            items: [
              { href: '/settings', label: t.nav_settings, icon: Settings },
              { href: '/users', label: t.nav_users, icon: ShieldCheck },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative">
      
      {/* 
        =======================================================
        LEFT SIDEBAR (D悵ed on the left, OPEN by default)
        =======================================================
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-jamia-950 via-slate-900 to-jamia-950 text-white border-r border-emerald-900/60 shadow-2xl flex flex-col justify-between transition-all duration-300 ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-0 lg:overflow-hidden lg:border-none'
        } ${mobileDrawerOpen ? 'translate-x-0' : ''}`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              prefetch={true}
              className="flex items-center gap-3 group"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-emerald-400/30 group-hover:scale-105 transition transform">
                <span className="text-2xl font-nastaliq leading-none">ج</span>
              </div>
              <div>
                <div className="font-bold text-base tracking-wide text-emerald-300 font-nastaliq leading-tight">
                  {settings.jamia_name}
                </div>
                <div className="text-emerald-100/70 text-[11px] font-medium flex items-center gap-1 leading-tight mt-0.5">
                  <span className="text-gold-400 font-semibold">{settings.laundry_name}</span>
                  <span className="opacity-40">•</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 truncate max-w-[90px]">
                    {settings.jamia_name_en}
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setMobileDrawerOpen(false);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="سائیڈ بار بند کریں (Close Sidebar)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Today Collection Status Pill */}
          <div
            className={`mt-4 p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border transition ${
              isTodaySarkariDay
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isTodaySarkariDay ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isTodaySarkariDay ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <div className="leading-tight">
              <div className="font-bold text-[11px]">
                {isTodaySarkariDay ? 'آج سرکاری کلیکشن کا دن ہے' : 'صرف پرائیویٹ کلیکشن'}
              </div>
              <div className="text-[10px] opacity-75">
                {isTodaySarkariDay ? 'منگل اور جمعہ (مفت دھلائی)' : 'عام ایام (نقد وصولی)'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800/80 text-emerald-400 group-hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-nastaliq text-[13px] leading-tight pt-0.5">{item.label}</span>
                    </div>

                    {item.keyHint && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold tracking-wider ${
                          isActive
                            ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.keyHint}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Operator Profile Card */}
        {user && (
          <div className="p-3.5 m-3 rounded-2xl bg-slate-850/80 border border-slate-700/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600/40 to-teal-800/40 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-white text-xs font-bold truncate urdu-compact leading-tight">
                    {user.full_name || user.username}
                  </div>
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold tracking-wider uppercase mt-0.5 ${
                      user.role === 'Administrator'
                        ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
                        : 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40'
                    }`}
                  >
                    {user.role === 'Administrator' ? 'ایڈمنسٹریٹر' : 'کاؤنٹر آپریٹر'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition border border-transparent hover:border-red-500/20 shrink-0"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop overlay */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* 
        =======================================================
        MAIN WRAPPER (Top header + page content)
        =======================================================
      */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full ${
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'
        }`}
      >
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-subtle">
          
          {/* Left: Sidebar Toggle Button */}
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex items-center gap-2 bg-jamia-900 text-gold-300 hover:bg-jamia-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow transition border border-emerald-800"
                title="سائیڈ بار کھولیں (Open Left Sidebar)"
              >
                <PanelLeftOpen className="w-4 h-4 text-gold-400" />
                <span>سائیڈ مینو کھولیں</span>
              </button>
            )}

            {/* Mobile Sidebar Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Seminary Title Badge in Topbar */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-800 urdu-compact">{settings.jamia_name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">{settings.laundry_name}</span>
            </div>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-2.5">
            {/* Sarkari Collection Pill on topbar */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                isTodaySarkariDay
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTodaySarkariDay ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isTodaySarkariDay ? 'آج سرکاری دن ہے (منگل / جمعہ)' : 'پرائیویٹ کلیکشن'}</span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition border border-slate-200"
              title="Switch Language"
            >
              <Languages className="w-3.5 h-3.5 text-jamia-700" />
              <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
            </button>

            {/* User Quick Badge */}
            {user && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-jamia-900 text-gold-300 font-bold flex items-center justify-center text-[10px]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-slate-800 truncate max-w-[100px] hidden sm:inline">
                  {user.full_name || user.username}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 w-full">
          {children}
        </main>
      </div>

    </div>
  );
}
