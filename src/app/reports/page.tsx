'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { translations } from '@/lib/i18n';
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
  Search,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const { settings, lang } = useApp();
  const t = translations[lang];

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

  const exportToExcel = () => {
    if (!reportData) return;
    let exportRows: any[] = [];

    if (selectedReport === 'daily' || selectedReport === 'student_history' || selectedReport === 'bag_sheet') {
      exportRows = (reportData.receipts || []).map((r: any) => ({
        [t.receipt_col]: r.receipt_no,
        [t.type_col]: r.type,
        [t.student_col]: r.student_name,
        [t.registration_no]: r.student_reg_no,
        [t.class_name]: r.class_name,
        [t.iqamat]: r.iqamat,
        [t.total_clothes_pieces]: r.total_pieces,
        [t.bill_col]: r.total_amount,
        [t.payment_situation]: r.payment_status,
        [t.status_col]: r.status,
        [t.timestamp_col]: new Date(r.date_time).toLocaleDateString(),
        [t.operator_col]: r.operator_name,
      }));
    } else if (selectedReport === 'weekly' || selectedReport === 'date_range') {
      exportRows = (reportData.days || []).map((d: any) => ({
        [t.timestamp_col]: d.date,
        [`${t.sarkari} ${t.receipt_col}`]: d.sarkariReceipts,
        [`${t.sarkari} ${t.pieces_col}`]: d.sarkariPieces,
        [`${t.private} ${t.receipt_col}`]: d.privateReceipts,
        [`${t.private} ${t.pieces_col}`]: d.privatePieces,
        [t.revenue_col]: d.revenue,
        [t.unpaid_col]: d.unpaid,
      }));
    } else if (selectedReport === 'item_wise') {
      exportRows = (reportData.items || []).map((i: any) => ({
        [t.item_ur]: i.name_ur,
        [t.item_en]: i.name_en,
        [t.rate]: i.rate,
        [`${t.sarkari} ${t.pieces_col}`]: i.sarkariQty,
        [`${t.private} ${t.pieces_col}`]: i.privateQty,
        [t.total_clothes_pieces]: i.totalQty,
        [t.amount_col]: i.totalAmt,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `jamia_laundry_${selectedReport}_${fromDate}.xlsx`);
  };

  const reportTabs = [
    { id: 'daily', label: t.r1_daily },
    { id: 'weekly', label: t.r2_weekly },
    { id: 'student_history', label: t.r3_student },
    { id: 'item_wise', label: t.r4_item },
    { id: 'sarkari_days', label: t.r5_sarkari },
    { id: 'unpaid', label: t.r7_unpaid },
    { id: 'pending_delivery', label: t.r8_pending },
    { id: 'audit_logs', label: t.audit_logs },
  ];

  return (
    <div className="space-y-4">
      
      {/* Header (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-base font-bold text-slate-900">{t.reports_title}</h1>
          <p className="text-[11px] text-slate-500">
            {t.reports_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.export_excel}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.print}</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills Bar */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-2 scrollbar-none text-xs print:hidden">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition text-xs ${
              selectedReport === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>{t.duration}</span>
          </span>

          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="p-1 px-2 border rounded-md bg-slate-50 text-xs font-mono"
          />
          <span className="text-slate-400">{t.date_to}</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="p-1 px-2 border rounded-md bg-slate-50 text-xs font-mono"
          />

          <div className="flex gap-1 text-[11px]">
            <button
              onClick={() => setQuickRange('today')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
            >
              {t.today}
            </button>
            <button
              onClick={() => setQuickRange('week')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
            >
              {t.this_week}
            </button>
            <button
              onClick={() => setQuickRange('month')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
            >
              {t.this_month}
            </button>
          </div>
        </div>

        {selectedReport === 'student_history' && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">{t.registration_no}:</span>
            <input
              type="text"
              placeholder="1234"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchReport()}
              className="p-1 px-2 border rounded-md bg-slate-50 w-24 font-mono font-bold text-xs"
            />
            <button
              onClick={fetchReport}
              className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-medium"
            >
              {t.search_btn}
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Output Container */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Institutional Report Header */}
        <div className="text-center pb-3 border-b border-slate-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logos/institution-logo.png" alt="IM" className="h-9 w-auto object-contain" />
            <img src="/logos/laundry-logo.png" alt="Laundry Services" className="h-9 w-auto object-contain" />
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {lang === 'en' ? (settings.jamia_name_en || settings.jamia_name) : settings.jamia_name} — {settings.laundry_name}
          </h2>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {t.report_label} <strong className="text-slate-800 uppercase">{selectedReport}</strong> | {fromDate} {fromDate !== toDate ? `${t.date_to} ${toDate}` : ''}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-8 text-center text-slate-400 text-xs">
            {t.loading}
          </div>
        )}

        {/* R1: Daily Collection */}
        {!loading && selectedReport === 'daily' && reportData?.summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">{t.total_receipts_label}</div>
                <div className="text-xl font-bold font-mono text-slate-900">{reportData.summary.totalReceipts}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {t.sarkari}: {reportData.summary.sarkariCount} | {t.private}: {reportData.summary.privateCount}
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                <div className="text-[11px] text-emerald-800 font-medium">{t.total_clothes_pieces}</div>
                <div className="text-xl font-bold font-mono text-emerald-900">{reportData.summary.totalPieces}</div>
                <div className="text-[10px] text-emerald-700 mt-1">
                  {t.sarkari}: {reportData.summary.sarkariPieces} | {t.private}: {reportData.summary.privatePieces}
                </div>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                <div className="text-[11px] text-amber-800 font-medium">{t.cash_collected}</div>
                <div className="text-xl font-bold font-mono text-amber-900">Rs {reportData.summary.privateCashCollected}</div>
                <div className="text-[10px] text-amber-700 mt-1">{t.counter_cash_collected}</div>
              </div>

              <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
                <div className="text-[11px] text-rose-800 font-medium">{t.unpaid_balance}</div>
                <div className="text-xl font-bold font-mono text-rose-900">Rs {reportData.summary.privateUnpaidTotal}</div>
                <div className="text-[10px] text-rose-700 mt-1">{t.due_on_delivery}</div>
              </div>
            </div>

            {/* Item Breakdown Summary Table */}
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">{t.item_breakdown_detail}</div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-[11px]">
                    <tr>
                      <th className="p-2 text-start">{t.item_ur}</th>
                      <th className="p-2 text-start">{t.item_en}</th>
                      <th className="p-2 text-center">{t.sarkari}</th>
                      <th className="p-2 text-center">{t.private}</th>
                      <th className="p-2 text-center font-bold">{t.total_pieces}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.itemTotals?.itemsList?.map((item: any) => {
                      const sQty = reportData.itemTotals.sarkari[item.id] || 0;
                      const pQty = reportData.itemTotals.private[item.id] || 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900">{item.name_ur}</td>
                          <td className="p-2 text-slate-500">{item.name_en}</td>
                          <td className="p-2 text-center font-mono text-blue-700">{sQty}</td>
                          <td className="p-2 text-center font-mono text-amber-700">{pQty}</td>
                          <td className="p-2 text-center font-mono font-bold text-slate-900">{sQty + pQty} {t.pieces}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* R2: Weekly / Date-range */}
        {!loading && (selectedReport === 'weekly' || selectedReport === 'date_range') && reportData?.days && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-[11px]">
                <tr>
                  <th className="p-2.5 text-start">{t.timestamp_col}</th>
                  <th className="p-2.5 text-center">{t.sarkari} {t.receipt_col}</th>
                  <th className="p-2.5 text-center">{t.sarkari} {t.pieces_col}</th>
                  <th className="p-2.5 text-center">{t.private} {t.receipt_col}</th>
                  <th className="p-2.5 text-center">{t.private} {t.pieces_col}</th>
                  <th className="p-2.5 text-start">{t.revenue_col}</th>
                  <th className="p-2.5 text-start">{t.unpaid_col}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.days.map((d: any) => (
                  <tr key={d.date} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{d.date}</td>
                    <td className="p-2.5 text-center font-mono text-blue-700">{d.sarkariReceipts}</td>
                    <td className="p-2.5 text-center font-mono">{d.sarkariPieces}</td>
                    <td className="p-2.5 text-center font-mono text-amber-700">{d.privateReceipts}</td>
                    <td className="p-2.5 text-center font-mono">{d.privatePieces}</td>
                    <td className="p-2.5 text-start font-mono font-bold text-emerald-700">Rs {d.revenue}</td>
                    <td className="p-2.5 text-start font-mono text-rose-600">Rs {d.unpaid}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t">
                <tr>
                  <td className="p-2.5">{t.total_sum}</td>
                  <td className="p-2.5 text-center">-</td>
                  <td className="p-2.5 text-center font-mono">{reportData.totals?.sarkariPieces}</td>
                  <td className="p-2.5 text-center">-</td>
                  <td className="p-2.5 text-center font-mono">{reportData.totals?.privatePieces}</td>
                  <td className="p-2.5 text-start font-mono text-emerald-800">Rs {reportData.totals?.totalRevenue}</td>
                  <td className="p-2.5 text-start font-mono text-rose-700">Rs {reportData.totals?.totalUnpaid}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* R3: Student History */}
        {!loading && selectedReport === 'student_history' && (
          <div className="space-y-3">
            {reportData?.student && (
              <div className="bg-slate-50 p-3 rounded-lg border flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{reportData.student.name}</div>
                  <div className="text-slate-500">
                    {t.father_name}: {reportData.student.father_name} • {t.class_name}: {reportData.student.class_name} ({reportData.student.iqamat})
                  </div>
                </div>
                <div className="text-end font-mono">
                  <div className="font-bold">Reg: {reportData.student.reg_no}</div>
                  <div className="text-emerald-700 font-semibold">
                    {reportData.totalReceipts} {t.receipt_col} • {reportData.totalPieces} {t.pieces}
                  </div>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-[11px]">
                  <tr>
                    <th className="p-2.5 text-start">{t.receipt_col}</th>
                    <th className="p-2.5 text-start">{t.type_col}</th>
                    <th className="p-2.5 text-start">{t.timestamp_col}</th>
                    <th className="p-2.5 text-center">{t.pieces_col}</th>
                    <th className="p-2.5 text-start">{t.bill_col}</th>
                    <th className="p-2.5 text-center">{t.status_col}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData?.receipts?.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{r.receipt_no}</td>
                      <td className="p-2.5">{r.type === 'Sarkari' ? t.sarkari : t.private}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{new Date(r.date_time).toLocaleDateString()}</td>
                      <td className="p-2.5 text-center font-mono font-bold">{r.total_pieces}</td>
                      <td className="p-2.5 text-start font-mono font-bold">
                        {r.type === 'Private' ? `Rs ${r.total_amount}` : t.free}
                      </td>
                      <td className="p-2.5 text-center font-medium">
                        {r.status === 'Delivered' ? t.delivered : r.status === 'Ready' ? t.ready : r.status === 'In Process' ? t.in_process : t.received}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* R4: Item-wise */}
        {!loading && selectedReport === 'item_wise' && reportData?.items && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-[11px]">
                <tr>
                  <th className="p-2.5 text-start">{t.item_ur}</th>
                  <th className="p-2.5 text-start">{t.item_en}</th>
                  <th className="p-2.5 text-start">{t.rate}</th>
                  <th className="p-2.5 text-center">{t.sarkari}</th>
                  <th className="p-2.5 text-center">{t.private}</th>
                  <th className="p-2.5 text-center font-bold">{t.total_clothes_pieces}</th>
                  <th className="p-2.5 text-start font-bold">{t.amount_col}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.items.map((i: any) => (
                  <tr key={i.item_id}>
                    <td className="p-2.5 font-medium text-slate-900">{i.name_ur}</td>
                    <td className="p-2.5 text-slate-500">{i.name_en}</td>
                    <td className="p-2.5 text-start font-mono">Rs {i.rate}</td>
                    <td className="p-2.5 text-center font-mono text-blue-700">{i.sarkariQty}</td>
                    <td className="p-2.5 text-center font-mono text-amber-700">{i.privateQty}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900">{i.totalQty}</td>
                    <td className="p-2.5 text-start font-mono font-bold text-emerald-700">Rs {i.totalAmt}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t">
                <tr>
                  <td colSpan={5} className="p-2.5">{t.total_sum}</td>
                  <td className="p-2.5 text-center font-mono">{reportData.grandTotalPieces} {t.pieces}</td>
                  <td className="p-2.5 text-start font-mono text-emerald-800">Rs {reportData.grandTotalRevenue}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* R7: Unpaid */}
        {!loading && selectedReport === 'unpaid' && reportData?.receipts && (
          <div className="space-y-3">
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 flex justify-between items-center text-xs text-rose-900 font-medium">
              <span>{t.all_unpaid_receipts} <strong className="font-mono">{reportData.totalUnpaidCount}</strong></span>
              <span>{t.all_unpaid_amount} <strong className="font-mono text-sm">Rs {reportData.totalUnpaidAmount}</strong></span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-[11px]">
                  <tr>
                    <th className="p-2.5 text-start">{t.receipt_col}</th>
                    <th className="p-2.5 text-start">{t.student_col}</th>
                    <th className="p-2.5 text-start">{t.registration_no}</th>
                    <th className="p-2.5 text-center">{t.pieces_col}</th>
                    <th className="p-2.5 text-start">{t.unpaid_col}</th>
                    <th className="p-2.5 text-start">{t.timestamp_col}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.receipts.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{r.receipt_no}</td>
                      <td className="p-2.5 font-medium">{r.student_name}</td>
                      <td className="p-2.5 font-mono text-slate-600">{r.student_reg_no}</td>
                      <td className="p-2.5 text-center font-mono font-semibold">{r.total_pieces}</td>
                      <td className="p-2.5 text-start font-mono font-bold text-rose-600">Rs {r.total_amount}</td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">{new Date(r.date_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {!loading && selectedReport === 'audit_logs' && reportData?.logs && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-[11px]">
                <tr>
                  <th className="p-2.5 text-start">{t.timestamp_col}</th>
                  <th className="p-2.5 text-start">{t.operator_col}</th>
                  <th className="p-2.5 text-center">{t.action_col}</th>
                  <th className="p-2.5 text-start">{t.record_col}</th>
                  <th className="p-2.5 text-start">{t.reason_col}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {reportData.logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="p-2.5 text-slate-500">{new Date(log.date_time).toLocaleString()}</td>
                    <td className="p-2.5 font-bold text-slate-800">{log.user_name}</td>
                    <td className="p-2.5 text-center font-bold">{log.action}</td>
                    <td className="p-2.5 text-slate-600">{log.table_name} ({log.record_id})</td>
                    <td className="p-2.5 font-sans text-slate-700">{log.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}