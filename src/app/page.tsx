'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Shirt,
  ReceiptText,
  PackageCheck,
  DollarSign,
  Clock,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { lang, t, settings, isTodaySarkariDay } = useApp();
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Delivered': return t.delivered;
      case 'Ready': return t.ready;
      case 'In Process': return t.in_process;
      case 'Received': return t.received;
      case 'Cancelled': return t.cancelled;
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/laundry-banner.png')` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${
          lang === 'en' 
            ? 'from-slate-950/95 via-slate-950/80 to-transparent' 
            : 'from-transparent via-slate-950/80 to-slate-950/95'
        }`} />

        <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isTodaySarkariDay ? t.sarkari_collection_today : t.private_only_today}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              {lang === 'en' ? 'Laundry Portal' : 'لانڈری پورٹل'}
            </h1>
            <p className="text-[11px] text-slate-200/90 leading-relaxed">
              {lang === 'en' 
                ? (settings.jamia_name_en || settings.jamia_name) + ' • Daily collection, wash records & financial summary'
                : settings.jamia_name + ' • روزانہ کلیکشن، دھلائی ریکارڈز اور مالیاتی خلاصہ'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href="/counter"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.new_receipt_btn}</span>
            </Link>

            <Link
              href="/deliveries"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-md border border-white/20 transition"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.return_clothes_btn}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">{t.today_receipts}</span>
            <ReceiptText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {loading ? '...' : data?.summary?.totalReceipts || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
            <span>{t.sarkari_count_label}: <strong className="text-slate-700 font-mono">{data?.summary?.sarkariCount || 0}</strong></span>
            <span>•</span>
            <span>{t.private_count_label}: <strong className="text-slate-700 font-mono">{data?.summary?.privateCount || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">{t.total_pieces}</span>
            <Shirt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {loading ? '...' : data?.summary?.totalPieces || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
            <span>{t.sarkari_count_label}: <strong className="text-slate-700 font-mono">{data?.summary?.sarkariPieces || 0}</strong></span>
            <span>•</span>
            <span>{t.private_count_label}: <strong className="text-slate-700 font-mono">{data?.summary?.privatePieces || 0}</strong></span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">{t.cash_collected}</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            Rs {loading ? '...' : data?.summary?.privateCashCollected || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {t.counter_cash_collected}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">{t.unpaid_balance}</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600">
            Rs {loading ? '...' : data?.summary?.privateUnpaidTotal || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {t.due_on_delivery}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Receipts + Item Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (2 Cols): Recent Receipts Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="font-semibold text-slate-800 text-xs">
              {t.recent_receipts}
            </div>
            <Link
              href="/receipts"
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              {t.view_all} &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">{t.receipt_col}</th>
                  <th className="p-2.5">{t.student_col}</th>
                  <th className="p-2.5">{t.type_col}</th>
                  <th className="p-2.5 text-center">{t.pieces_col}</th>
                  <th className="p-2.5 text-left">{t.amount_col}</th>
                  <th className="p-2.5 text-center">{t.status_col}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      {lang === 'en' ? 'Loading...' : 'لوڈ ہو رہا ہے...'}
                    </td>
                  </tr>
                ) : !data?.receipts || data.receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      {t.no_receipts_today}
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
                          {r.type === 'Sarkari' ? t.sarkari : t.private}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold">
                        {r.total_pieces}
                      </td>
                      <td className="p-2.5 text-left font-mono font-bold text-slate-800">
                        {r.type === 'Private' ? `Rs ${r.total_amount}` : t.free}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-medium ${
                          r.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {getStatusLabel(r.status)}
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
            {t.item_breakdown}
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-slate-400 py-6 text-xs">
                {lang === 'en' ? 'Loading...' : 'لوڈ ہو رہا ہے...'}
              </div>
            ) : !data?.itemTotals?.itemsList || data.itemTotals.itemsList.length === 0 ? (
              <div className="text-center text-slate-400 py-6 text-xs">
                {lang === 'en' ? 'No items recorded today' : 'کوئی ڈیٹا دستیاب نہیں'}
              </div>
            ) : (
              data.itemTotals.itemsList.slice(0, 6).map((item: any) => {
                const sQty = data.itemTotals.sarkari[item.id] || 0;
                const pQty = data.itemTotals.private[item.id] || 0;
                const total = sQty + pQty;
                const max = data.summary?.totalPieces || 1;
                const pct = Math.min(100, Math.round((total / max) * 100));

                const itemName = lang === 'en' ? (item.name_en || item.name_ur) : item.name_ur;

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800">{itemName}</span>
                      <span className="font-mono text-slate-500">{total} {t.pieces}</span>
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
            <span>{t.total_categories} {data?.itemTotals?.itemsList?.length || 0}</span>
            <Link href="/items" className="text-emerald-700 hover:underline">
              {t.view_rates_link} &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
