'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { SettingsMap } from '@/types';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  ShieldCheck,
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
      setSuccess('ترتیبات کامیابی سے محفوظ ہو گئیں! (Settings saved successfully)');
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

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) return;
    if (!confirm('انتباہ: بیک اپ بحال کرنے سے موجودہ ریکارڈز تبدیل ہو جائیں گے۔ کیا آپ آگے بڑھنا چاہتے ہیں؟')) {
      return;
    }

    setRestoring(true);
    try {
      const text = await restoreFile.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      alert('بیک اپ کامیابی سے بحال ہو گیا! صفحہ ریفریش کیا جا رہا ہے۔');
      window.location.reload();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setRestoring(false);
    }
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 urdu-compact">
              نظام کی ترتیبات اور ڈیٹا بیک اپ (Settings & Backup)
            </h1>
            <p className="text-xs text-slate-500">
              پرنٹر، جامعہ کے کوائف، سرکاری دن اور بیک اپ کنٹرول
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Jamia Organization Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 pb-2 border-b flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>جامعہ اور لانڈری کے بنیادی کوائف (Organization Info)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">جامعہ کا نام (اردو) *</label>
              <input
                type="text"
                required
                value={form.jamia_name}
                onChange={e => setForm({ ...form, jamia_name: e.target.value })}
                className="w-full p-2 border rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jamia Name (English) *</label>
              <input
                type="text"
                required
                value={form.jamia_name_en}
                onChange={e => setForm({ ...form, jamia_name_en: e.target.value })}
                className="w-full p-2 border rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">شعبہ لانڈری نام (اردو) *</label>
              <input
                type="text"
                required
                value={form.laundry_name}
                onChange={e => setForm({ ...form, laundry_name: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رابطہ فون نمبرز *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2 border rounded-lg font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">مکمل پتہ و مقام (Campus Address) *</label>
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

        {/* Sarkari Collection Days & Turnaround */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 pb-2 border-b flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>سرکاری کلیکشن کے مقررہ دن اور متوقع واپسی (Schedule & Turnaround)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              سرکاری کپڑوں کی وصولی کے ایام (SAR-04: ڈیفالٹ منگل اور جمعہ):
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              {daysOfWeek.map(d => {
                const isSelected = form.sarkari_collection_days?.includes(d.num);
                return (
                  <button
                    type="button"
                    key={d.num}
                    onClick={() => toggleCollectionDay(d.num)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {d.ur} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                سرکاری کپڑوں کی متوقع واپسی (Turnaround Days):
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={form.sarkari_turnaround_days}
                onChange={e => setForm({ ...form, sarkari_turnaround_days: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg font-bold"
              />
              <span className="text-[11px] text-slate-500">مثلاً: 2 دن بعد</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                پرائیویٹ کپڑوں کی متوقع واپسی (Turnaround Days):
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={form.private_turnaround_days}
                onChange={e => setForm({ ...form, private_turnaround_days: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg font-bold"
              />
              <span className="text-[11px] text-slate-500">مثلاً: 1 دن بعد</span>
            </div>
          </div>
        </div>

        {/* Thermal Printer & Receipt Layout */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 pb-2 border-b flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>تھرمل منی پرنٹر اور رسید کا فارمیٹ (Thermal Printer Settings)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">کاغذ کا سائز (Paper Width):</label>
              <select
                value={form.paper_width}
                onChange={e => setForm({ ...form, paper_width: e.target.value as any })}
                className="w-full p-2 border rounded-lg font-bold"
              >
                <option value="80mm">80 mm (معیاری تھرمل رول)</option>
                <option value="58mm">58 mm (منی پورٹیبل تھرمل رول)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">پرنٹ کاپیاں (Copies):</label>
              <select
                value={form.print_copies}
                onChange={e => setForm({ ...form, print_copies: Number(e.target.value) as any })}
                className="w-full p-2 border rounded-lg font-bold"
              >
                <option value={1}>1 کاپی (طالب علم کے لیے)</option>
                <option value={2}>2 کاپیاں (طالب علم + لانڈری بیگ ٹیگ)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="printBarcode"
                checked={form.print_barcode}
                onChange={e => setForm({ ...form, print_barcode: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="printBarcode" className="font-bold text-slate-800">
                رسید پر کیو آر / بارکوڈ پرنٹ کریں
              </label>
            </div>
          </div>

          <div className="text-xs space-y-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رسید ہیڈر کا متن (Receipt Header Text):</label>
              <input
                type="text"
                value={form.receipt_header}
                onChange={e => setForm({ ...form, receipt_header: e.target.value })}
                className="w-full p-2 border rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رسید فوٹر / شرائط و ضوابط (Footer / Terms):</label>
              <textarea
                rows={2}
                value={form.receipt_footer}
                onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
                className="w-full p-2 border rounded-lg urdu-compact"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'محفوظ ہو رہا ہے...' : 'ترتیبات محفوظ کریں'}</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Box (NFR-05) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 pb-2 border-b flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ڈیٹا بیس بیک اپ اور ری اسٹور (Backup & Restore - NFR-05)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Backup Download */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 mb-1">مکمل ڈیٹا بیس بیک اپ ڈاؤن لوڈ کریں</div>
              <p className="text-slate-500 mb-4">
                تمام طلبہ، رسیدات، ریٹ لسٹ اور آڈٹ لاگ کو سنگل محفوظ JSON فائل میں محفوظ کریں۔
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>فوری بیک اپ ڈاؤن لوڈ کریں (Backup Now)</span>
            </button>
          </div>

          {/* Restore */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 mb-1">بیک اپ فائل سے بحال کریں (Restore)</div>
              <p className="text-slate-500 mb-3">
                سابقہ بیک اپ فائل (.json) منتخب کر کے نظام کا ڈیٹا بحال کریں۔
              </p>
              <input
                type="file"
                accept=".json"
                onChange={e => setRestoreFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-white file:text-slate-700 border rounded p-1 bg-white mb-3"
              />
            </div>
            <button
              onClick={handleRestoreBackup}
              disabled={!restoreFile || restoring}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow"
            >
              <Upload className="w-4 h-4" />
              <span>{restoring ? 'بحالی جاری ہے...' : 'ڈیٹا بیس بحال کریں (Restore Now)'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
