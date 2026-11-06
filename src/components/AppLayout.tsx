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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, lang, setLang, t, settings, isTodaySarkariDay, logout } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      title: t.ops_section,
      items: [
        { href: '/', label: t.nav_dashboard, icon: LayoutDashboard },
        { href: '/counter', label: t.nav_collection, icon: Shirt, keyHint: 'F1' },
        { href: '/deliveries', label: t.nav_deliveries, icon: PackageCheck, keyHint: 'F2' },
        { href: '/receipts', label: t.nav_receipts, icon: ReceiptText, keyHint: 'F3' },
      ],
    },
    {
      title: t.data_section,
      items: [
        { href: '/students', label: t.nav_students, icon: Users },
        { href: '/items', label: t.nav_items, icon: Tags },
        { href: '/reports', label: t.nav_reports, icon: BarChart3 },
      ],
    },
    ...(user?.role === 'Administrator'
      ? [
          {
            title: t.admin_section,
            items: [
              { href: '/settings', label: t.nav_settings, icon: Settings },
              { href: '/users', label: t.nav_users, icon: ShieldCheck },
            ],
          },
        ]
      : []),
  ];

  const jamiaDisplayName = lang === 'en' ? settings.jamia_name_en : settings.jamia_name;
  const laundryDisplayName = lang === 'en' ? (settings.laundry_name_en || 'Laundry Department') : settings.laundry_name;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex text-xs">
      
      {/* 
        ========================================
        CLEAN SLEEK LEFT SIDEBAR
        ========================================
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-0 lg:overflow-hidden lg:border-none'
        } ${mobileOpen ? 'translate-x-0' : ''}`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              prefetch={true}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 truncate"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0">
                {lang === 'en' ? 'J' : 'ج'}
              </div>
              <div className="leading-tight truncate">
                <div className="font-bold text-white text-xs truncate">{jamiaDisplayName}</div>
                <div className="text-[11px] text-slate-400 font-medium truncate">{laundryDisplayName}</div>
              </div>
            </Link>

            <button
              onClick={() => {
                setSidebarOpen(false);
                setMobileOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-md transition shrink-0"
              title={t.close}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Status Indicator */}
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">{t.today_nature}</span>
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <span className={`w-1.5 h-1.5 rounded-full ${isTodaySarkariDay ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{isTodaySarkariDay ? t.sarkari : t.private}</span>
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.keyHint && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
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

        {/* User Footer */}
        {user && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-md bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-white font-medium text-xs truncate leading-tight">
                  {user.full_name || user.username}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user.role === 'Administrator' ? t.admin_role : t.operator_role}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* 
        ========================================
        MAIN PAGE CONTAINER
        ========================================
      */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        {/* Crisp Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
                <span>{t.menu}</span>
              </button>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-100 text-slate-700"
            >
              <Menu className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-700 text-xs hidden sm:inline">
              {jamiaDisplayName} — {laundryDisplayName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isTodaySarkariDay
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isTodaySarkariDay ? t.sarkari_collection_today : t.private_only_today}
            </span>

            {/* Language Switcher Pill */}
            <button
              onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
