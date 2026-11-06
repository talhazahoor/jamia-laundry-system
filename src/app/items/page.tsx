'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { LaundryItem } from '@/types';
import {
  Tags,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Sparkles,
  Shirt,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function ItemsPage() {
  const { user } = useApp();
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<LaundryItem>>({});
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save item');

      setShowModal(false);
      setEditingItem({});
      fetchItems();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-jamia-950 via-jamia-900 to-jamia-850 rounded-3xl p-6 sm:p-8 text-white shadow-jamia relative overflow-hidden border border-emerald-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-jamia-800 border border-gold-400/30 flex items-center justify-center shadow-inner">
              <Shirt className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>جامعہ لانڈری نرخ نامہ</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white urdu-naskh">
                کپڑوں کی اشیاء اور ریٹ لسٹ (Laundry Items & Rates)
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1">
                پرائیویٹ دھلائی و استری کے نرخ، سرکاری کوٹہ میں شمولیت اور ڈسپلے ترتیب
              </p>
            </div>
          </div>

          {user?.role === 'Administrator' && (
            <button
              onClick={() => {
                setEditingItem({
                  name_ur: '',
                  name_en: '',
                  display_order: items.length + 1,
                  private_rate: 30,
                  allowed_sarkari: true,
                  allowed_private: true,
                  active: true,
                });
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>نئی شے شامل کریں (Add Item)</span>
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center">ترتیب #</th>
                <th className="p-3.5">اردو نام شے</th>
                <th className="p-3.5">English Item Name</th>
                <th className="p-3.5 text-left">پرائیویٹ ریٹ (PKR)</th>
                <th className="p-3.5 text-center">سرکاری لانڈری (مفت)</th>
                <th className="p-3.5 text-center">پرائیویٹ لانڈری</th>
                <th className="p-3.5 text-center">حالت</th>
                {user?.role === 'Administrator' && <th className="p-3.5 text-center">ایکشن</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-jamia-800 border-t-transparent mb-2"></div>
                    <p className="text-xs font-semibold">نرخ نامہ لوڈ ہو رہا ہے...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Shirt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">کوئی شے درج نہیں ہے</p>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{item.display_order}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 urdu-compact text-sm">{item.name_ur}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{item.name_en}</td>
                    <td className="p-3 text-left">
                      <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl font-bold font-mono text-xs">
                        Rs {item.private_rate}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.allowed_sarkari ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>شامل ہے</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                          <span>صرف پرائیویٹ</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.allowed_private ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>شامل ہے</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">نہیں</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.active ? 'فعال' : 'غیر فعال'}
                      </span>
                    </td>
                    {user?.role === 'Administrator' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-jamia-900 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
                          title="ترمیم کریں"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Shirt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 urdu-compact">
                    {editingItem.id ? 'ریٹ اور شے کی تفصیل میں ترمیم' : 'نئی شے شامل کریں'}
                  </h3>
                  <p className="text-[10px] text-slate-500">کپڑوں کے نرخ نامہ اور اقسام کی ترتیب</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اردو نام شے *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name_ur || ''}
                    onChange={e => setEditingItem({ ...editingItem, name_ur: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="مثلاً: قمیض"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">English Name *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name_en || ''}
                    onChange={e => setEditingItem({ ...editingItem, name_en: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="e.g. Qameez / Kurta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">پرائیویٹ ریٹ (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingItem.private_rate ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, private_rate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ڈسپلے ترتیب نمبر #</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.display_order || 1}
                    onChange={e => setEditingItem({ ...editingItem, display_order: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2.5 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowed_sarkari !== false}
                    onChange={e => setEditingItem({ ...editingItem, allowed_sarkari: e.target.checked })}
                    className="w-4 h-4 text-jamia-800 rounded border-slate-300 focus:ring-jamia-600"
                  />
                  <span className="font-semibold text-slate-800">
                    سرکاری لانڈری کے لیے مجاز ہے (Allowed for Sarkari Free)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowed_private !== false}
                    onChange={e => setEditingItem({ ...editingItem, allowed_private: e.target.checked })}
                    className="w-4 h-4 text-jamia-800 rounded border-slate-300 focus:ring-jamia-600"
                  />
                  <span className="font-semibold text-slate-800">
                    پرائیویٹ لانڈری کے لیے مجاز ہے (Allowed for Private)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.active !== false}
                    onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                    className="w-4 h-4 text-jamia-800 rounded border-slate-300 focus:ring-jamia-600"
                  />
                  <span className="font-semibold text-slate-800">
                    فعال ہے (Active)
                  </span>
                </label>
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
                  disabled={saving}
                  className="px-5 py-2 bg-jamia-900 hover:bg-jamia-800 text-gold-300 font-bold rounded-xl shadow transition"
                >
                  {saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
