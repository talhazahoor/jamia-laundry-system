'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { translations } from '@/lib/i18n';
import { Lock, User, ShieldAlert, Eye, EyeOff, Languages } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, settings, lang, setLang } = useApp();
  const t = translations[lang];

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
        throw new Error(data.error || (lang === 'en' ? 'Login failed' : 'لاگ ان نا کام رہا'));
      }

      setUser(data.user);
      router.push('/counter');
    } catch (err: any) {
      setError(err.message || (lang === 'en' ? 'Login failed' : 'لاگ ان نا کام رہا'));
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      {/* Top right language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
        </button>
      </div>

      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-lg ring-2 ring-emerald-500/20 flex items-center justify-center">
              <img src="/logos/laundry-logo.png" alt="Laundry Services Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-base font-bold text-white mb-0.5">
            {lang === 'en' ? (settings.jamia_name_en || settings.jamia_name) : settings.jamia_name}
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
              {t.username_col}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={`w-full py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs font-semibold ${
                  lang === 'en' ? 'pl-8 pr-3' : 'pr-8 pl-3'
                }`}
                placeholder="Username"
              />
              <User className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${lang === 'en' ? 'left-2.5' : 'right-2.5'}`} />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs ${
                  lang === 'en' ? 'pl-8 pr-8' : 'pr-8 pl-8'
                }`}
                placeholder="••••••••"
              />
              <Lock className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${lang === 'en' ? 'left-2.5' : 'right-2.5'}`} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-2.5 text-slate-400 hover:text-slate-600 ${lang === 'en' ? 'right-2.5' : 'left-2.5'}`}
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
            {loading ? t.verifying : t.sign_in_btn}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="font-semibold text-slate-700">{t.demo_logins}</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoUser('admin', 'admin123')}
                className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium"
              >
                {t.admin_role}
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('operator1', 'operator123')}
                className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium"
              >
                {t.operator_role}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}