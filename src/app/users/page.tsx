'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { User, UserRole } from '@/types';
import { ShieldCheck, UserPlus, KeyRound, CheckCircle2, UserCheck } from 'lucide-react';

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
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 urdu-compact">
              صارفین اور اختیارات (User Accounts & Roles)
            </h1>
            <p className="text-xs text-slate-500">
              ایڈمن، کاؤنٹر آپریٹرز اور آڈٹ اختیارات
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
        >
          <UserPlus className="w-4 h-4" />
          <span>نیا صارف بنائیں (Create User)</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-xs text-right">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-3">صارف کا نام (Username)</th>
              <th className="p-3">مکمل نام</th>
              <th className="p-3 text-center">عہدہ / کردار (Role)</th>
              <th className="p-3 text-center">حالت</th>
              <th className="p-3 text-center">ایکشن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">لوڈ ہو رہا ہے...</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">{u.username}</td>
                  <td className="p-3 font-semibold text-slate-800 urdu-compact">{u.full_name}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'Administrator'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : u.role === 'Counter Operator'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.active ? 'فعال' : 'معطل'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setResetModalUser(u)}
                      className="text-purple-700 hover:text-purple-900 p-1 rounded font-semibold text-[11px] flex items-center justify-center gap-1 mx-auto"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>پاس ورڈ ری سیٹ</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b mb-4">
              نیا صارف شامل کریں (Create User Account)
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">صارف کا نام (Username) *</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
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
                  className="w-full p-2 border rounded-lg font-semibold"
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
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">عہدہ / اختیارات (Role) *</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full p-2 border rounded-lg font-semibold"
                >
                  <option value="Counter Operator">Counter Operator (کاؤنٹر آپریٹر)</option>
                  <option value="Administrator">Administrator (ایڈمنسٹریٹر)</option>
                  <option value="Viewer">Viewer / Accounts (صرف رپورٹس اور حسابات)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100"
                >
                  کینسل کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg shadow"
                >
                  محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 pb-2 border-b mb-3">
              پاس ورڈ تبدیل کریں ({resetModalUser.username})
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نیا پاس ورڈ درج کریں *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="New password"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  کینسل
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg shadow"
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
