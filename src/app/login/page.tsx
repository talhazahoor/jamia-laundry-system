'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Shirt, Lock, User, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, settings } = useApp();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      router.push('/counter');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-700 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <Shirt className="w-10 h-10 text-emerald-200" />
          </div>
          <h1 className="text-xl font-bold urdu-compact mb-0.5">
            {settings.jamia_name}
          </h1>
          <p className="text-emerald-100 font-semibold text-sm">
            {settings.laundry_name}
          </p>
          <div className="text-[11px] text-emerald-200 uppercase tracking-widest mt-1">
            Jamia Laundry Management System v1.0
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              صارف کا نام (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              پاس ورڈ (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-md text-sm mt-2"
          >
            {loading ? 'توثیق ہو رہی ہے...' : (
              <>
                <span>لاگ ان کریں (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">
              فوری لاگ ان کے لیے منتخب کریں (Demo Accounts):
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoUser('admin', 'admin123')}
                className={`p-2 rounded-lg border text-left transition ${
                  username === 'admin'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11px]">ایڈمن (Admin)</div>
                <div className="text-[10px] text-slate-500">مکمل اختیارات</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('operator', 'operator123')}
                className={`p-2 rounded-lg border text-left transition ${
                  username === 'operator'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11px]">آپریٹر (Counter)</div>
                <div className="text-[10px] text-slate-500">کاؤنٹر کلیکشن</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('accounts', 'viewer123')}
                className={`p-2 rounded-lg border text-left transition ${
                  username === 'accounts'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11px]">حسابات (Viewer)</div>
                <div className="text-[10px] text-slate-500">صرف رپورٹس</div>
              </button>
            </div>
          </div>
        </form>

        <div className="bg-slate-50 p-3 text-center text-[11px] text-slate-500 border-t border-slate-200">
          Jamia Laundry Management • Built for Vercel & Neon PostgreSQL
        </div>
      </div>
    </div>
  );
}
