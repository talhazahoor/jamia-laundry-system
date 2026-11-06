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
  Sparkles,
  AlertTriangle,
  FileCode,
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
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-jamia-950 via-jamia-900 to-jamia-850 rounded-3xl p-6 sm:p-8 text-white shadow-jamia relative overflow-hidden border border-emerald-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-jamia-800 border border-gold-400/30 flex items-center justify-center shadow-inner">
              <SettingsIcon className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>جامعہ ایڈمنسٹریشن پینل</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white urdu-naskh">
                نظام کی ترتیبات اور ڈیٹا بیک اپ (Settings & Backup)
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1">
                ادارہ جاتی کوائف، پرنٹر سلیکشن، سرکاری کلیکشن کے ایام اور کلاؤڈ ڈیٹا بیک اپ
              </p>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-800 text-gold-300 p-4 rounded-2xl shadow-subtle flex items-center gap-3 text-xs font-bold border border-emerald-700/60 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-gold-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Jamia Organization Details */}
        <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 p-6 sm:p-7 space-y-4">
          <h3 className="font-bold text-sm text-jamia-950 pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <span>جامعہ اور لانڈری کے بنیادی کوائف (Organization Profile)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">جامعہ کا نام (اردو) *</label>
              <input
                type="text"
                required
                value={form.jamia_name}
                onChange={e => setForm({ ...form, jamia_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-slate-900 urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jamia Name (English) *</label>
              <input
                type="text"
                required
                value={form.jamia_name_en}
                onChange={e => setForm({ ...form, jamia_name_en: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">شعبہ لانڈری نام (اردو) *</label>
              <input
                type="text"
                required
                value={form.laundry_name}
                onChange={e => setForm({ ...form, laundry_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رابطہ فون نمبرز *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">مکمل پتہ و کیمپس کا مقام *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sarkari Collection Days & Turnaround */}
        <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 p-6 sm:p-7 space-y-4">
          <h3 className="font-bold text-sm text-jamia-950 pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span>سرکاری کلیکشن کے مقررہ دن اور متوقع واپسی (Schedule & Turnaround)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5">
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
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
                      isSelected
                        ? 'bg-jamia-900 text-gold-300 shadow-sm border border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
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
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">مثلاً: 2 دن بعد واپسی</span>
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
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">مثلاً: 1 دن بعد واپسی</span>
            </div>
          </div>
        </div>

        {/* Thermal Printer & Receipt Layout */}
        <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 p-6 sm:p-7 space-y-4">
          <h3 className="font-bold text-sm text-jamia-950 pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <span>تھرمل منی پرنٹر اور رسید کا فارمیٹ (Thermal Printer Settings)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">کاغذ کا سائز (Paper Width):</label>
              <select
                value={form.paper_width}
                onChange={e => setForm({ ...form, paper_width: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              >
                <option value="80mm">80 mm (معیاری تھرمل رول - ڈیسک ٹاپ)</option>
                <option value="58mm">58 mm (منی پورٹیبل تھرمل رول - بلوٹوتھ)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">پرنٹ کاپیاں (Copies):</label>
              <select
                value={form.print_copies}
                onChange={e => setForm({ ...form, print_copies: Number(e.target.value) as any })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              >
                <option value={1}>1 کاپی (طالب علم کے لیے)</option>
                <option value={2}>2 کاپیاں (طالب علم + لانڈری بیگ ٹیگ)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="printBarcode"
                checked={form.print_barcode}
                onChange={e => setForm({ ...form, print_barcode: e.target.checked })}
                className="w-4 h-4 text-jamia-800 rounded border-slate-300 focus:ring-jamia-600"
              />
              <label htmlFor="printBarcode" className="font-bold text-slate-900 cursor-pointer">
                رسید پر کیو آر / بارکوڈ پرنٹ کریں
              </label>
            </div>
          </div>

          <div className="text-xs space-y-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رسید ہیڈر کا متن (Header Text):</label>
              <input
                type="text"
                value={form.receipt_header}
                onChange={e => setForm({ ...form, receipt_header: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">رسید فوٹر / شرائط و ضوابط (Footer Terms):</label>
              <textarea
                rows={2}
                value={form.receipt_footer}
                onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
                className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-jamia-900 to-jamia-800 hover:from-jamia-850 hover:to-jamia-750 text-gold-300 font-bold px-7 py-3 rounded-2xl text-xs shadow-md flex items-center gap-2.5 transition border border-emerald-800"
          >
            <Save className="w-4 h-4 text-gold-400" />
            <span>{saving ? 'محفوظ ہو رہا ہے...' : 'تمام ترتیبات محفوظ کریں'}</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Box */}
      <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 p-6 sm:p-7 space-y-4">
        <h3 className="font-bold text-sm text-jamia-950 pb-3 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>ڈیٹا بیس کلاؤڈ بیک اپ اور بحالی (Backup & Restore - NFR-05)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Backup Download */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 mb-1">مکمل ڈیٹا بیس بیک اپ ڈاؤن لوڈ کریں</div>
              <p className="text-slate-500 mb-4 leading-relaxed">
                تمام طلبہ، رسیدات، ریٹ لسٹ اور آڈٹ لاگز کو سنگل خودکار بیک اپ JSON فائل کے طور پر محفوظ رکھیں۔
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="bg-jamia-900 hover:bg-jamia-800 text-gold-300 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition border border-emerald-800"
            >
              <Download className="w-4 h-4 text-gold-400" />
              <span>فوری بیک اپ ڈاؤن لوڈ کریں (Backup Now)</span>
            </button>
          </div>

          {/* Restore */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-900 mb-1">سابقہ بیک اپ فائل سے بحال کریں (Restore)</div>
              <p className="text-slate-500 mb-3 leading-relaxed">
                سابقہ بیک اپ فائل (.json) منتخب کر کے نظام کا ڈیٹا بحال کریں۔
              </p>
              <input
                type="file"
                accept=".json"
                onChange={e => setRestoreFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white file:text-slate-700 border border-slate-200 rounded-xl p-1.5 bg-white mb-3"
              />
            </div>
            <button
              onClick={handleRestoreBackup}
              disabled={!restoreFile || restoring}
              className="bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
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
