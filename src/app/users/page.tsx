'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { User, UserRole } from '@/types';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Users,
  X,
  Lock,
} from 'lucide-react';

export default function UsersPage() {
  const { user } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Counter Operator' as UserRole,
  });
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setShowModal(false);
      setNewUser({ username: '', password: '', full_name: '', role: 'Counter Operator' });
      fetchUsers();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetModalUser.id, password: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      alert('پاس ورڈ کامیابی سے تبدیل کر دیا گیا!');
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-jamia-950 via-jamia-900 to-jamia-850 rounded-3xl p-6 sm:p-8 text-white shadow-jamia relative overflow-hidden border border-emerald-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-jamia-800 border border-gold-400/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>رسائی اور اختیارات</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white urdu-naskh">
                صارفین اور اختیارات (User Accounts & Roles)
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1">
                ایڈمنسٹریٹر، کاؤنٹر آپریٹرز اور آڈٹ اختیارات کے حامل اکاؤنٹس کا نظم
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>نیا صارف بنائیں (Create User)</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">صارف کا نام (Username)</th>
                <th className="p-3.5">مکمل نام</th>
                <th className="p-3.5 text-center">عہدہ / کردار (Role)</th>
                <th className="p-3.5 text-center">حالت</th>
                <th className="p-3.5 text-center">پاس ورڈ ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-jamia-800 border-t-transparent mb-2"></div>
                    <p className="text-xs font-semibold">صارفین کا ریکارڈ لوڈ کیا جا رہا ہے...</p>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-jamia-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {u.username}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 urdu-compact text-sm">{u.full_name}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${
                        u.role === 'Administrator'
                          ? 'bg-purple-50 text-purple-900 border-purple-200'
                          : u.role === 'Counter Operator'
                          ? 'bg-emerald-50 text-jamia-900 border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                        u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.active ? 'فعال' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="text-jamia-900 hover:text-gold-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 p-1.5 px-3 rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-gold-600" />
                        <span>پاس ورڈ ری سیٹ</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 urdu-compact">
                    نیا صارف شامل کریں (Create User Account)
                  </h3>
                  <p className="text-[10px] text-slate-500">کاؤنٹر آپریٹر یا ایڈمنسٹریٹر لاگ ان بنائیں</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">صارف کا نام (Username) *</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  placeholder="e.g. operator2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">مکمل نام (Full Name) *</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-semibold urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  placeholder="مثلاً: محمد وقاص"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">پاس ورڈ (Password) *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">عہدہ / اختیارات (Role) *</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                >
                  <option value="Counter Operator">Counter Operator (کاؤنٹر آپریٹر)</option>
                  <option value="Administrator">Administrator (ایڈمنسٹریٹر)</option>
                  <option value="Viewer">Viewer / Accounts (صرف رپورٹس اور حسابات)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition"
                >
                  کینسل کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-jamia-900 hover:bg-jamia-800 text-gold-300 font-bold rounded-xl shadow transition"
                >
                  صارف بنائیں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 urdu-compact">
                  پاس ورڈ تبدیل کریں ({resetModalUser.username})
                </h3>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نیا پاس ورڈ درج کریں *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  placeholder="نیا خفیہ کوڈ درج کریں"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition"
                >
                  کینسل
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-jamia-900 hover:bg-jamia-800 text-gold-300 font-bold rounded-xl shadow transition"
                >
                  تبدیل کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
