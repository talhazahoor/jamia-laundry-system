'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Lock, User, ShieldAlert, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl mx-auto flex items-center justify-center mb-3 shadow text-lg font-bold">
            ج
          </div>
          <h1 className="text-base font-bold text-white mb-0.5">
            {settings.jamia_name}
          </h1>
          <p className="text-slate-400 text-xs">
            {settings.laundry_name}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              صارف کا نام (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs font-semibold"
                placeholder="Username"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              پاس ورڈ (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                placeholder="••••••••"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs shadow-sm transition"
          >
            {loading ? 'تصدیق ہو رہی ہے...' : 'لاگ ان کریں (Sign In)'}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="font-semibold text-slate-700">ٹیسٹ کے لیے کلک کریں (Demo Logins):</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoUser('admin', 'admin123')}
                className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium"
              >
                ایڈمنسٹریٹر (Admin)
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('operator1', 'operator123')}
                className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium"
              >
                کاؤنٹر آپریٹر (Operator)
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
