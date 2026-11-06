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
  Eye,
  CheckCircle2,
  Clock,
  ShieldAlert,
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 urdu-compact">
              تمام جاری شدہ رسیدات (All Receipts)
            </h1>
            <p className="text-xs text-slate-500">
              دوبارہ پرنٹ (Duplicate) اور ایڈمن منسوخی کنٹرول
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="رسید نمبر یا طالب علم..."
            className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-3 text-xs items-center">
        <span className="font-bold text-slate-600 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>فلٹرز:</span>
        </span>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1 text-slate-700 bg-white"
        >
          <option value="All">تمام اقسام (Sarkari & Private)</option>
          <option value="Sarkari">صرف سرکاری (Sarkari)</option>
          <option value="Private">صرف پرائیویٹ (Private)</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1 text-slate-700 bg-white"
        >
          <option value="All">تمام حالتیں (All Statuses)</option>
          <option value="Received">موصول شدہ (Received)</option>
          <option value="In Process">زیر دھلائی (In Process)</option>
          <option value="Ready">تیار برائے واپسی (Ready)</option>
          <option value="Delivered">واپس شدہ (Delivered)</option>
          <option value="Cancelled">منسوخ شدہ (Cancelled)</option>
        </select>

        <select
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1 text-slate-700 bg-white"
        >
          <option value="All">ادائیگی: سب</option>
          <option value="Paid">ادا شدہ (Paid)</option>
          <option value="Unpaid">واجب الادا (Unpaid)</option>
        </select>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b">
              <tr>
                <th className="p-3">رسید نمبر</th>
                <th className="p-3">قسم</th>
                <th className="p-3">طالب علم</th>
                <th className="p-3">کلاس / رہائش</th>
                <th className="p-3 text-center">کپڑے</th>
                <th className="p-3 text-left">بل (روپے)</th>
                <th className="p-3 text-center">ادائیگی</th>
                <th className="p-3 text-center">حالت</th>
                <th className="p-3">تاریخ و وقت</th>
                <th className="p-3">آپریٹر</th>
                <th className="p-3 text-center">ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-500">لوڈ ہو رہا ہے...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-slate-500">کوئی رسید موجود نہیں ہے</td>
                </tr>
              ) : (
                filtered.map(rcp => (
                  <tr key={rcp.id} className={`hover:bg-slate-50/80 ${rcp.status === 'Cancelled' ? 'bg-red-50/40 text-slate-400' : ''}`}>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{rcp.receipt_no}</span>
                      {rcp.reprint_count > 0 && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded font-semibold">
                          #{rcp.reprint_count}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        rcp.type === 'Sarkari' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rcp.type === 'Sarkari' ? 'سرکاری' : 'پرائیویٹ'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900 urdu-compact">
                      <div>{rcp.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Reg: {rcp.student_reg_no}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{rcp.class_name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{rcp.iqamat}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800 text-sm">
                      {rcp.total_pieces} عدد
                    </td>
                    <td className="p-3 text-left font-bold text-slate-900 text-sm">
                      {rcp.type === 'Private' ? `Rs ${rcp.total_amount}` : 'Rs 0'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rcp.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rcp.payment_status === 'Paid' ? 'ادا شدہ' : 'واجب الادا'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rcp.status === 'Delivered'
                          ? 'bg-emerald-600 text-white'
                          : rcp.status === 'Ready'
                          ? 'bg-blue-600 text-white'
                          : rcp.status === 'Cancelled'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {rcp.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      <div>{new Date(rcp.date_time).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(rcp.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="p-3 text-slate-600 text-[11px] truncate max-w-[100px]">
                      {rcp.operator_name}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReceipt(rcp);
                            setIsDuplicatePrint(false);
                          }}
                          className="p-1 rounded text-slate-600 hover:text-emerald-600 hover:bg-slate-100"
                          title="رسید دیکھیں"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleReprint(rcp)}
                          className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                          title="دوبارہ پرنٹ نکالیں (Duplicate)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {user?.role === 'Administrator' && rcp.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancellingReceipt(rcp)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="رسید منسوخ کریں (Cancel)"
                          >
                            <Ban className="w-4 h-4" />
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

      {/* Admin Cancel Receipt Modal (EDT-02) */}
      {cancellingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                رسید منسوخ کریں ({cancellingReceipt.receipt_no})
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              رسید مستقل طور پر ڈیلیٹ نہیں ہوگی بلکہ "منسوخ شدہ" (Cancelled) کے طور پر رپورٹ میں رہے گی، اور تمام آڈٹ ریکارڈ محفوظ کیا جائے گا۔ منسوخی کی وجہ درج کرنا لازمی ہے:
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="منسوخی کی وجہ درج کریں (مثلاً: غلط اندراج، طالب علم نے کپڑے واپس لے لیے)..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setCancellingReceipt(null);
                  setCancelReason('');
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
              >
                بند کریں (Cancel)
              </button>
              <button
                type="button"
                disabled={cancelLoading || !cancelReason.trim()}
                onClick={handleCancelReceipt}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold"
              >
                {cancelLoading ? 'منسوخ ہو رہی ہے...' : 'منسوخ کریں (Confirm Cancel)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview */}
      {selectedReceipt && (
        <ThermalReceiptModal
          receipt={selectedReceipt}
          settings={settings}
          isDuplicate={isDuplicatePrint}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
