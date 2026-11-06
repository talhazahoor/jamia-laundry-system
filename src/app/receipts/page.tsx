'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Receipt } from '@/types';
import ThermalReceiptModal from '@/components/ThermalReceiptModal';
import {
  ReceiptText,
  Printer,
  Ban,
  Search,
  Filter,
} from 'lucide-react';

export default function ReceiptsPage() {
  const { user, settings } = useApp();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');

  // Cancel Modal
  const [cancellingReceipt, setCancellingReceipt] = useState<Receipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Reprint / Thermal modal
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDuplicatePrint, setIsDuplicatePrint] = useState(false);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'All') params.set('type', filterType);
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterPayment !== 'All') params.set('payment_status', filterPayment);

      const res = await fetch(`/api/receipts?${params.toString()}`);
      const data = await res.json();
      if (data.receipts) {
        setReceipts(data.receipts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [filterType, filterStatus, filterPayment]);

  const handleReprint = async (rcp: Receipt) => {
    try {
      const res = await fetch(`/api/receipts/${rcp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reprint' }),
      });
      const data = await res.json();
      if (data.success && data.receipt) {
        setSelectedReceipt(data.receipt);
        setIsDuplicatePrint(true);
        fetchReceipts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelReceipt = async () => {
    if (!cancellingReceipt || !cancelReason.trim()) return;

    setCancelLoading(true);
    try {
      const res = await fetch(
        `/api/receipts/${cancellingReceipt.id}?reason=${encodeURIComponent(cancelReason.trim())}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');

      setCancellingReceipt(null);
      setCancelReason('');
      fetchReceipts();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  const filtered = receipts.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.receipt_no.toLowerCase().includes(q) ||
      (r.student_name && r.student_name.toLowerCase().includes(q)) ||
      (r.student_reg_no && r.student_reg_no.toLowerCase().includes(q)) ||
      (r.operator_name && r.operator_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">تمام جاری شدہ رسیدات (Receipts Directory)</h1>
          <p className="text-[11px] text-slate-500">
            تمام سرکاری اور پرائیویٹ رسیدات کی تفصیل، دوبارہ پرنٹ اور منسوخی
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="رسید نمبر یا طالب علم..."
            className="w-full text-xs pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2 text-xs items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>فلٹر:</span>
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-slate-50 text-xs font-medium focus:outline-none"
          >
            <option value="All">تمام اقسام (All)</option>
            <option value="Sarkari">صرف سرکاری (Sarkari)</option>
            <option value="Private">صرف پرائیویٹ (Private)</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-slate-50 text-xs font-medium focus:outline-none"
          >
            <option value="All">تمام حالتیں (All)</option>
            <option value="Received">موصول شدہ</option>
            <option value="In Process">زیر دھلائی</option>
            <option value="Ready">تیار</option>
            <option value="Delivered">واپس شدہ</option>
            <option value="Cancelled">منسوخ شدہ</option>
          </select>

          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
            className="border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-slate-50 text-xs font-medium focus:outline-none"
          >
            <option value="All">ادائیگی: تمام</option>
            <option value="Paid">ادا شدہ</option>
            <option value="Unpaid">واجب الادا</option>
          </select>
        </div>

        <span className="text-slate-400 text-[11px] font-mono">
          کل رسیدات: {filtered.length}
        </span>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">رسید نمبر</th>
                <th className="p-2.5">قسم</th>
                <th className="p-2.5">طالب علم</th>
                <th className="p-2.5">کلاس / ہاسٹل</th>
                <th className="p-2.5 text-center">کپڑے</th>
                <th className="p-2.5 text-left">بل</th>
                <th className="p-2.5 text-center">ادائیگی</th>
                <th className="p-2.5 text-center">حالت</th>
                <th className="p-2.5">تاریخ</th>
                <th className="p-2.5 text-center">ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">لوڈ ہو رہا ہے...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">کوئی رسید نہیں ملی</td>
                </tr>
              ) : (
                filtered.map(rcp => (
                  <tr key={rcp.id} className={`hover:bg-slate-50/80 transition ${rcp.status === 'Cancelled' ? 'bg-slate-50/50 text-slate-400' : ''}`}>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      <span>{rcp.receipt_no}</span>
                      {rcp.reprint_count > 0 && (
                        <span className="mr-1 text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-mono">
                          #{rcp.reprint_count}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                        rcp.type === 'Sarkari' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {rcp.type === 'Sarkari' ? 'سرکاری' : 'پرائیویٹ'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="font-medium text-slate-900">{rcp.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rcp.student_reg_no}</div>
                    </td>
                    <td className="p-2.5 text-slate-600">
                      <div>{rcp.class_name}</div>
                      <div className="text-[10px] text-slate-400">{rcp.iqamat}</div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                      {rcp.total_pieces}
                    </td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-900">
                      {rcp.type === 'Private' ? `Rs ${rcp.total_amount}` : 'مفت'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-medium ${
                        rcp.payment_status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {rcp.payment_status === 'Paid' ? 'ادا شدہ' : 'بقایا'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-medium ${
                        rcp.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : rcp.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rcp.status === 'Delivered' ? 'واپس شدہ' : rcp.status === 'Cancelled' ? 'منسوخ' : rcp.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                      {new Date(rcp.date_time).toLocaleDateString()}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleReprint(rcp)}
                          className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition"
                          title="پرنٹ کریں"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {user?.role === 'Administrator' && rcp.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancellingReceipt(rcp)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                            title="منسوخ کریں"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancellingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="font-bold text-slate-900 text-sm">
              رسید منسوخ کریں ({cancellingReceipt.receipt_no})
            </div>
            <p className="text-slate-600">
              رسید منسوخ کرنے کی ٹھوس وجہ درج فرمائیں (آڈٹ لاگ میں محفوظ کی جائے گی):
            </p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="منسوخی کی وجہ..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancellingReceipt(null)}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
              >
                کینسل
              </button>
              <button
                disabled={!cancelReason.trim() || cancelLoading}
                onClick={handleCancelReceipt}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg font-semibold"
              >
                {cancelLoading ? 'منسوخ ہو رہا ہے...' : 'منسوخ کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal
          receipt={selectedReceipt}
          settings={settings}
          isDuplicate={isDuplicatePrint}
          onClose={() => {
            setSelectedReceipt(null);
            setIsDuplicatePrint(false);
          }}
        />
      )}

    </div>
  );
}
