'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Shirt,
  DollarSign,
  AlertCircle,
  FileText,
  Sparkles,
  Search,
  Building,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const { settings } = useApp();
  const [selectedReport, setSelectedReport] = useState('daily');
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('All');
  const [studentId, setStudentId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        report: selectedReport,
        from_date: fromDate,
        to_date: toDate,
        category,
      });
      if (studentId.trim()) params.set('student_id', studentId.trim());

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport, fromDate, toDate, category]);

  // Quick range helper
  const setQuickRange = (type: 'today' | 'week' | 'month') => {
    const today = new Date();
    if (type === 'today') {
      const d = format(today, 'yyyy-MM-dd');
      setFromDate(d);
      setToDate(d);
    } else if (type === 'week') {
      setFromDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setToDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (type === 'month') {
      setFromDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) return;
    let exportRows: any[] = [];

    if (selectedReport === 'daily' || selectedReport === 'student_history' || selectedReport === 'bag_sheet') {
      exportRows = (reportData.receipts || []).map((r: any) => ({
        'رسید نمبر': r.receipt_no,
        'قسم': r.type,
        'طالب علم': r.student_name,
        'رجسٹریشن': r.student_reg_no,
        'کلاس': r.class_name,
        'اقامت': r.iqamat,
        'کل کپڑے': r.total_pieces,
        'بل (روپے)': r.total_amount,
        'ادائیگی': r.payment_status,
        'حالت': r.status,
        'تاریخ': new Date(r.date_time).toLocaleDateString(),
        'آپریٹر': r.operator_name,
      }));
    } else if (selectedReport === 'weekly' || selectedReport === 'date_range') {
      exportRows = (reportData.days || []).map((d: any) => ({
        'تاریخ': d.date,
        'سرکاری رسیدات': d.sarkariReceipts,
        'سرکاری کپڑے': d.sarkariPieces,
        'پرائیویٹ رسیدات': d.privateReceipts,
        'پرائیویٹ کپڑے': d.privatePieces,
        'کل آمدنی (روپے)': d.revenue,
        'واجب الادا': d.unpaid,
      }));
    } else if (selectedReport === 'item_wise') {
      exportRows = (reportData.items || []).map((i: any) => ({
        'شے کا نام (Urdu)': i.name_ur,
        'Item (English)': i.name_en,
        'ریٹ': i.rate,
        'سرکاری تعداد': i.sarkariQty,
        'پرائیویٹ تعداد': i.privateQty,
        'کل تعداد': i.totalQty,
        'کل رقم': i.totalAmt,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `jamia_laundry_${selectedReport}_${fromDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner (Print-hidden) */}
      <div className="bg-gradient-to-r from-jamia-950 via-jamia-900 to-jamia-850 rounded-3xl p-6 sm:p-8 text-white shadow-jamia relative overflow-hidden border border-emerald-900/40 print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-jamia-800 border border-gold-400/30 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>جامعہ لانڈری ڈیٹا اور گوشوارے</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white urdu-naskh">
                جامعہ لانڈری تفصیلی رپورٹس و آڈٹ (Reports & Analytics)
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1">
                روزانہ کلیکشن، ہفتہ وار خلاصہ، طلبہ ہسٹری، اشیاء وار لوڈ اور مالیاتی گوشوارے (R1-R13)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportToExcel}
              className="bg-jamia-800 hover:bg-jamia-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 border border-emerald-700/60 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-gold-400" />
              <span>ایکسل شیٹ (Excel)</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>رپورٹ پرنٹ کریں (A4 Print)</span>
            </button>
          </div>
        </div>

        {/* Report Selector Tabs Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-800/50 flex overflow-x-auto gap-2 scrollbar-none pb-1">
          {[
            { id: 'daily', label: 'R1: روزانہ کلیکشن' },
            { id: 'weekly', label: 'R2: ہفتہ وار خلاصہ' },
            { id: 'student_history', label: 'R3: طالب علم ہسٹری' },
            { id: 'item_wise', label: 'R4: اشیاء وار لوڈ' },
            { id: 'sarkari_days', label: 'R5: منگل / جمعہ شیٹ' },
            { id: 'unpaid', label: 'R7: بقایا جات (Unpaid)' },
            { id: 'pending_delivery', label: 'R8: غیر واپس شدہ کپڑے' },
            { id: 'audit_logs', label: 'آڈٹ لاگ (Audit Trail)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedReport === tab.id
                  ? 'bg-gold-500 text-slate-950 shadow-md font-black scale-105'
                  : 'bg-black/20 text-emerald-100 hover:bg-black/40 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls Bar (Print-hidden) */}
      <div className="bg-white p-4 rounded-2xl shadow-subtle border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-jamia-700" />
            <span>تاریخ منتخب کریں:</span>
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="p-1.5 px-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-jamia-600 focus:outline-none"
          />
          <span className="text-slate-400 font-bold">تا</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="p-1.5 px-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-jamia-600 focus:outline-none"
          />

          <div className="flex gap-1">
            <button
              onClick={() => setQuickRange('today')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
            >
              آج (Today)
            </button>
            <button
              onClick={() => setQuickRange('week')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
            >
              اس ہفتے
            </button>
            <button
              onClick={() => setQuickRange('month')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
            >
              اس مہینے
            </button>
          </div>
        </div>

        {selectedReport === 'student_history' && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">طالب علم کا رجسٹریشن نمبر:</span>
            <input
              type="text"
              placeholder="مثلاً: J-1024"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchReport()}
              className="p-1.5 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white w-32 font-mono font-bold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
            />
            <button
              onClick={fetchReport}
              className="bg-jamia-900 text-gold-300 font-bold px-3 py-1.5 rounded-xl hover:bg-jamia-800 transition"
            >
              تلاش کریں
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Output Container */}
      <div className="a4-report-printable bg-white p-6 sm:p-8 rounded-3xl shadow-subtle border border-slate-200/80">
        
        {/* Printable Formal Institutional Header */}
        <div className="text-center pb-5 border-b-2 border-jamia-900 mb-6">
          <div className="text-xs font-bold text-gold-700 mb-0.5">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <h2 className="text-2xl font-bold urdu-naskh text-jamia-950 leading-tight">
            {settings.jamia_name}
          </h2>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-0.5">
            {settings.jamia_name_en} — {settings.laundry_name}
          </h3>
          <div className="inline-flex items-center gap-3 text-xs text-slate-600 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            <span>رپورٹ کی قسم: <strong className="text-jamia-900 uppercase">{selectedReport}</strong></span>
            <span>•</span>
            <span>تاریخ: <strong className="font-mono">{fromDate}</strong> {fromDate !== toDate ? `تا ${toDate}` : ''}</span>
            <span>•</span>
            <span>پرنٹ وقت: <span className="font-mono">{new Date().toLocaleString()}</span></span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-16 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-jamia-800 border-t-transparent mb-2"></div>
            <p className="text-xs font-semibold">رپورٹ کا مکمل ڈیٹا مرتب کیا جا رہا ہے...</p>
          </div>
        )}

        {/* R1: Daily Collection Report */}
        {!loading && selectedReport === 'daily' && reportData?.summary && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">کل رسیدات (Total Receipts)</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{reportData.summary.totalReceipts}</div>
                <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60 flex justify-between">
                  <span>سرکاری: <strong>{reportData.summary.sarkariCount}</strong></span>
                  <span>پرائیویٹ: <strong>{reportData.summary.privateCount}</strong></span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                <div className="text-[11px] font-semibold text-emerald-800">کل کپڑے (Total Pieces)</div>
                <div className="text-2xl font-black text-emerald-950 mt-1 font-mono">{reportData.summary.totalPieces}</div>
                <div className="text-[11px] text-emerald-800 mt-2 pt-2 border-t border-emerald-200/60 flex justify-between">
                  <span>سرکاری: <strong>{reportData.summary.sarkariPieces}</strong></span>
                  <span>پرائیویٹ: <strong>{reportData.summary.privatePieces}</strong></span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 rounded-2xl border border-amber-200 shadow-sm">
                <div className="text-[11px] font-semibold text-amber-900">پرائیویٹ نقد وصولی (Cash)</div>
                <div className="text-2xl font-black text-amber-950 mt-1 font-mono">Rs {reportData.summary.privateCashCollected}</div>
                <div className="text-[11px] text-amber-800 mt-2 pt-2 border-t border-amber-200/60">
                  <span>کاؤنٹر کیش وصول شدہ</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 p-4 rounded-2xl border border-rose-200 shadow-sm">
                <div className="text-[11px] font-semibold text-rose-900">غیر ادا شدہ رقم (Unpaid)</div>
                <div className="text-2xl font-black text-rose-950 mt-1 font-mono">Rs {reportData.summary.privateUnpaidTotal}</div>
                <div className="text-[11px] text-rose-800 mt-2 pt-2 border-t border-rose-200/60">
                  <span>واپسی ڈیلیوری پر وصول ہوگی</span>
                </div>
              </div>
            </div>

            {/* Item Breakdown Summary Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-jamia-700" />
                <span>اشیاء وار تفصیلی تقسیم (Item-wise Summary for Selected Date):</span>
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">شے کا نام</th>
                      <th className="p-3">English Item</th>
                      <th className="p-3 text-center">سرکاری تعداد (مفت)</th>
                      <th className="p-3 text-center">پرائیویٹ تعداد</th>
                      <th className="p-3 text-center font-black">میزان (Grand Total)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.itemTotals?.itemsList?.map((item: any) => {
                      const sQty = reportData.itemTotals.sarkari[item.id] || 0;
                      const pQty = reportData.itemTotals.private[item.id] || 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold urdu-compact text-slate-900">{item.name_ur}</td>
                          <td className="p-3 text-slate-600">{item.name_en}</td>
                          <td className="p-3 text-center font-bold text-jamia-800 font-mono">{sQty}</td>
                          <td className="p-3 text-center font-bold text-amber-800 font-mono">{pQty}</td>
                          <td className="p-3 text-center font-black text-slate-950 font-mono">{sQty + pQty} عدد</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* R2: Weekly / Date-range Summary */}
        {!loading && (selectedReport === 'weekly' || selectedReport === 'date_range') && reportData?.days && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">تاریخ (Date)</th>
                    <th className="p-3 text-center">سرکاری رسیدات</th>
                    <th className="p-3 text-center">سرکاری کپڑے</th>
                    <th className="p-3 text-center">پرائیویٹ رسیدات</th>
                    <th className="p-3 text-center">پرائیویٹ کپڑے</th>
                    <th className="p-3 text-left">آمدنی (روپے)</th>
                    <th className="p-3 text-left">غیر ادا شدہ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.days.map((d: any) => (
                    <tr key={d.date} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900 font-mono">{d.date}</td>
                      <td className="p-3 text-center text-blue-700 font-mono">{d.sarkariReceipts}</td>
                      <td className="p-3 text-center font-semibold text-blue-900 font-mono">{d.sarkariPieces}</td>
                      <td className="p-3 text-center text-amber-700 font-mono">{d.privateReceipts}</td>
                      <td className="p-3 text-center font-semibold text-amber-900 font-mono">{d.privatePieces}</td>
                      <td className="p-3 text-left font-bold text-emerald-700 font-mono">Rs {d.revenue}</td>
                      <td className="p-3 text-left text-red-600 font-mono">Rs {d.unpaid}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td className="p-3">کل میزان (Grand Total)</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center text-blue-900 font-mono">{reportData.totals?.sarkariPieces}</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center text-amber-900 font-mono">{reportData.totals?.privatePieces}</td>
                    <td className="p-3 text-left text-emerald-800 font-mono">Rs {reportData.totals?.totalRevenue}</td>
                    <td className="p-3 text-left text-red-700 font-mono">Rs {reportData.totals?.totalUnpaid}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* R3: Student History */}
        {!loading && selectedReport === 'student_history' && (
          <div className="space-y-4">
            {reportData?.student && (
              <div className="bg-gradient-to-r from-emerald-50 to-slate-50 p-5 rounded-2xl border border-emerald-200/80 flex justify-between items-center text-xs">
                <div>
                  <div className="text-base font-bold text-jamia-950 urdu-naskh">{reportData.student.name}</div>
                  <div className="text-slate-600 mt-1">ولدیت: {reportData.student.father_name} | کلاس: {reportData.student.class_name} ({reportData.student.section})</div>
                  <div className="text-slate-600">اقامت / ہاسٹل: {reportData.student.iqamat}</div>
                </div>
                <div className="text-left">
                  <div className="font-mono text-base font-black text-jamia-950">Reg: {reportData.student.reg_no}</div>
                  <div className="text-emerald-800 font-bold mt-1">کل رسیدات: {reportData.totalReceipts}</div>
                  <div className="text-slate-700 font-semibold">کل کپڑے: {reportData.totalPieces} عدد</div>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رسید نمبر</th>
                    <th className="p-3">قسم</th>
                    <th className="p-3">تاریخ</th>
                    <th className="p-3 text-center">کپڑے</th>
                    <th className="p-3 text-left">بل رقم</th>
                    <th className="p-3 text-center">ادائیگی</th>
                    <th className="p-3 text-center">حالت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData?.receipts?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold font-mono text-slate-900">{r.receipt_no}</td>
                      <td className="p-3 font-semibold">{r.type}</td>
                      <td className="p-3 text-slate-600 font-mono">{new Date(r.date_time).toLocaleDateString()}</td>
                      <td className="p-3 text-center font-bold font-mono">{r.total_pieces}</td>
                      <td className="p-3 text-left font-bold font-mono">{r.type === 'Private' ? `Rs ${r.total_amount}` : 'Rs 0'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.payment_status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* R4: Item-wise Report */}
        {!loading && selectedReport === 'item_wise' && reportData?.items && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">شے کا نام</th>
                    <th className="p-3">English Name</th>
                    <th className="p-3 text-left">ریٹ (روپے)</th>
                    <th className="p-3 text-center">سرکاری تعداد</th>
                    <th className="p-3 text-center">پرائیویٹ تعداد</th>
                    <th className="p-3 text-center font-bold">کل تعداد</th>
                    <th className="p-3 text-left font-bold">کل بل رقم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.items.map((i: any) => (
                    <tr key={i.item_id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900 urdu-compact text-sm">{i.name_ur}</td>
                      <td className="p-3 text-slate-600">{i.name_en}</td>
                      <td className="p-3 text-left font-mono">Rs {i.rate}</td>
                      <td className="p-3 text-center font-semibold text-blue-700 font-mono">{i.sarkariQty}</td>
                      <td className="p-3 text-center font-semibold text-amber-700 font-mono">{i.privateQty}</td>
                      <td className="p-3 text-center font-black text-slate-900 font-mono">{i.totalQty}</td>
                      <td className="p-3 text-left font-bold text-emerald-700 font-mono">Rs {i.totalAmt}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={5} className="p-3">کل میزان (Total Pieces & Revenue)</td>
                    <td className="p-3 text-center font-mono text-sm">{reportData.grandTotalPieces} عدد</td>
                    <td className="p-3 text-left font-mono text-sm text-emerald-800">Rs {reportData.grandTotalRevenue}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* R5: Sarkari Collection Day Report */}
        {!loading && selectedReport === 'sarkari_days' && reportData?.classBreakdown && (
          <div className="space-y-6">
            <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-blue-950 text-sm urdu-compact">سرکاری کلیکشن کا جامع خلاصہ (منگل / جمعہ)</div>
                <div className="text-blue-700 mt-0.5">دھلائی کے کام کی منصوبہ بندی اور واشنگ لوڈ شیٹ</div>
              </div>
              <div className="text-left font-bold">
                <div className="text-blue-950 text-base font-mono">{reportData.totalSarkariReceipts} رسیدات</div>
                <div className="text-blue-800 font-mono">{reportData.totalSarkariPieces} کل کپڑے</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2.5">درجہ وار تقسیم (Class-wise Load):</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">درجہ / کلاس</th>
                        <th className="p-2.5 text-center">طلبہ کی تعداد</th>
                        <th className="p-2.5 text-center">کل کپڑے</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.classBreakdown.map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-900">{c.className}</td>
                          <td className="p-2.5 text-center font-mono">{c.studentCount}</td>
                          <td className="p-2.5 text-center font-bold text-jamia-900 font-mono">{c.pieces}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2.5">اقامت وار تقسیم (Hostel-wise Load):</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">اقامت / ہاسٹل</th>
                        <th className="p-2.5 text-center">طلبہ کی تعداد</th>
                        <th className="p-2.5 text-center">کل کپڑے</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.hostelBreakdown.map((h: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold truncate max-w-[160px] text-slate-900">{h.hostel}</td>
                          <td className="p-2.5 text-center font-mono">{h.studentCount}</td>
                          <td className="p-2.5 text-center font-bold text-jamia-900 font-mono">{h.pieces}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* R7: Unpaid Report */}
        {!loading && selectedReport === 'unpaid' && reportData?.receipts && (
          <div className="space-y-4">
            <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 flex justify-between items-center text-xs">
              <div className="font-bold text-rose-950">
                کل غیر ادا شدہ رسیدات: <span className="font-mono text-sm">{reportData.totalUnpaidCount}</span>
              </div>
              <div className="font-bold text-rose-950 text-base">
                کل واجب الادا رقم: <span className="font-mono">Rs {reportData.totalUnpaidAmount}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رسید نمبر</th>
                    <th className="p-3">طالب علم کا نام</th>
                    <th className="p-3">رجسٹریشن</th>
                    <th className="p-3">کلاس / رہائش</th>
                    <th className="p-3 text-center">کپڑے</th>
                    <th className="p-3 text-left">واجب الادا رقم</th>
                    <th className="p-3">جمع تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.receipts.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold font-mono text-slate-900">{r.receipt_no}</td>
                      <td className="p-3 font-bold urdu-compact">{r.student_name}</td>
                      <td className="p-3 font-mono">{r.student_reg_no}</td>
                      <td className="p-3">{r.class_name} ({r.iqamat})</td>
                      <td className="p-3 text-center font-bold font-mono">{r.total_pieces}</td>
                      <td className="p-3 text-left font-black text-rose-700 font-mono">Rs {r.total_amount}</td>
                      <td className="p-3 text-slate-500 font-mono">{new Date(r.date_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* R8: Pending Delivery Aging Report */}
        {!loading && selectedReport === 'pending_delivery' && reportData?.receipts && (
          <div className="space-y-4">
            <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 flex justify-between items-center text-xs">
              <div className="font-bold text-amber-950">
                غیر واپس شدہ کپڑے: <span className="font-mono text-sm">{reportData.totalPending}</span> رسیدات
              </div>
              <div className="font-bold text-rose-700">
                3 دن سے زائد التواء: <span className="font-mono text-sm">{reportData.overdueCount}</span> رسیدات
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رسید نمبر</th>
                    <th className="p-3">قسم</th>
                    <th className="p-3">طالب علم</th>
                    <th className="p-3 text-center">کپڑے</th>
                    <th className="p-3 text-center">التواء (عمر / دن)</th>
                    <th className="p-3 text-center">موجودہ حالت</th>
                    <th className="p-3">جمع تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.receipts.map((r: any) => (
                    <tr key={r.id} className={r.is_overdue ? 'bg-rose-50/70 font-semibold text-rose-950' : 'hover:bg-slate-50 transition'}>
                      <td className="p-3 font-bold font-mono">{r.receipt_no}</td>
                      <td className="p-3 font-semibold">{r.type}</td>
                      <td className="p-3 urdu-compact">{r.student_name} ({r.student_reg_no})</td>
                      <td className="p-3 text-center font-bold font-mono">{r.total_pieces}</td>
                      <td className="p-3 text-center font-black">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          r.is_overdue ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {r.age_days} دن
                        </span>
                      </td>
                      <td className="p-3 text-center">{r.status}</td>
                      <td className="p-3 text-slate-500 font-mono">{new Date(r.date_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Log Report */}
        {!loading && selectedReport === 'audit_logs' && reportData?.logs && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">وقت و تاریخ</th>
                    <th className="p-3">صارف (User)</th>
                    <th className="p-3 text-center">ایکشن</th>
                    <th className="p-3">ریکارڈ حوالہ</th>
                    <th className="p-3">تفصیل / سبب (Reason)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {reportData.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-slate-500">{new Date(log.date_time).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-800">{log.user_name}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{log.table_name} ({log.record_id})</td>
                      <td className="p-3 font-sans urdu-compact text-slate-800">{log.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
