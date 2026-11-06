'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Shirt,
  ReceiptText,
  PackageCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Sparkles,
  CalendarCheck2,
  DollarSign,
  AlertCircle,
  Users,
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-600/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>جامعہ لانڈری مینجمنٹ سسٹم آن لائن</span>
          </div>
          <h1 className="text-2xl font-black urdu-compact">
            السلام علیکم، {user?.full_name || 'معزز صارف'}
          </h1>
          <p className="text-slate-300 text-xs max-w-xl mt-1">
            {settings.jamia_name} • {settings.laundry_name} کاؤنٹر مینجمنٹ، تھرمل پرنٹنگ اور لائیو رپورٹنگ
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/counter"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Shirt className="w-4 h-4" />
            <span>کپڑے وصول کریں (F1)</span>
          </Link>
          <Link
            href="/deliveries"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition"
          >
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>واپسی کپڑے (F2)</span>
          </Link>
        </div>
      </div>

      {/* Collection Day Notification Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        isTodaySarkariDay
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            isTodaySarkariDay ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">
              {isTodaySarkariDay ? 'آج سرکاری کلیکشن کا مقررہ دن ہے (Tuesday & Friday Schedule)' : 'آج سرکاری کلیکشن کا دن نہیں ہے (Normal Private Day)'}
            </div>
            <div className="text-xs opacity-80">
              {isTodaySarkariDay
                ? 'سالانہ رجسٹرڈ طلبہ مفت کپڑے جمع کرا سکتے ہیں۔ پرائیویٹ کپڑے بھی جمع کیے جا سکتے ہیں۔'
                : 'آج صرف پرائیویٹ (بل والے) کپڑے وصول کیے جائیں گے، تاوقتیکہ ایڈمن خصوصی اجازت دے۔'}
            </div>
          </div>
        </div>
        <Link
          href="/counter"
          className={`text-xs font-bold underline px-3 py-1.5 rounded ${
            isTodaySarkariDay ? 'text-emerald-800 hover:bg-emerald-100' : 'text-amber-800 hover:bg-amber-100'
          }`}
        >
          کاؤنٹر پر جائیں &rarr;
        </Link>
      </div>

      {/* Today's KPI Metric Cards (DSH-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receipts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">آج کی کل رسیدات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {loading ? '...' : (data?.summary?.totalReceipts || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <span className="font-bold text-blue-700">سرکاری: {data?.summary?.sarkariCount || 0}</span>
            <span>•</span>
            <span className="font-bold text-amber-700">پرائیویٹ: {data?.summary?.privateCount || 0}</span>
          </div>
        </div>

        {/* Total Pieces */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">کل وصول شدہ کپڑے</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {loading ? '...' : (data?.summary?.totalPieces || 0)} <span className="text-sm font-normal text-slate-500">عدد</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <span>سرکاری: {data?.summary?.sarkariPieces || 0}</span>
            <span>•</span>
            <span>پرائیویٹ: {data?.summary?.privatePieces || 0}</span>
          </div>
        </div>

        {/* Private Revenue Cash */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">کاؤنٹر نقد وصولی</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">
            Rs {loading ? '...' : (data?.summary?.privateCashCollected || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            پرائیویٹ بقایا جات: <span className="font-bold text-red-600">Rs {data?.summary?.privateUnpaidTotal || 0}</span>
          </div>
        </div>

        {/* Deliveries Status */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ترسیل و واپسی</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {loading ? '...' : (data?.receipts?.filter((r: any) => r.status === 'Delivered').length || 0)}
          </div>
          <div className="text-xs text-purple-700 font-semibold mt-2">
            تیار برائے واپسی: {data?.receipts?.filter((r: any) => r.status === 'Ready').length || 0} رسیدات
          </div>
        </div>
      </div>

      {/* Visual Item Volume Chart (DSH-02) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-sm text-slate-900 urdu-compact">
              آج کے کپڑوں کی اشیاء وار تفصیل (Item-wise Volume Breakdown)
            </h3>
            <p className="text-xs text-slate-500">شلوار، قمیض، بنیان، عمامہ، بستر اور کمبل</p>
          </div>
          <Link
            href="/reports"
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            <span>تفصیلی رپورٹ دیکھیں</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {data?.itemTotals?.itemsList?.map((item: any) => {
            const s = data.itemTotals.sarkari[item.id] || 0;
            const p = data.itemTotals.private[item.id] || 0;
            const total = s + p;
            return (
              <div
                key={item.id}
                className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 text-center transition"
              >
                <div className="font-bold text-slate-800 text-sm urdu-compact truncate">
                  {item.name_ur}
                </div>
                <div className="text-[10px] text-slate-500 truncate mb-2">
                  {item.name_en}
                </div>
                <div className="text-xl font-black text-slate-900">
                  {total}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-center gap-1">
                  <span className="text-blue-700 font-bold">{s} سر</span>
                  <span>|</span>
                  <span className="text-amber-700 font-bold">{p} پر</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Receipts List */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-900 urdu-compact">
            تازہ ترین کلیکشن رسیدات (Recent Receipts)
          </h3>
          <Link href="/receipts" className="text-xs text-emerald-700 font-semibold hover:underline">
            تمام رسیدات دیکھیں &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {data?.receipts?.slice(0, 5).map((rcp: any) => (
            <div key={rcp.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/60 px-1 rounded">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  rcp.type === 'Sarkari' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {rcp.receipt_no}
                </span>
                <span className="font-bold text-slate-900 urdu-compact text-sm">
                  {rcp.student_name}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  (Reg: {rcp.student_reg_no})
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-800">{rcp.total_pieces} عدد</span>
                <span className="font-semibold text-slate-900">
                  {rcp.type === 'Private' ? `Rs ${rcp.total_amount}` : 'مفت'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  rcp.status === 'Delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : rcp.status === 'Ready'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {rcp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
