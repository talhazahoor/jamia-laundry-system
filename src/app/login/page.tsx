'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Shirt, Lock, User, ShieldAlert, ArrowRight, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-jamia-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blurred backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/20 z-10">
        
        {/* Madrasa Institutional Header */}
        <div className="bg-gradient-to-br from-jamia-900 via-emerald-800 to-teal-900 p-8 text-white text-center relative">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl ring-4 ring-emerald-400/30">
            <span className="text-3xl urdu-compact font-nastaliq text-emerald-100">ج</span>
          </div>
          <h1 className="text-2xl font-bold font-nastaliq mb-1 leading-tight text-emerald-100">
            {settings.jamia_name}
          </h1>
          <p className="text-emerald-200/90 font-semibold text-sm">
            {settings.laundry_name}
          </p>
          <div className="text-[10px] text-emerald-300 uppercase tracking-widest mt-2 font-mono bg-emerald-950/40 py-1 px-3 rounded-full inline-block border border-emerald-500/30">
            Jamia Laundry Management System v1.0
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-7 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2.5 font-medium animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-nastaliq">
              صارف کا نام (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none text-sm font-semibold font-mono"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-nastaliq">
              پاس ورڈ (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none text-sm font-semibold font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 text-sm mt-3"
          >
            {loading ? 'توثیق ہو رہی ہے...' : (
              <>
                <span className="font-nastaliq text-base">لاگ ان فرمائیں (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>فوری لاگ ان (Demo Accounts):</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoUser('admin', 'admin123')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  username === 'admin'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs font-nastaliq">ایڈمن (Admin)</div>
                <div className="text-[9px] text-slate-500">مکمل اختیارات</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('operator', 'operator123')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  username === 'operator'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs font-nastaliq">آپریٹر (Counter)</div>
                <div className="text-[9px] text-slate-500">وصولی و واپسی</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('accounts', 'viewer123')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  username === 'accounts'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs font-nastaliq">حسابات (Viewer)</div>
                <div className="text-[9px] text-slate-500">صرف رپورٹس</div>
              </button>
            </div>
          </div>
        </form>

        <div className="bg-slate-50 p-3.5 text-center text-[11px] text-slate-500 border-t border-slate-100 font-medium">
          Jamia Laundry Management • Vercel & Neon Serverless
        </div>
      </div>
    </div>
  );
}
