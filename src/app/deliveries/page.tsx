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
  ShieldAlert,
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
        throw new Error(data.error || 'رسید کا ریکارڈ نہیں ملا');
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

      setSuccess(`رسید #${receipt.receipt_no} کے کپڑے طالب علم کو حوالے کر دیے گئے`);
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
    if (!confirm('کیا آپ آج کی تمام سرکاری رسیدات کو "تیار" (Ready) نشان زد کرنا چاہتے ہیں؟')) {
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
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">کپڑوں کی واپسی و ترسیل (Deliveries & Returns)</h1>
          <p className="text-[11px] text-slate-500">
            بارکوڈ اسکین کریں یا رسید نمبر درج کر کے کپڑے حوالے کریں
          </p>
        </div>

        <button
          onClick={handleBulkMarkReady}
          disabled={bulkProcessing}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition"
        >
          {bulkProcessing ? 'اپ ڈیٹ ہو رہا ہے...' : 'تمام سرکاری کپڑے تیار نشان زد کریں'}
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-white hover:opacity-75">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scanner Input Card */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span>رسید نمبر یا بارکوڈ اسکین فرمائیں:</span>
          <span className="text-[11px] text-slate-400 font-normal">
            نمونہ: <button onClick={() => lookupReceipt('S-000101')} className="underline font-mono text-emerald-700">S-000101</button> یا <button onClick={() => lookupReceipt('P-000201')} className="underline font-mono text-emerald-700">P-000201</button>
          </span>
        </div>

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
              placeholder="رسید نمبر درج کریں..."
              className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <button
            onClick={() => lookupReceipt()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-xs transition"
          >
            {loading ? 'تلاش...' : 'تلاش کریں'}
          </button>
        </div>
      </div>

      {/* Receipt Verification Card */}
      {receipt && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          
          {/* Header of Receipt Card */}
          <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900">{receipt.receipt_no}</span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                receipt.type === 'Sarkari' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {receipt.type === 'Sarkari' ? 'سرکاری' : 'پرائیویٹ'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                receipt.status === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {receipt.status === 'Delivered' ? 'واپس شدہ (Delivered)' : receipt.status}
              </span>

              {receipt.type === 'Private' && (
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  receipt.payment_status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {receipt.payment_status === 'Paid' ? 'ادا شدہ' : 'بقایا (Unpaid)'}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            
            {/* Student details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">طالب علم:</span>
                <span className="font-bold text-slate-900">{receipt.student_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">رجسٹریشن:</span>
                <span className="font-mono font-semibold">{receipt.student_reg_no}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">کلاس و ہاسٹل:</span>
                <span>{receipt.class_name} ({receipt.iqamat})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">جمع کرانے کی تاریخ:</span>
                <span className="font-mono">{new Date(receipt.date_time).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Unpaid Alert Banner */}
            {unpaidAlert && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">توجہ فرمائیں: بل ابھی ادا نہیں ہوا!</span>
                    <span className="block text-[11px] text-rose-700">
                      واجب الادا رقم: <strong className="font-mono text-xs">Rs {receipt.total_amount}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => markDelivered(true)}
                  disabled={delivering}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
                >
                  رقم وصول کر کے حوالے کریں
                </button>
              </div>
            )}

            {/* Items Table */}
            <div>
              <div className="font-semibold text-slate-700 mb-1 text-xs">
                کپڑوں کی تفصیل ({receipt.total_pieces} عدد):
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2">شے</th>
                      <th className="p-2 text-center">تعداد</th>
                      <th className="p-2 text-left">ریٹ</th>
                      <th className="p-2 text-left">میزان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-2 font-medium">{item.item_name}</td>
                        <td className="p-2 text-center font-mono font-semibold">{item.quantity}</td>
                        <td className="p-2 text-left font-mono">
                          {receipt.type === 'Private' ? `Rs ${item.rate}` : 'مفت'}
                        </td>
                        <td className="p-2 text-left font-mono font-bold">
                          {receipt.type === 'Private' ? `Rs ${item.quantity * item.rate}` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              {receipt.status !== 'Delivered' ? (
                <button
                  onClick={() => markDelivered(false)}
                  disabled={delivering}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition text-xs shadow-sm"
                >
                  {delivering ? 'عمل جاری...' : 'کپڑے حوالے کر دیے (Mark Delivered)'}
                </button>
              ) : (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs">
                  ✓ یہ کپڑے پہلے ہی طالب علم کے حوالے کیے جا چکے ہیں
                </span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
