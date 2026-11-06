'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { translations } from '@/lib/i18n';
import { User, UserRole } from '@/types';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  X,
} from 'lucide-react';

export default function UsersPage() {
  const { user, lang } = useApp();
  const t = translations[lang];

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
      alert(`${lang === 'en' ? 'Error' : 'خرابی'}: ${err.message}`);
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

      alert(lang === 'en' ? 'Password changed successfully' : 'پاس ورڈ تبدیل ہو گیا');
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(`${lang === 'en' ? 'Error' : 'خرابی'}: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">{t.user_heading}</h1>
          <p className="text-[11px] text-slate-500">
            {t.user_subheading}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t.new_user}</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-start">{t.username_col}</th>
                <th className="p-2.5 text-start">{t.fullname_col}</th>
                <th className="p-2.5 text-center">{t.role_col}</th>
                <th className="p-2.5 text-center">{t.status}</th>
                <th className="p-2.5 text-center">{t.password}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">{t.loading}</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{u.username}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{u.full_name}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.role === 'Administrator' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {u.role === 'Administrator' ? t.admin_role : u.role === 'Viewer' ? t.viewer_role : t.operator_role}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.active ? t.active : (lang === 'en' ? 'Suspended' : 'معطل')}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="text-slate-500 hover:text-slate-800 p-1 text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span>{t.reset_btn}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="font-bold text-slate-900 text-sm">{t.create_user_modal}</span>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.username_col} *</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="operator2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.fullname_col} *</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full p-2 border rounded-lg font-semibold"
                  placeholder={lang === 'en' ? 'Muhammad Bilal' : 'محمد بلال'}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.password} *</label>
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
                <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.role_col} *</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Counter Operator">{t.operator_role}</option>
                  <option value="Administrator">{t.admin_role}</option>
                  <option value="Viewer">{t.viewer_role}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="font-bold text-slate-900 text-sm">
                {t.reset_password_modal} ({resetModalUser.username})
              </span>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.new_password_req}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="New password"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500"
                >
                  {t.change_btn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}