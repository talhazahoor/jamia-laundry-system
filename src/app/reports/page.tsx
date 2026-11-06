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
      
      {/* Top Controls Card (Hidden during print) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 urdu-compact">
                جامعہ لانڈری تفصیلی رپورٹس (Reports & Analytics)
              </h1>
              <p className="text-xs text-slate-500">
                روزانہ، ہفتہ وار، اشیاء وار، آمدنی اور لوڈ شیٹس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>ایکسل ڈاؤن لوڈ (Excel)</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>پرنٹ کریں (A4 Print)</span>
            </button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-2 scrollbar-none text-xs">
          {[
            { id: 'daily', label: 'R1: روزانہ کلیکشن رپورٹ' },
            { id: 'weekly', label: 'R2: ہفتہ وار / تاریخ خلاصہ' },
            { id: 'student_history', label: 'R3: طالب علم ہسٹری' },
            { id: 'item_wise', label: 'R4: اشیاء وار تعداد' },
            { id: 'sarkari_days', label: 'R5: منگل / جمعہ لوڈ' },
            { id: 'revenue', label: 'R6: پرائیویٹ آمدنی' },
            { id: 'unpaid', label: 'R7: بقایا جات (Unpaid)' },
            { id: 'pending_delivery', label: 'R8: غیر واپس شدہ کپڑے' },
            { id: 'bag_sheet', label: 'R13: دھلائی بیگ شیٹ' },
            { id: 'audit_logs', label: 'آڈٹ لاگ (Audit Trail)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                selectedReport === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>مدت:</span>
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="p-1.5 border rounded-lg bg-white"
          />
          <span>تا</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="p-1.5 border rounded-lg bg-white"
          />

          <div className="flex gap-1">
            <button
              onClick={() => setQuickRange('today')}
              className="px-2 py-1 bg-white hover:bg-slate-200 border rounded text-[11px]"
            >
              آج (Today)
            </button>
            <button
              onClick={() => setQuickRange('week')}
              className="px-2 py-1 bg-white hover:bg-slate-200 border rounded text-[11px]"
            >
              اس ہفتے (Week)
            </button>
            <button
              onClick={() => setQuickRange('month')}
              className="px-2 py-1 bg-white hover:bg-slate-200 border rounded text-[11px]"
            >
              اس مہینے (Month)
            </button>
          </div>

          {selectedReport === 'student_history' && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">رجسٹریشن نمبر:</span>
              <input
                type="text"
                placeholder="مثلاً: 1234"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchReport()}
                className="p-1.5 border rounded-lg bg-white w-28 font-mono"
              />
              <button
                onClick={fetchReport}
                className="bg-emerald-600 text-white px-2 py-1.5 rounded"
              >
                تلاش
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Output Container (A4 Printable) */}
      <div className="a4-report-printable bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        
        {/* Printable Formal Header (REP-02) */}
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
          <h2 className="text-xl font-bold urdu-compact text-slate-900 leading-tight">
            {settings.jamia_name}
          </h2>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {settings.jamia_name_en} - {settings.laundry_name}
          </h3>
          <div className="text-xs text-slate-600 mt-1">
            رپورٹ: <span className="font-bold underline">{selectedReport.toUpperCase()}</span> | تاریخ: {fromDate} {fromDate !== toDate ? `تا ${toDate}` : ''} | پرنٹ تاریخ: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-12 text-center text-slate-500 text-sm">
            رپورٹ تیار کی جا رہی ہے... (Loading Report)
          </div>
        )}

        {/* R1: Daily Collection Report */}
        {!loading && selectedReport === 'daily' && reportData?.summary && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border">
                <div className="text-xs text-slate-500">کل رسیدات</div>
                <div className="text-2xl font-black text-slate-900">{reportData.summary.totalReceipts}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  سرکاری: {reportData.summary.sarkariCount} | پرائیویٹ: {reportData.summary.privateCount}
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold">کل کپڑے (Pieces)</div>
                <div className="text-2xl font-black text-emerald-900">{reportData.summary.totalPieces}</div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  سرکاری: {reportData.summary.sarkariPieces} | پرائیویٹ: {reportData.summary.privatePieces}
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div className="text-xs text-amber-800 font-semibold">پرائیویٹ نقد وصولی</div>
                <div className="text-2xl font-black text-amber-900">Rs {reportData.summary.privateCashCollected}</div>
                <div className="text-[11px] text-amber-700 mt-1">کاؤنٹر کیش</div>
              </div>

              <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                <div className="text-xs text-red-800 font-semibold">غیر ادا شدہ (Unpaid)</div>
                <div className="text-2xl font-black text-red-900">Rs {reportData.summary.privateUnpaidTotal}</div>
                <div className="text-[11px] text-red-700 mt-1">واپسی پر وصولی</div>
              </div>
            </div>

            {/* Item Breakdown Summary Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                اشیاء وار تقسیم (Item-wise Summary for the Day):
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-2.5">شے کا نام</th>
                      <th className="p-2.5">English</th>
                      <th className="p-2.5 text-center">سرکاری کپڑے</th>
                      <th className="p-2.5 text-center">پرائیویٹ کپڑے</th>
                      <th className="p-2.5 text-center font-black">میزان (Total)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.itemTotals?.itemsList?.map((item: any) => {
                      const sQty = reportData.itemTotals.sarkari[item.id] || 0;
                      const pQty = reportData.itemTotals.private[item.id] || 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold urdu-compact">{item.name_ur}</td>
                          <td className="p-2.5 text-slate-600">{item.name_en}</td>
                          <td className="p-2.5 text-center font-semibold text-blue-700">{sQty}</td>
                          <td className="p-2.5 text-center font-semibold text-amber-700">{pQty}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">{sQty + pQty} عدد</td>
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
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
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
                    <tr key={d.date} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{d.date}</td>
                      <td className="p-3 text-center text-blue-700">{d.sarkariReceipts}</td>
                      <td className="p-3 text-center font-semibold text-blue-900">{d.sarkariPieces}</td>
                      <td className="p-3 text-center text-amber-700">{d.privateReceipts}</td>
                      <td className="p-3 text-center font-semibold text-amber-900">{d.privatePieces}</td>
                      <td className="p-3 text-left font-bold text-emerald-700">Rs {d.revenue}</td>
                      <td className="p-3 text-left text-red-600">Rs {d.unpaid}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t">
                  <tr>
                    <td className="p-3">کل میزان (Grand Total)</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center text-blue-900">{reportData.totals?.sarkariPieces}</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center text-amber-900">{reportData.totals?.privatePieces}</td>
                    <td className="p-3 text-left text-emerald-800">Rs {reportData.totals?.totalRevenue}</td>
                    <td className="p-3 text-left text-red-700">Rs {reportData.totals?.totalUnpaid}</td>
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
              <div className="bg-slate-50 p-4 rounded-xl border flex justify-between items-center text-xs">
                <div>
                  <div className="text-base font-bold text-slate-900 urdu-compact">{reportData.student.name}</div>
                  <div className="text-slate-600">ولدیت: {reportData.student.father_name} | کلاس: {reportData.student.class_name} ({reportData.student.section})</div>
                  <div className="text-slate-600">اقامت: {reportData.student.iqamat}</div>
                </div>
                <div className="text-left">
                  <div className="font-mono text-base font-black">Reg: {reportData.student.reg_no}</div>
                  <div className="text-emerald-700 font-bold">کل رسیدات: {reportData.totalReceipts}</div>
                  <div className="text-slate-700 font-semibold">کل کپڑے: {reportData.totalPieces} عدد</div>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2.5">رسید نمبر</th>
                    <th className="p-2.5">قسم</th>
                    <th className="p-2.5">تاریخ</th>
                    <th className="p-2.5 text-center">کپڑے</th>
                    <th className="p-2.5 text-left">بل</th>
                    <th className="p-2.5 text-center">ادائیگی</th>
                    <th className="p-2.5 text-center">حالت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData?.receipts?.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-2.5 font-bold">{r.receipt_no}</td>
                      <td className="p-2.5">{r.type}</td>
                      <td className="p-2.5 text-slate-600">{new Date(r.date_time).toLocaleDateString()}</td>
                      <td className="p-2.5 text-center font-bold">{r.total_pieces}</td>
                      <td className="p-2.5 text-left font-bold">{r.type === 'Private' ? `Rs ${r.total_amount}` : 'Rs 0'}</td>
                      <td className="p-2.5 text-center">{r.payment_status}</td>
                      <td className="p-2.5 text-center font-semibold">{r.status}</td>
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
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-3">شے کا نام</th>
                    <th className="p-3">English</th>
                    <th className="p-3 text-left">ریٹ</th>
                    <th className="p-3 text-center">سرکاری تعداد</th>
                    <th className="p-3 text-center">پرائیویٹ تعداد</th>
                    <th className="p-3 text-center font-bold">کل تعداد</th>
                    <th className="p-3 text-left font-bold">کل بل رقم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.items.map((i: any) => (
                    <tr key={i.item_id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 urdu-compact text-sm">{i.name_ur}</td>
                      <td className="p-3 text-slate-600">{i.name_en}</td>
                      <td className="p-3 text-left">Rs {i.rate}</td>
                      <td className="p-3 text-center font-semibold text-blue-700">{i.sarkariQty}</td>
                      <td className="p-3 text-center font-semibold text-amber-700">{i.privateQty}</td>
                      <td className="p-3 text-center font-black text-slate-900">{i.totalQty}</td>
                      <td className="p-3 text-left font-bold text-emerald-700">Rs {i.totalAmt}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t">
                  <tr>
                    <td colSpan={5} className="p-3">کل میزان (Total Pieces & Revenue)</td>
                    <td className="p-3 text-center text-sm">{reportData.grandTotalPieces} عدد</td>
                    <td className="p-3 text-left text-sm text-emerald-800">Rs {reportData.grandTotalRevenue}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* R5: Sarkari Collection Day Report */}
        {!loading && selectedReport === 'sarkari_days' && reportData?.classBreakdown && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-blue-900 text-sm">سرکاری کلیکشن کا خلاصہ (منگل / جمعہ)</div>
                <div className="text-blue-700">دھلائی کے کام کی منصوبہ بندی اور لوڈ شیٹ</div>
              </div>
              <div className="text-left font-bold">
                <div className="text-blue-900 text-base">{reportData.totalSarkariReceipts} رسیدات</div>
                <div className="text-blue-700">{reportData.totalSarkariPieces} کل کپڑے</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-xs text-slate-700 mb-2">درجہ وار تقسیم (Class-wise):</h4>
                <div className="border rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">درجہ / کلاس</th>
                        <th className="p-2 text-center">طلبہ کی تعداد</th>
                        <th className="p-2 text-center">کل کپڑے</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.classBreakdown.map((c: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold">{c.className}</td>
                          <td className="p-2 text-center">{c.studentCount}</td>
                          <td className="p-2 text-center font-bold">{c.pieces}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-700 mb-2">اقامت وار تقسیم (Hostel-wise):</h4>
                <div className="border rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">اقامت / ہاسٹل</th>
                        <th className="p-2 text-center">طلبہ کی تعداد</th>
                        <th className="p-2 text-center">کل کپڑے</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.hostelBreakdown.map((h: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold truncate max-w-[160px]">{h.hostel}</td>
                          <td className="p-2 text-center">{h.studentCount}</td>
                          <td className="p-2 text-center font-bold">{h.pieces}</td>
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
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex justify-between items-center text-xs">
              <div className="font-bold text-red-900">
                کل غیر ادا شدہ رسیدات: {reportData.totalUnpaidCount}
              </div>
              <div className="font-bold text-red-900 text-base">
                کل واجب الادا رقم: Rs {reportData.totalUnpaidAmount}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2.5">رسید نمبر</th>
                    <th className="p-2.5">طالب علم کا نام</th>
                    <th className="p-2.5">رجسٹریشن</th>
                    <th className="p-2.5">کلاس / رہائش</th>
                    <th className="p-2.5 text-center">کپڑے</th>
                    <th className="p-2.5 text-left">واجب الادا رقم</th>
                    <th className="p-2.5">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.receipts.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono">{r.receipt_no}</td>
                      <td className="p-2.5 font-bold urdu-compact">{r.student_name}</td>
                      <td className="p-2.5 font-mono">{r.student_reg_no}</td>
                      <td className="p-2.5">{r.class_name} ({r.iqamat})</td>
                      <td className="p-2.5 text-center font-bold">{r.total_pieces}</td>
                      <td className="p-2.5 text-left font-black text-red-700">Rs {r.total_amount}</td>
                      <td className="p-2.5 text-slate-500">{new Date(r.date_time).toLocaleDateString()}</td>
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
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
              <div className="font-bold text-amber-900">
                غیر واپس شدہ کپڑے: {reportData.totalPending} رسیدات
              </div>
              <div className="font-bold text-red-700">
                3 دن سے زیادہ التواء (Overdue 3+ Days): {reportData.overdueCount} رسیدات
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2.5">رسید نمبر</th>
                    <th className="p-2.5">قسم</th>
                    <th className="p-2.5">طالب علم</th>
                    <th className="p-2.5 text-center">کپڑے</th>
                    <th className="p-2.5 text-center">التواء (عمر / دن)</th>
                    <th className="p-2.5 text-center">موجودہ حالت</th>
                    <th className="p-2.5">جمع کرانے کی تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.receipts.map((r: any) => (
                    <tr key={r.id} className={r.is_overdue ? 'bg-red-50/70 font-semibold text-red-950' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold font-mono">{r.receipt_no}</td>
                      <td className="p-2.5">{r.type}</td>
                      <td className="p-2.5 urdu-compact">{r.student_name} ({r.student_reg_no})</td>
                      <td className="p-2.5 text-center font-bold">{r.total_pieces}</td>
                      <td className="p-2.5 text-center font-black">
                        <span className={`px-2 py-0.5 rounded text-xs ${r.is_overdue ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                          {r.age_days} دن
                        </span>
                      </td>
                      <td className="p-2.5 text-center">{r.status}</td>
                      <td className="p-2.5 text-slate-500">{new Date(r.date_time).toLocaleDateString()}</td>
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
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2.5">وقت و تاریخ</th>
                    <th className="p-2.5">صارف (User)</th>
                    <th className="p-2.5 text-center">ایکشن</th>
                    <th className="p-2.5">ٹیبل / ریکارڈ</th>
                    <th className="p-2.5">تفصیل / وجہ (Reason)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {reportData.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-500">{new Date(log.date_time).toLocaleString()}</td>
                      <td className="p-2.5 font-bold text-slate-800">{log.user_name}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-700">{log.table_name} ({log.record_id})</td>
                      <td className="p-2.5 font-sans urdu-compact text-slate-800">{log.reason || '-'}</td>
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
