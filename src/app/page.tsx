'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Shirt,
  ReceiptText,
  PackageCheck,
  CalendarCheck2,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Clock,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, t, settings, isTodaySarkariDay } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?report=daily')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-5">
      
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">ڈیش بورڈ (Overview)</h1>
          <p className="text-[11px] text-slate-500">
            جامعہ لانڈری سسٹم • روزانہ کلیکشن، دھلائی ریکارڈ اور مالیاتی خلاصہ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/counter"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>نئی رسید (F1)</span>
          </Link>

          <Link
            href="/deliveries"
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition"
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>کپڑوں کی واپسی (F2)</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">آج کی کل رسیدات</span>
            <ReceiptText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {loading ? '...' : data?.summary?.totalReceipts || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
            <span>سرکاری: <strong className="text-slate-700 font-mono">{data?.summary?.sarkariCount || 0}</strong></span>
            <span>•</span>
            <span>پرائیویٹ: <strong className="text-slate-700 font-mono">{data?.summary?.privateCount || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">کل کپڑے (Pieces)</span>
            <Shirt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {loading ? '...' : data?.summary?.totalPieces || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
            <span>سرکاری: <strong className="text-slate-700 font-mono">{data?.summary?.sarkariPieces || 0}</strong></span>
            <span>•</span>
            <span>پرائیویٹ: <strong className="text-slate-700 font-mono">{data?.summary?.privatePieces || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">نقد وصولی (Cash)</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            Rs {loading ? '...' : data?.summary?.privateCashCollected || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            کاؤنٹر کیش وصول شدہ
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">غیر ادا شدہ (Unpaid)</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600">
            Rs {loading ? '...' : data?.summary?.privateUnpaidTotal || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            واپسی پر وصول طلب رقم
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Receipts + Item Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (2 Cols): Recent Receipts Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="font-semibold text-slate-800 text-xs">
              آج کی حالیہ رسیدات (Recent Receipts)
            </div>
            <Link
              href="/receipts"
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              تمام دیکھیں &larr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">رسید #</th>
                  <th className="p-2.5">طالب علم</th>
                  <th className="p-2.5">نوعیت</th>
                  <th className="p-2.5 text-center">کپڑے</th>
                  <th className="p-2.5 text-left">رقم</th>
                  <th className="p-2.5 text-center">حالت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      لوڈ ہو رہا ہے...
                    </td>
                  </tr>
                ) : !data?.receipts || data.receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      آج ابھی تک کوئی رسید جاری نہیں ہوئی
                    </td>
                  </tr>
                ) : (
                  data.receipts.slice(0, 8).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-2.5 font-mono font-bold text-slate-900">
                        {r.receipt_no}
                      </td>
                      <td className="p-2.5">
                        <div className="font-medium text-slate-900">{r.student_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.student_reg_no}</div>
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-semibold ${
                          r.type === 'Sarkari' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.type === 'Sarkari' ? 'سرکاری' : 'پرائیویٹ'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold">
                        {r.total_pieces}
                      </td>
                      <td className="p-2.5 text-left font-mono font-bold text-slate-800">
                        {r.type === 'Private' ? `Rs ${r.total_amount}` : 'مفت'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-medium ${
                          r.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {r.status === 'Delivered' ? 'واپس شدہ' : 'زیر دھلائی'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Today's Volume Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="font-semibold text-slate-800 text-xs pb-2 border-b border-slate-200">
            کپڑوں کی تقسیم (Item Breakdown)
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-slate-400 py-6 text-xs">لوڈ ہو رہا ہے...</div>
            ) : !data?.itemTotals?.itemsList || data.itemTotals.itemsList.length === 0 ? (
              <div className="text-center text-slate-400 py-6 text-xs">کوئی ڈیٹا دستیاب نہیں</div>
            ) : (
              data.itemTotals.itemsList.slice(0, 6).map((item: any) => {
                const sQty = data.itemTotals.sarkari[item.id] || 0;
                const pQty = data.itemTotals.private[item.id] || 0;
                const total = sQty + pQty;
                const max = data.summary?.totalPieces || 1;
                const pct = Math.min(100, Math.round((total / max) * 100));

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800">{item.name_ur}</span>
                      <span className="font-mono text-slate-500">{total} عدد</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
            <span>کل اقسام: {data?.itemTotals?.itemsList?.length || 0}</span>
            <Link href="/items" className="text-emerald-700 hover:underline">
              ریٹ لسٹ دیکھیں &larr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
