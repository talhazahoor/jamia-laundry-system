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
  Sparkles,
  Users,
  ChevronRight,
  TrendingUp,
  Layers,
  Clock,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Hero Welcome Banner */}
      <div className="relative bg-gradient-to-r from-jamia-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-jamia-lg border border-emerald-500/20 overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>جامعہ دارالعلوم • مرکزی شعبہ لانڈری سسٹم</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-nastaliq text-emerald-100 leading-relaxed">
              السلام علیکم و رحمۃ اللہ، {user?.full_name || 'معزز آپریٹر'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              طلبہ کے کپڑوں کی وصولی، خودکار ریٹ لسٹ بلنگ، تھرمل پرنٹنگ اور لوڈ شیٹس مینجمنٹ
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              href="/counter"
              prefetch={true}
              className="flex-1 md:flex-none bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 transition transform hover:-translate-y-0.5"
            >
              <Shirt className="w-4 h-4" />
              <span>کپڑے وصول کریں (F1)</span>
            </Link>

            <Link
              href="/deliveries"
              prefetch={true}
              className="flex-1 md:flex-none bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold px-5 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 shadow-md transition"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>واپسی کپڑے (F2)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Collection Day Notification Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isTodaySarkariDay
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/40 border-emerald-300 text-emerald-950'
          : 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/40 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 ${
            isTodaySarkariDay ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base font-nastaliq leading-tight">
              {isTodaySarkariDay ? 'آج سرکاری کلیکشن کا مقررہ دن ہے (منگل / جمعہ)' : 'آج سرکاری کلیکشن کا دن نہیں ہے (Normal Private Day)'}
            </div>
            <div className="text-xs text-slate-600 mt-0.5 font-normal">
              {isTodaySarkariDay
                ? 'سالانہ رجسٹرڈ طلبہ مفت کپڑے جمع کرا سکتے ہیں۔ پرائیویٹ بلنگ والے کپڑے بھی معمول کے مطابق وصول کیے جائیں گے۔'
                : 'آج صرف پرائیویٹ (بل والے) کپڑے وصول کیے جائیں گے، یا ایڈمن کی خصوصی رعایت سے اندراج ہوگا۔'}
            </div>
          </div>
        </div>
        <Link
          href="/counter"
          prefetch={true}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition self-end sm:self-auto shadow-sm ${
            isTodaySarkariDay
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          کاؤنٹر وصولی شروع کریں &rarr;
        </Link>
      </div>

      {/* Today's KPI Metric Cards (DSH-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Receipts */}
        <div className="bg-white p-5 rounded-3xl shadow-jamia border border-slate-200/80 hover:border-blue-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">آج کی کل رسیدات</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <ReceiptText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {loading ? '...' : (data?.summary?.totalReceipts || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="font-bold text-blue-700 font-nastaliq">سرکاری: {data?.summary?.sarkariCount || 0}</span>
            <span>•</span>
            <span className="font-bold text-amber-700 font-nastaliq">پرائیویٹ: {data?.summary?.privateCount || 0}</span>
          </div>
        </div>

        {/* Total Pieces */}
        <div className="bg-white p-5 rounded-3xl shadow-jamia border border-slate-200/80 hover:border-emerald-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">کل وصول شدہ کپڑے</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            {loading ? '...' : (data?.summary?.totalPieces || 0)} <span className="text-sm font-normal text-slate-500">عدد</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="font-semibold">سرکاری: {data?.summary?.sarkariPieces || 0}</span>
            <span>•</span>
            <span className="font-semibold">پرائیویٹ: {data?.summary?.privatePieces || 0}</span>
          </div>
        </div>

        {/* Private Revenue Cash */}
        <div className="bg-white p-5 rounded-3xl shadow-jamia border border-slate-200/80 hover:border-amber-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">کاؤنٹر نقد وصولی</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            Rs {loading ? '...' : (data?.summary?.privateCashCollected || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            واجب الادا بقایا: <span className="font-bold text-red-600 font-mono">Rs {data?.summary?.privateUnpaidTotal || 0}</span>
          </div>
        </div>

        {/* Deliveries Status */}
        <div className="bg-white p-5 rounded-3xl shadow-jamia border border-slate-200/80 hover:border-purple-400 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">کپڑوں کی واپسی</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {loading ? '...' : (data?.receipts?.filter((r: any) => r.status === 'Delivered').length || 0)}
          </div>
          <div className="text-xs text-purple-700 font-semibold mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>تیار برائے واپسی:</span>
            <span className="font-bold font-mono">{data?.receipts?.filter((r: any) => r.status === 'Ready').length || 0} رسیدات</span>
          </div>
        </div>

      </div>

      {/* Visual Item Volume Chart (DSH-02) */}
      <div className="bg-white p-6 rounded-3xl shadow-jamia border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-nastaliq leading-snug">
              آج کے کپڑوں کی اشیاء وار تقسیم (Item-wise Volume Share)
            </h3>
            <p className="text-xs text-slate-500">شلوار، قمیض، بنیان، عمامہ، بستر اور کمبل</p>
          </div>
          <Link
            href="/reports"
            prefetch={true}
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
          >
            <span>مکمل رپورٹ</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {data?.itemTotals?.itemsList?.map((item: any) => {
            const s = data.itemTotals.sarkari[item.id] || 0;
            const p = data.itemTotals.private[item.id] || 0;
            const total = s + p;
            return (
              <div
                key={item.id}
                className="bg-slate-50/80 hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 text-center transition group"
              >
                <div className="font-bold text-slate-800 text-base font-nastaliq truncate group-hover:text-emerald-800">
                  {item.name_ur}
                </div>
                <div className="text-[10px] text-slate-400 truncate mb-1">
                  {item.name_en}
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {total}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-center gap-1 font-mono">
                  <span className="text-blue-700 font-bold">{s}s</span>
                  <span>|</span>
                  <span className="text-amber-700 font-bold">{p}p</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Receipts List */}
      <div className="bg-white p-6 rounded-3xl shadow-jamia border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900 font-nastaliq">
            تازہ ترین کلیکشن رسیدات (Recent Receipts)
          </h3>
          <Link href="/receipts" prefetch={true} className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1">
            <span>تمام رسیدات دیکھیں</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {data?.receipts?.slice(0, 5).map((rcp: any) => (
            <div key={rcp.id} className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                  rcp.type === 'Sarkari' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {rcp.receipt_no}
                </span>
                <span className="font-bold text-slate-900 font-nastaliq text-base">
                  {rcp.student_name}
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  ({rcp.student_reg_no})
                </span>
              </div>

              <div className="flex items-center gap-5">
                <span className="font-bold text-slate-800 font-mono">{rcp.total_pieces} عدد</span>
                <span className="font-bold text-slate-900 font-mono">
                  {rcp.type === 'Private' ? `Rs ${rcp.total_amount}` : 'Rs 0'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
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
