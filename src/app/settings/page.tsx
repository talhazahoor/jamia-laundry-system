'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { SettingsMap } from '@/types';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Calendar,
  Printer,
  Building,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, settings, updateLocalSettings } = useApp();
  const [form, setForm] = useState<SettingsMap>(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      updateLocalSettings(data.settings);
      setSuccess('ترتیبات کامیابی سے محفوظ ہو گئیں');
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleCollectionDay = (dayNum: number) => {
    const current = [...(form.sarkari_collection_days || [])];
    const idx = current.indexOf(dayNum);
    if (idx !== -1) {
      current.splice(idx, 1);
    } else {
      current.push(dayNum);
    }
    setForm({ ...form, sarkari_collection_days: current });
  };

  const daysOfWeek = [
    { num: 1, ur: 'پیر (Mon)' },
    { num: 2, ur: 'منگل (Tue)' },
    { num: 3, ur: 'بدھ (Wed)' },
    { num: 4, ur: 'جمعرات (Thu)' },
    { num: 5, ur: 'جمعہ (Fri)' },
    { num: 6, ur: 'ہفتہ (Sat)' },
    { num: 0, ur: 'اتوار (Sun)' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">نظام کی ترتیبات (System Settings)</h1>
          <p className="text-[11px] text-slate-500">
            ادارہ جاتی کوائف، پرنٹر سیٹ اپ، سرکاری ایام اور بیک اپ
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-700 text-white p-2.5 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        
        {/* Institution Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="font-semibold text-slate-800 pb-2 border-b text-xs flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span>جامعہ اور شعبہ لانڈری کے کوائف</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">جامعہ کا نام (اردو) *</label>
              <input
                type="text"
                required
                value={form.jamia_name}
                onChange={e => setForm({ ...form, jamia_name: e.target.value })}
                className="w-full p-2 border rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">English Name *</label>
              <input
                type="text"
                required
                value={form.jamia_name_en}
                onChange={e => setForm({ ...form, jamia_name_en: e.target.value })}
                className="w-full p-2 border rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">لانڈری نام *</label>
              <input
                type="text"
                required
                value={form.laundry_name}
                onChange={e => setForm({ ...form, laundry_name: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">فون نمبر *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2 border rounded-lg font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">مکمل پتہ *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Turnaround */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="font-semibold text-slate-800 pb-2 border-b text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>سرکاری کلیکشن کے ایام و واپسی کی مدت</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
              مقررہ دن منتخب کریں (ڈیفالٹ: منگل اور جمعہ):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {daysOfWeek.map(d => {
                const isSelected = form.sarkari_collection_days?.includes(d.num);
                return (
                  <button
                    type="button"
                    key={d.num}
                    onClick={() => toggleCollectionDay(d.num)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.ur} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                سرکاری متوقع واپسی (دن):
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={form.sarkari_turnaround_days}
                onChange={e => setForm({ ...form, sarkari_turnaround_days: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                پرائیویٹ متوقع واپسی (دن):
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={form.private_turnaround_days}
                onChange={e => setForm({ ...form, private_turnaround_days: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Thermal Printer Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="font-semibold text-slate-800 pb-2 border-b text-xs flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-500" />
            <span>تھرمل پرنٹر فارمیٹ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">کاغذ کا سائز:</label>
              <select
                value={form.paper_width}
                onChange={e => setForm({ ...form, paper_width: e.target.value as any })}
                className="w-full p-2 border rounded-lg font-medium"
              >
                <option value="80mm">80 mm (معیاری)</option>
                <option value="58mm">58 mm (منی پورٹیبل)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">پرنٹ کاپیاں:</label>
              <select
                value={form.print_copies}
                onChange={e => setForm({ ...form, print_copies: Number(e.target.value) as any })}
                className="w-full p-2 border rounded-lg font-medium"
              >
                <option value={1}>1 کاپی (طالب علم)</option>
                <option value={2}>2 کاپیاں (طالب علم + لانڈری بیگ)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="printBarcode"
                checked={form.print_barcode}
                onChange={e => setForm({ ...form, print_barcode: e.target.checked })}
                className="w-3.5 h-3.5 text-emerald-600 rounded"
              />
              <label htmlFor="printBarcode" className="font-medium text-slate-800 cursor-pointer">
                کیو آر / بارکوڈ شامل کریں
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'محفوظ ہو رہا ہے...' : 'ترتیبات محفوظ کریں'}</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="font-semibold text-slate-800 pb-2 border-b text-xs">
          ڈیٹا بیک اپ (Backup)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
            <p className="text-slate-500 mb-3 text-[11px]">
              تمام طلبہ، رسیدات اور ریٹ لسٹ کا مکمل ڈیٹا بیس بیک اپ محفوظ کریں۔
            </p>
            <button
              onClick={() => window.location.href = '/api/backup'}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>بیک اپ ڈاؤن لوڈ کریں</span>
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
            <p className="text-slate-500 mb-2 text-[11px]">
              سابقہ JSON فائل سے ڈیٹا بحال کریں:
            </p>
            <input
              type="file"
              accept=".json"
              onChange={e => setRestoreFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white file:text-slate-700 border rounded p-1 bg-white mb-2"
            />
            <button
              onClick={async () => {
                if (!restoreFile) return;
                if (!confirm('کیا آپ واقعی بیک اپ بحال کرنا چاہتے ہیں؟')) return;
                setRestoring(true);
                try {
                  const text = await restoreFile.text();
                  const parsed = JSON.parse(text);
                  const res = await fetch('/api/backup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed),
                  });
                  if (!res.ok) throw new Error('Restore failed');
                  alert('بیک اپ کامیابی سے بحال ہو گیا!');
                  window.location.reload();
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setRestoring(false);
                }
              }}
              disabled={!restoreFile || restoring}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{restoring ? 'بحالی جاری...' : 'ڈیٹا بیس بحال کریں'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
