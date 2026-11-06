'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { translations } from '@/lib/i18n';
import { LaundryItem } from '@/types';
import {
  Tags,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Shirt,
} from 'lucide-react';

export default function ItemsPage() {
  const { user, lang } = useApp();
  const t = translations[lang];

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
      alert(`${lang === 'en' ? 'Error' : 'خرابی'}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">{t.items_title}</h1>
          <p className="text-[11px] text-slate-500">
            {t.items_subtitle}
          </p>
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
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.new_item}</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-center">{t.order}</th>
                <th className="p-2.5 text-start">{t.item_ur}</th>
                <th className="p-2.5 text-start">{t.item_en}</th>
                <th className="p-2.5 text-start">{t.rate_rs}</th>
                <th className="p-2.5 text-center">{t.sarkari_quota}</th>
                <th className="p-2.5 text-center">{t.private_quota}</th>
                <th className="p-2.5 text-center">{t.status}</th>
                {user?.role === 'Administrator' && <th className="p-2.5 text-center">{t.actions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">{t.loading}</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">{t.no_items_found}</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 text-center font-mono text-slate-400">#{item.display_order}</td>
                    <td className="p-2.5 font-bold text-slate-900">{item.name_ur}</td>
                    <td className="p-2.5 text-slate-500">{item.name_en}</td>
                    <td className="p-2.5 text-start font-mono font-bold text-slate-900">Rs {item.private_rate}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.allowed_sarkari ? 'bg-blue-50 text-blue-700' : 'text-slate-400'
                      }`}>
                        {item.allowed_sarkari ? t.included : t.not_included}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.allowed_private ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                      }`}>
                        {item.allowed_private ? t.included : t.not_included}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {item.active ? t.active : t.inactive}
                      </span>
                    </td>
                    {user?.role === 'Administrator' && (
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowModal(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title={t.edit}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="font-bold text-slate-900 text-sm">
                {editingItem.id ? t.edit_item_title : t.add_item_title}
              </span>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.item_ur} *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name_ur || ''}
                    onChange={e => setEditingItem({ ...editingItem, name_ur: e.target.value })}
                    className="w-full p-2 border rounded-lg font-bold"
                    placeholder="قمیض"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.item_en} *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name_en || ''}
                    onChange={e => setEditingItem({ ...editingItem, name_en: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Qameez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.rate_rs} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingItem.private_rate ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, private_rate: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">{t.order} #</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.display_order || 1}
                    onChange={e => setEditingItem({ ...editingItem, display_order: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowed_sarkari !== false}
                    onChange={e => setEditingItem({ ...editingItem, allowed_sarkari: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span>{t.included_in_sarkari_quota}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.allowed_private !== false}
                    onChange={e => setEditingItem({ ...editingItem, allowed_private: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span>{t.included_in_private_billing}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.active !== false}
                    onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <span>{t.item_active_check}</span>
                </label>
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
                  disabled={saving}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 shadow-sm"
                >
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}