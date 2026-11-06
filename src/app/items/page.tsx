'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { LaundryItem } from '@/types';
import { Tags, Plus, Edit2, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Tags className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 urdu-compact">
              کپڑوں کی اشیاء اور ریٹ لسٹ (Laundry Items & Rates)
            </h1>
            <p className="text-xs text-slate-500">
              پرائیویٹ نرخ نامہ، سرکاری اجازت اور ڈسپلے کی ترتیب
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
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>نئی شے شامل کریں (Add Item)</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-xs text-right">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-3 text-center">ترتیب #</th>
              <th className="p-3">اردو نام</th>
              <th className="p-3">English Name</th>
              <th className="p-3 text-left">پرائیویٹ ریٹ (PKR)</th>
              <th className="p-3 text-center">سرکاری میں شامل</th>
              <th className="p-3 text-center">پرائیویٹ میں شامل</th>
              <th className="p-3 text-center">حالت</th>
              {user?.role === 'Administrator' && <th className="p-3 text-center">ایکشن</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">لوڈ ہو رہا ہے...</td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center font-bold text-slate-500">{item.display_order}</td>
                  <td className="p-3 font-bold text-slate-900 urdu-compact text-sm">{item.name_ur}</td>
                  <td className="p-3 text-slate-700 font-medium">{item.name_en}</td>
                  <td className="p-3 text-left font-bold text-slate-900 text-sm">
                    Rs {item.private_rate}
                  </td>
                  <td className="p-3 text-center">
                    {item.allowed_sarkari ? (
                      <span className="text-emerald-600 font-semibold">✓ شامل ہے</span>
                    ) : (
                      <span className="text-slate-400">✗ نہیں (Private Only)</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.allowed_private ? (
                      <span className="text-emerald-600 font-semibold">✓ شامل ہے</span>
                    ) : (
                      <span className="text-slate-400">✗ نہیں</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
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
                        className="p-1 rounded text-slate-600 hover:text-emerald-600 hover:bg-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b mb-4">
              {editingItem.id ? 'ریٹ اور شے میں ترمیم' : 'نئی شے شامل کریں'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اردو نام *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name_ur || ''}
                    onChange={e => setEditingItem({ ...editingItem, name_ur: e.target.value })}
                    className="w-full p-2 border rounded-lg font-bold"
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
                    className="w-full p-2 border rounded-lg"
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
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ڈسپلے ترتیب #</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.display_order || 1}
                    onChange={e => setEditingItem({ ...editingItem, display_order: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowSarkari"
                    checked={editingItem.allowed_sarkari !== false}
                    onChange={e => setEditingItem({ ...editingItem, allowed_sarkari: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="allowSarkari" className="font-semibold text-slate-700">
                    سرکاری لانڈری کے لیے مجاز ہے (Allowed for Sarkari)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowPrivate"
                    checked={editingItem.allowed_private !== false}
                    onChange={e => setEditingItem({ ...editingItem, allowed_private: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="allowPrivate" className="font-semibold text-slate-700">
                    پرائیویٹ لانڈری کے لیے مجاز ہے (Allowed for Private)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeItem"
                    checked={editingItem.active !== false}
                    onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="activeItem" className="font-semibold text-slate-700">
                    فعال ہے (Active)
                  </label>
                </div>
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
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow"
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
