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
        throw new Error(data.error || 'رسید نہیں ملی (Receipt not found)');
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

      setSuccess(`رسید ${receipt.receipt_no} کے کپڑے طالب علم کو حوالے کر دیے گئے! (Delivered)`);
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 urdu-compact">
              کپڑوں کی واپسی اور ترسیل (Clothes Return & Delivery)
            </h1>
            <p className="text-xs text-slate-500">
              بارکوڈ اسکین کریں یا رسید نمبر درج کریں (Scan receipt barcode or type number)
            </p>
          </div>
        </div>

        {/* Bulk Ready button (DLV-03) */}
        <button
          onClick={handleBulkMarkReady}
          disabled={bulkProcessing}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>{bulkProcessing ? 'عمل جاری...' : 'آج کے تمام سرکاری کپڑے تیار (Mark Ready)'}</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Receipt Scan Input */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          رسید نمبر یا بارکوڈ اسکین (Scan Barcode / Enter Receipt No):
        </label>
        <div className="flex gap-2">
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
              placeholder="مثلاً: S-000101 یا P-000201 ..."
              className="w-full pl-3 pr-10 py-3 rounded-lg border-2 border-slate-300 focus:border-emerald-500 text-base font-bold text-slate-900 shadow-inner"
              autoFocus
            />
            <QrCode className="w-5 h-5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
          <button
            onClick={() => lookupReceipt()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg text-sm shadow transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'تلاش...' : 'رسید تلاش کریں'}</span>
          </button>
        </div>
      </div>

      {/* Verification & Delivery Card */}
      {receipt && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Card Top Banner */}
          <div className={`p-4 text-white flex flex-wrap items-center justify-between gap-3 ${
            receipt.status === 'Delivered'
              ? 'bg-slate-700'
              : receipt.type === 'Sarkari'
              ? 'bg-blue-700'
              : 'bg-amber-600'
          }`}>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/80">
                {receipt.type === 'Sarkari' ? 'سرکاری لانڈری رسید' : 'پرائیویٹ لانڈری رسید'}
              </div>
              <div className="text-xl font-black">{receipt.receipt_no}</div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                receipt.status === 'Delivered'
                  ? 'bg-emerald-500 text-white'
                  : receipt.status === 'Ready'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/20 text-white'
              }`}>
                حالت: {receipt.status}
              </span>

              {receipt.type === 'Private' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  receipt.payment_status === 'Paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white animate-pulse'
                }`}>
                  {receipt.payment_status === 'Paid' ? 'بل ادا شدہ' : 'بل غیر ادا شدہ (Rs ' + receipt.total_amount + ')'}
                </span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Student Identity Verification (DLV-01) */}
            <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden border border-slate-300 shrink-0 flex items-center justify-center">
                {receipt.photo_url ? (
                  <img src={receipt.photo_url} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 text-xs">
                <div>
                  <span className="text-slate-500 block">رجسٹریشن نمبر:</span>
                  <span className="font-bold text-slate-900 text-sm">{receipt.student_reg_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">طالب علم کا نام:</span>
                  <span className="font-bold text-slate-900 text-sm urdu-compact">{receipt.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ولدیت:</span>
                  <span className="font-semibold text-slate-800 urdu-compact">{receipt.father_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">کلاس و سیکشن:</span>
                  <span className="font-medium text-slate-800">{receipt.class_name} ({receipt.section})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">رہائش / اقامت:</span>
                  <span className="font-medium text-slate-800 truncate block">{receipt.iqamat}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">جمع کرانے کی تاریخ:</span>
                  <span className="font-medium text-slate-700">{new Date(receipt.date_time).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Clothes Items Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                کپڑوں کی تفصیل (Clothes Items to Return):
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-2">شے کا نام (Item)</th>
                      <th className="p-2 text-center">تعداد (Qty)</th>
                      {receipt.type === 'Private' && (
                        <>
                          <th className="p-2 text-left">ریٹ</th>
                          <th className="p-2 text-left">رقم</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900 urdu-compact">
                          {item.item_name_ur} <span className="text-[10px] text-slate-500 font-normal">({item.item_name_en})</span>
                        </td>
                        <td className="p-2 text-center font-bold text-sm">{item.quantity} عدد</td>
                        {receipt.type === 'Private' && (
                          <>
                            <td className="p-2 text-left">Rs {item.rate_at_time}</td>
                            <td className="p-2 text-left font-semibold">Rs {item.amount}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t">
                    <tr>
                      <td className="p-2">کل کپڑے (Total Pieces)</td>
                      <td className="p-2 text-center text-sm text-emerald-700">{receipt.total_pieces} عدد</td>
                      {receipt.type === 'Private' && (
                        <>
                          <td className="p-2 text-left">کل بل</td>
                          <td className="p-2 text-left text-sm text-amber-700">Rs {receipt.total_amount}</td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Unpaid Warning Alert (DLV-02) */}
            {unpaidAlert && (
              <div className="bg-red-50 border-2 border-red-400 p-4 rounded-xl text-red-900 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-sm text-red-700 mb-1">
                    تنبہیہ: پرائیویٹ بل غیر ادا شدہ ہے (Payment Required Before Delivery)
                  </div>
                  <p>
                    اس رسید کا بل <span className="font-bold underline">Rs {receipt.total_amount}</span> ابھی باقی ہے۔ کپڑے دینے سے پہلے کاؤنٹر پر رقم وصول فرمائیں۔
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => markDelivered(true)}
                      disabled={delivering}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow flex items-center gap-1.5"
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
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                <input
                  type="text"
                  value={deliveryRemarks}
                  onChange={e => setDeliveryRemarks(e.target.value)}
                  placeholder="کوئی تبصرہ یا نوٹ (Optional remarks)..."
                  className="text-xs p-2.5 rounded-lg border border-slate-300 flex-1 min-w-[240px]"
                />

                <button
                  onClick={() => markDelivered(false)}
                  disabled={delivering}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow flex items-center gap-2"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>{delivering ? 'محفوظ ہو رہا ہے...' : 'کپڑے حوالے کر دیے (Mark as Delivered)'}</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">یہ رسید پہلے ہی واپس کی جا چکی ہے</div>
                  <div>تاریخ ترسیل: {new Date(receipt.delivered_on || '').toLocaleString()} بذریعہ {receipt.delivered_by || 'عملہ'}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
