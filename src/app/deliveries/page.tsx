'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Receipt } from '@/types';
import {
  PackageCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  User,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Check,
  Building,
  Printer,
  Shirt,
} from 'lucide-react';

export default function DeliveriesPage() {
  const { user, t } = useApp();
  const [receiptInput, setReceiptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [unpaidAlert, setUnpaidAlert] = useState(false);
  const [deliveryRemarks, setDeliveryRemarks] = useState('');
  const [delivering, setDelivering] = useState(false);

  // Bulk Ready State
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const lookupReceipt = async (targetNo?: string) => {
    const q = (targetNo || receiptInput).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setReceipt(null);
    setUnpaidAlert(false);

    try {
      const res = await fetch(`/api/receipts/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'رسید کا ریکارڈ نہیں ملا (Receipt not found)');
      }

      setReceipt(data.receipt);
      if (data.receipt.type === 'Private' && data.receipt.payment_status === 'Unpaid') {
        setUnpaidAlert(true);
      }
    } catch (err: any) {
      setError(err.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (collectPaymentNow = false) => {
    if (!receipt) return;
    setDelivering(true);
    setError(null);

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deliver',
          receipt_no: receipt.receipt_no,
          remarks: deliveryRemarks,
          collect_payment_now: collectPaymentNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresPayment) {
          setUnpaidAlert(true);
          return;
        }
        throw new Error(data.error || 'Failed to mark delivered');
      }

      setSuccess(`رسید ${receipt.receipt_no} کے کپڑے طالب علم کو کامیابی سے حوالے کر دیے گئے! (Delivered)`);
      setReceipt(data.receipt);
      setUnpaidAlert(false);
      setReceiptInput('');
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDelivering(false);
    }
  };

  const handleBulkMarkReady = async () => {
    if (!confirm('کیا آپ آج کی تمام موصول شدہ سرکاری رسیدات کو "تیار" (Ready) نشان زد کرنا چاہتے ہیں؟')) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_ready' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk update failed');

      setSuccess(data.message || `کامیابی سے اپ ڈیٹ کر دیا گیا! (${data.updatedCount} رسیدات)`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl shadow-jamia border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold shadow-md">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-nastaliq leading-snug">
              کپڑوں کی واپسی اور ترسیل (Clothes Return & Delivery)
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              بارکوڈ / کیو آر اسکین کریں یا رسید نمبر درج فرمائیں (DLV-01)
            </p>
          </div>
        </div>

        {/* Bulk Ready button (DLV-03) */}
        <button
          onClick={handleBulkMarkReady}
          disabled={bulkProcessing}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>{bulkProcessing ? 'عمل جاری...' : 'آج کے تمام سرکاری کپڑے تیار (Mark Ready)'}</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-fade-in border border-emerald-400/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="font-nastaliq">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-100 hover:text-white p-1 rounded-lg">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Receipt Scan Input Hero */}
      <div className="bg-white rounded-3xl shadow-jamia border border-slate-200/80 p-6 space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>رسید نمبر یا بارکوڈ اسکین (Scan Receipt / Barcode):</span>
          <span className="text-[11px] text-slate-400 font-normal">مثال کے طور پر: <button onClick={() => lookupReceipt('S-000101')} className="underline font-mono text-emerald-700 font-bold">S-000101</button> یا <button onClick={() => lookupReceipt('P-000201')} className="underline font-mono text-emerald-700 font-bold">P-000201</button></span>
        </label>
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={receiptInput}
              onChange={e => setReceiptInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  lookupReceipt();
                }
              }}
              placeholder="رسید نمبر درج کریں یا بارکوڈ اسکین کریں..."
              className="w-full pl-4 pr-11 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:outline-none text-base font-bold text-slate-900 shadow-inner font-mono"
              autoFocus
            />
            <QrCode className="w-5 h-5 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
          </div>
          <button
            onClick={() => lookupReceipt()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-7 py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'تلاش...' : 'رسید تلاش کریں'}</span>
          </button>
        </div>
      </div>

      {/* Verification & Delivery Card */}
      {receipt && (
        <div className="bg-white rounded-3xl shadow-jamia-lg border border-slate-200 overflow-hidden animate-fade-in">
          {/* Top Banner */}
          <div className={`p-5 text-white flex flex-wrap items-center justify-between gap-4 ${
            receipt.status === 'Delivered'
              ? 'bg-slate-800'
              : receipt.type === 'Sarkari'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-800'
              : 'bg-gradient-to-r from-amber-600 to-orange-700'
          }`}>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/80 font-bold">
                {receipt.type === 'Sarkari' ? 'سرکاری لانڈری رسید' : 'پرائیویٹ لانڈری رسید'}
              </div>
              <div className="text-2xl font-black font-mono mt-0.5">{receipt.receipt_no}</div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                receipt.status === 'Delivered'
                  ? 'bg-emerald-500 text-white'
                  : receipt.status === 'Ready'
                  ? 'bg-blue-500 text-white ring-2 ring-white/30'
                  : 'bg-white/20 text-white'
              }`}>
                حالت: {receipt.status}
              </span>

              {receipt.type === 'Private' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  receipt.payment_status === 'Paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white animate-pulse'
                }`}>
                  {receipt.payment_status === 'Paid' ? 'بل ادا شدہ' : 'بل غیر ادا شدہ (Rs ' + receipt.total_amount + ')'}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Student Identity Verification Card (DLV-01) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden ring-4 ring-emerald-500/20 shadow-md shrink-0 flex items-center justify-center">
                {receipt.photo_url ? (
                  <img src={receipt.photo_url} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 text-xs w-full">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold">رجسٹریشن نمبر:</span>
                  <span className="font-bold text-slate-900 text-base font-mono">{receipt.student_reg_no}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold">طالب علم کا نام:</span>
                  <span className="font-bold text-slate-900 text-base font-nastaliq leading-tight">{receipt.student_name}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold">ولدیت:</span>
                  <span className="font-semibold text-slate-800 font-nastaliq">{receipt.father_name}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold">کلاس و سیکشن:</span>
                  <span className="font-medium text-slate-800">{receipt.class_name} ({receipt.section})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold">رہائش / اقامت:</span>
                  <span className="font-medium text-slate-800 truncate block">{receipt.iqamat}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold">جمع کرانے کی تاریخ:</span>
                  <span className="font-medium text-slate-700 font-mono">{new Date(receipt.date_time).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Clothes Items to Hand Over */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-emerald-600" />
                <span>واپسی کے لیے کپڑوں کی تفصیل (Clothes Items Breakdown):</span>
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-3">شے کا نام (Item)</th>
                      <th className="p-3 text-center">تعداد (Quantity)</th>
                      {receipt.type === 'Private' && (
                        <>
                          <th className="p-3 text-left">ریٹ</th>
                          <th className="p-3 text-left">رقم</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900 font-nastaliq text-base leading-snug">
                          {item.item_name_ur} <span className="text-[11px] text-slate-400 font-normal">({item.item_name_en})</span>
                        </td>
                        <td className="p-3 text-center font-bold text-base font-mono text-slate-900">{item.quantity} عدد</td>
                        {receipt.type === 'Private' && (
                          <>
                            <td className="p-3 text-left font-mono">Rs {item.rate_at_time}</td>
                            <td className="p-3 text-left font-bold font-mono text-slate-900">Rs {item.amount}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t">
                    <tr>
                      <td className="p-3 font-nastaliq">کل کپڑے (Total Pieces)</td>
                      <td className="p-3 text-center text-base font-black text-emerald-800 font-mono">{receipt.total_pieces} عدد</td>
                      {receipt.type === 'Private' && (
                        <>
                          <td className="p-3 text-left">کل بل</td>
                          <td className="p-3 text-left text-base font-black text-amber-700 font-mono">Rs {receipt.total_amount}</td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Unpaid Warning Alert (DLV-02) */}
            {unpaidAlert && (
              <div className="bg-red-50 border-2 border-red-300 p-5 rounded-2xl text-red-950 flex flex-col sm:flex-row items-start gap-4">
                <AlertTriangle className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs space-y-2">
                  <div className="font-bold text-sm text-red-800 font-nastaliq">
                    تنبہیہ: پرائیویٹ بل غیر ادا شدہ ہے (Payment Required Before Delivery)
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    اس رسید کا بل <span className="font-bold font-mono text-red-700 text-sm">Rs {receipt.total_amount}</span> ابھی تک وصول نہیں کیا گیا ہے۔ کپڑے واپس کرنے سے پہلے کاؤنٹر پر نقد رقم وصول فرمائیں۔
                  </p>
                  <div>
                    <button
                      onClick={() => markDelivered(true)}
                      disabled={delivering}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>رقم وصول کر لی (Rs {receipt.total_amount}) اور کپڑے واپس کیے</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Action Form */}
            {receipt.status !== 'Delivered' ? (
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <input
                  type="text"
                  value={deliveryRemarks}
                  onChange={e => setDeliveryRemarks(e.target.value)}
                  placeholder="کوئی تبصرہ یا نوٹ (Optional remarks)..."
                  className="text-xs p-3 rounded-2xl border border-slate-300 flex-1 min-w-[260px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <button
                  onClick={() => markDelivered(false)}
                  disabled={delivering}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold px-7 py-3 rounded-2xl text-sm shadow-lg flex items-center gap-2 transition"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>{delivering ? 'محفوظ ہو رہا ہے...' : 'کپڑے حوالے کر دیے (Mark as Delivered)'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold font-nastaliq text-sm">یہ رسید پہلے ہی حوالے کی جا چکی ہے (Delivered)</div>
                  <div className="text-slate-600 font-mono mt-0.5">تاریخ: {new Date(receipt.delivered_on || '').toLocaleString()} بذریعہ {receipt.delivered_by || 'عملہ'}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
