'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Student,
  LaundryItem,
  Receipt,
  ReceiptType,
  PaymentStatus,
} from '@/types';
import ThermalReceiptModal from '@/components/ThermalReceiptModal';
import WebcamCaptureModal from '@/components/WebcamCaptureModal';
import {
  Search,
  Shirt,
  Printer,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Camera,
  ShieldAlert,
  Calendar,
  Sparkles,
  Plus,
  Minus,
  Check,
  ReceiptText,
  BadgeCheck,
  Building2,
  Phone,
  Bookmark,
} from 'lucide-react';

export default function CounterPage() {
  const { user, t, settings, isTodaySarkariDay } = useApp();

  // Search & Student state
  const [regNoInput, setRegNoInput] = useState('');
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  const [hasExistingTodaySarkari, setHasExistingTodaySarkari] = useState(false);

  // Laundry parameters
  const [laundryType, setLaundryType] = useState<ReceiptType>('Private');
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Admin Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Modals
  const [printedReceipt, setPrintedReceipt] = useState<Receipt | null>(null);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // References for keyboard navigation
  const regNoInputRef = useRef<HTMLInputElement>(null);
  const firstItemInputRef = useRef<HTMLInputElement>(null);

  // Load items on mount
  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setItems(data.items.filter((i: LaundryItem) => i.active));
        }
      })
      .catch(console.error);

    regNoInputRef.current?.focus();
  }, []);

  // Keyboard shortcut: F9 or Ctrl+Enter to Save & Print, Esc to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        handleSaveAndPrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [student, laundryType, quantities, paymentStatus, discount, notes, overrideReason]);

  // Fast Lookup Student (COL-01: Under 1 second)
  const lookupStudent = async (targetRegNo?: string) => {
    const query = (targetRegNo || regNoInput).trim();
    if (!query) return;

    setLoadingStudent(true);
    setStudentError(null);
    setStudent(null);
    setPendingReceipts([]);
    setHasExistingTodaySarkari(false);

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setStudentError(data.error || 'طالب علم کا ریکارڈ نہیں ملا');
        return;
      }

      setStudent(data.student);
      setPendingReceipts(data.pendingReceipts || []);
      setHasExistingTodaySarkari(data.hasExistingTodaySarkari || false);

      // Auto set laundry type based on Sarkari eligibility & today collection day
      if (data.isSarkariEligible && isTodaySarkariDay) {
        setLaundryType('Sarkari');
      } else {
        setLaundryType('Private');
      }

      setQuantities({});
      setDiscount(0);
      setNotes('');

      setTimeout(() => {
        firstItemInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      setStudentError(err.message || 'Lookup failed');
    } finally {
      setLoadingStudent(false);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const current = quantities[itemId] || 0;
    const nextVal = Math.max(0, Math.min(99, current + delta));
    setQuantities(prev => ({ ...prev, [itemId]: nextVal }));
  };

  const setDirectQuantity = (itemId: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 99) {
      setQuantities(prev => ({ ...prev, [itemId]: num }));
    }
  };

  // Calculations
  const activeItems = items.filter(item => {
    if (laundryType === 'Sarkari') return item.allowed_sarkari;
    return item.allowed_private;
  });

  const totalPieces = activeItems.reduce((sum, item) => sum + (quantities[item.id] || 0), 0);

  const rawTotalAmount = laundryType === 'Private'
    ? activeItems.reduce((sum, item) => sum + ((quantities[item.id] || 0) * item.private_rate), 0)
    : 0;

  const netTotalAmount = Math.max(0, rawTotalAmount - discount);

  // Save & Print
  const handleSaveAndPrint = async () => {
    if (!student) {
      setStudentError('پہلے طالب علم تلاش فرمائیں (Please search for a student first)');
      regNoInputRef.current?.focus();
      return;
    }

    if (totalPieces === 0) {
      alert('کم از کم ایک شے کی تعداد درج کرنا لازمی ہے۔ (At least one item must have a quantity > 0)');
      return;
    }

    if (laundryType === 'Sarkari' && !isTodaySarkariDay && !overrideReason) {
      setShowOverrideModal(true);
      return;
    }

    setSaving(true);
    try {
      const itemsPayload = activeItems
        .filter(item => (quantities[item.id] || 0) > 0)
        .map(item => ({
          item_id: item.id,
          quantity: quantities[item.id],
        }));

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_reg_no: student.reg_no,
          type: laundryType,
          items: itemsPayload,
          payment_status: paymentStatus,
          discount,
          discount_reason: discountReason,
          notes,
          admin_override: !!overrideReason,
          override_reason: overrideReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresOverride) {
          setShowOverrideModal(true);
          return;
        }
        throw new Error(data.error || 'Failed to save receipt');
      }

      setPrintedReceipt(data.receipt);
      setSuccessToast(`رسید ${data.receipt.receipt_no} محفوظ ہو گئی اور پرنٹ کے لیے تیار ہے!`);
      handleReset();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStudent(null);
    setRegNoInput('');
    setStudentError(null);
    setPendingReceipts([]);
    setHasExistingTodaySarkari(false);
    setQuantities({});
    setDiscount(0);
    setDiscountReason('');
    setNotes('');
    setShowOverrideModal(false);
    setOverrideReason('');
    setTimeout(() => {
      regNoInputRef.current?.focus();
    }, 50);
  };

  const updateStudentPhoto = (newPhoto: string) => {
    if (!student) return;
    setStudent({ ...student, photo_url: newPhoto });
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...student, photo_url: newPhoto }),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between text-sm font-semibold animate-fade-in border border-emerald-400/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="font-nastaliq">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-100 hover:text-white p-1 rounded-lg">✕</button>
        </div>
      )}

      {/* Top Search Hero */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-5 rounded-3xl shadow-jamia border border-emerald-900/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:max-w-xl">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-800">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>طالب علم تلاش فرمائیں (Registration Number)</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ⚡ فاسٹ لوک اپ (Under 1 Sec)
              </span>
            </label>
            <div className="relative flex shadow-sm rounded-2xl overflow-hidden border-2 border-slate-300 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 transition bg-white">
              <input
                ref={regNoInputRef}
                type="text"
                value={regNoInput}
                onChange={e => setRegNoInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    lookupStudent();
                  }
                }}
                placeholder="طالب علم کا رجسٹریشن نمبر درج کریں اور Enter دبائیں (مثلاً: 1234)..."
                className="w-full px-4 py-3.5 text-base font-bold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs sm:placeholder:text-sm font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => lookupStudent()}
                disabled={loadingStudent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                {loadingStudent ? (
                  <span>تلاش...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>تلاش (Enter)</span>
                  </>
                )}
              </button>
            </div>

            {studentError && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in font-medium">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{studentError}</span>
              </div>
            )}
          </div>

          {/* Quick Counter Shortcuts Pill */}
          <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] text-slate-500 bg-white/80 p-3 rounded-2xl border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>فاسٹ کاؤنٹر شارٹ کٹس:</span>
            </div>
            <div><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border font-mono">Enter</kbd> : طالب علم تلاش / اگلے خانے میں جائیں</div>
            <div><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border font-mono font-bold text-emerald-700">F9</kbd> : محفوظ کریں اور پرنٹ نکالیں</div>
            <div><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border font-mono">Esc</kbd> : نیا طالب علم شروع کریں</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Student Profile & Items Entry (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Institutional Student Identity Card */}
          {student ? (
            <div className="bg-white rounded-3xl shadow-jamia border border-emerald-900/15 overflow-hidden transition-all duration-200">
              {/* Card Banner */}
              <div className="bg-gradient-to-r from-jamia-900 via-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-300" />
                  <span className="font-bold text-sm font-nastaliq">شناختی کوائف طالب علم (Student Profile)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
                    student.is_sarkari
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-amber-600 text-white border border-amber-400'
                  }`}>
                    {student.is_sarkari ? 'سرکاری مفت لانڈری' : 'پرائیویٹ بل'}
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-white/20 text-white border border-white/20">
                    {student.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Photo Container with Gold Ring */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-emerald-500/20 shadow-md bg-slate-100 flex items-center justify-center">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                          <User className="w-10 h-10 text-emerald-800/40 mb-1" />
                          <span className="text-[9px] text-slate-500 font-semibold">بغیر تصویر</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowWebcamModal(true)}
                      className="absolute -bottom-2 -right-2 bg-slate-900 hover:bg-emerald-600 text-white p-2 rounded-xl shadow-lg transition"
                      title="کیمرہ سے تصویر بنائیں"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Student Credentials */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <div className="text-xl font-bold text-slate-900 font-nastaliq leading-tight">
                          {student.name}
                        </div>
                        <div className="text-xs text-slate-600 font-nastaliq">
                          ولدیت: <span className="font-semibold text-slate-800">{student.father_name}</span>
                        </div>
                      </div>
                      <div className="text-left font-mono bg-slate-100 px-3 py-1 rounded-xl border text-xs">
                        <span className="text-slate-400 block text-[9px] font-bold">REG NO:</span>
                        <span className="text-base font-black text-slate-900">{student.reg_no}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-bold">درجہ / کلاس:</span>
                        <span className="font-bold text-slate-800">{student.class_name} ({student.section || 'عام'})</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-bold">رہائش / اقامت:</span>
                        <span className="font-semibold text-slate-800 truncate block">{student.iqamat}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warnings: Duplicate Day Sarkari Receipt */}
                {hasExistingTodaySarkari && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold font-nastaliq">تنبہیہ: آج کی سرکاری رسید پہلے سے بن چکی ہے!</div>
                      <div className="text-[11px] text-amber-800">اس طالب علم نے آج پہلے ہی سرکاری کپڑے جمع کرائے ہیں (COL-10)۔</div>
                    </div>
                  </div>
                )}

                {/* Pending Receipts Alert */}
                {pendingReceipts.length > 0 && (
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
                    <div className="font-bold text-blue-900 mb-2 flex items-center gap-1.5 font-nastaliq">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>غیر واپس شدہ سابقہ رسیدات ({pendingReceipts.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pendingReceipts.map(pr => (
                        <div key={pr.id} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-xl border border-blue-100 shadow-sm">
                          <span className="font-bold text-slate-800 font-mono">{pr.receipt_no}</span>
                          <span className="font-semibold text-blue-700">{pr.total_pieces} عدد • {pr.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center text-slate-400 space-y-2">
              <User className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-sm text-slate-600 font-nastaliq">کوئی طالب علم منتخب نہیں ہے</div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto">
                اوپر دیے گئے خانے میں رجسٹریشن نمبر درج کریں (مثلاً: <button onClick={() => lookupStudent('1234')} className="text-emerald-700 underline font-bold font-mono">1234</button> یا <button onClick={() => lookupStudent('1236')} className="text-emerald-700 underline font-bold font-mono">1236</button>)
              </div>
            </div>
          )}

          {/* Clothes Item Counter Grid */}
          <div className="bg-white rounded-3xl shadow-jamia border border-emerald-900/15 p-5 space-y-4">
            
            {/* Laundry Type Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  لانڈری کیٹیگری (Category):
                </label>
                <div className="inline-flex rounded-2xl p-1 bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (!student?.is_sarkari) {
                        alert('یہ طالب علم سرکاری لانڈری کے لیے رجسٹرڈ نہیں ہے۔ (Not registered for Sarkari)');
                        return;
                      }
                      if (!isTodaySarkariDay) {
                        setShowOverrideModal(true);
                      }
                      setLaundryType('Sarkari');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      laundryType === 'Sarkari'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>سرکاری (مفت)</span>
                    {student?.is_sarkari && <BadgeCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaundryType('Private')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      laundryType === 'Private'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>پرائیویٹ (بل فی عدد)</span>
                  </button>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px] font-bold">متوقع واپسی (Ready Date):</span>
                <span className="font-bold text-emerald-800 text-sm flex items-center gap-1 justify-end font-mono">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {laundryType === 'Sarkari'
                      ? `+${settings.sarkari_turnaround_days} Days (2 دن)`
                      : `+${settings.private_turnaround_days} Day (1 دن)`}
                  </span>
                </span>
              </div>
            </div>

            {/* Clothes Items Rows with Ergonomic Stepper */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activeItems.map((item, idx) => {
                const qty = quantities[item.id] || 0;
                const lineTotal = qty * item.private_rate;
                const isSelected = qty > 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {/* Item Details */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.display_order}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base font-nastaliq leading-snug">
                          {item.name_ur}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {item.name_en}
                        </div>
                      </div>
                    </div>

                    {/* Rates & Counter Controls */}
                    <div className="flex items-center gap-4">
                      {laundryType === 'Private' ? (
                        <div className="text-left font-mono">
                          <span className="text-[10px] text-slate-400 block">ریٹ: Rs {item.private_rate}</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {isSelected ? `Rs ${lineTotal}` : '-'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          سرکاری (Rs 0)
                        </div>
                      )}

                      {/* Ergonomic Counter: [-] [ input ] [+] */}
                      <div className="flex items-center bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2.5 py-2 hover:bg-slate-100 text-slate-600 active:bg-slate-200 transition"
                          title="کم کریں (-1)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          ref={idx === 0 ? firstItemInputRef : undefined}
                          type="number"
                          min="0"
                          max="99"
                          value={qty === 0 ? '' : qty}
                          onChange={e => setDirectQuantity(item.id, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const nextInput = (e.currentTarget.parentElement?.parentElement?.parentElement?.nextElementSibling?.querySelector('input')) as HTMLInputElement;
                              if (nextInput) {
                                nextInput.focus();
                                nextInput.select();
                              } else {
                                handleSaveAndPrint();
                              }
                            }
                          }}
                          placeholder="0"
                          className="w-12 text-center py-1.5 text-base font-bold text-slate-900 focus:outline-none focus:bg-emerald-50/50 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2.5 py-2 hover:bg-slate-100 text-slate-600 active:bg-slate-200 transition"
                          title="بڑھائیں (+1)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Receipt Slip & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl shadow-jamia-lg border border-emerald-900/15 overflow-hidden sticky top-20">
            {/* Receipt Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-emerald-300" />
                <span className="font-bold text-sm font-nastaliq">لائیو بل سلپ (Receipt Preview)</span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                laundryType === 'Sarkari' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {laundryType === 'Sarkari' ? 'سرکاری' : 'پرائیویٹ'}
              </span>
            </div>

            {/* Receipt Slip Sheet */}
            <div className="p-5 space-y-4 bg-cream">
              
              {/* Institution Stamp */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="font-bold text-base text-slate-900 font-nastaliq leading-tight">
                  {settings.jamia_name}
                </div>
                <div className="text-[11px] font-semibold text-emerald-800">
                  {settings.laundry_name}
                </div>
                <div className="text-[10px] text-slate-500">
                  تاریخ: {new Date().toLocaleDateString()} | آپریٹر: {user?.full_name || 'کاؤنٹر آپریٹر'}
                </div>
              </div>

              {/* Student Summary on Slip */}
              {student ? (
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">طالب علم:</span>
                    <span className="text-slate-900 font-nastaliq">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">رجسٹریشن / درجہ:</span>
                    <span className="font-mono">{student.reg_no} ({student.class_name})</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-slate-400 italic">
                  طالب علم کا انتخاب فرمائیں
                </div>
              )}

              {/* Items Summary Breakdown */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase pb-1">
                  <span>شے اور تعداد</span>
                  <span>رقم</span>
                </div>

                {activeItems
                  .filter(i => (quantities[i.id] || 0) > 0)
                  .map(i => {
                    const q = quantities[i.id];
                    const amt = q * i.private_rate;
                    return (
                      <div key={i.id} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 font-nastaliq">
                          {i.name_ur} <span className="text-[11px] text-slate-500 font-mono">({q} عدد)</span>
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {laundryType === 'Private' ? `Rs ${amt}` : 'Rs 0'}
                        </span>
                      </div>
                    );
                  })}

                {totalPieces === 0 && (
                  <div className="text-center py-3 text-xs text-slate-400">
                    کپڑوں کی تعداد درج فرمائیں
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="خصوصی نوٹ (مثلاً: داغ، استری، بٹن وغیرہ)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Private Payment Status Selector */}
              {laundryType === 'Private' && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-600">ادائیگی کی صورتحال:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('Paid')}
                      className={`py-2 rounded-xl font-bold border transition ${
                        paymentStatus === 'Paid'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      ادا شدہ (Paid Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('Unpaid')}
                      className={`py-2 rounded-xl font-bold border transition ${
                        paymentStatus === 'Unpaid'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      واپسی پر (Unpaid)
                    </button>
                  </div>
                </div>
              )}

              {/* Live Totals Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span className="font-bold">کل کپڑے (Pieces):</span>
                  <span className="text-base font-black text-slate-900 font-mono">{totalPieces} عدد</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold border-t pt-2">
                  <span>قابل ادائیگی (Total Bill):</span>
                  <span className={`text-2xl font-black font-mono ${
                    laundryType === 'Private' ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {laundryType === 'Private' ? `Rs ${netTotalAmount}` : 'Rs 0 (مفت)'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAndPrint}
                  disabled={saving || !student || totalPieces === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں اور پرنٹ نکالیں (F9)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full bg-white hover:bg-slate-100 text-slate-600 text-xs py-2.5 px-4 rounded-xl border border-slate-300 font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>فارم صاف کریں (Esc)</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Admin Override Modal for Sarkari Day */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 font-nastaliq">
                ایڈمن خصوصی اجازت (Sarkari Day Override)
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 font-nastaliq">
              آج سرکاری کلیکشن کا دن نہیں ہے (مقررہ دن: منگل، جمعہ)۔ سرکاری رسید بنانے کے لیے ایڈمنسٹریٹر کی خصوصی اجازت اور وجہ درج کرنا لازمی ہے۔
            </p>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="خصوصی اجازت کی وجہ درج فرمائیں (Reason for override)..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setLaundryType('Private');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100"
              >
                کینسل کریں (پرائیویٹ رکھیں)
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={() => {
                  setShowOverrideModal(false);
                  handleSaveAndPrint();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold shadow"
              >
                اجازت دیں اور جاری رکھیں
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      {printedReceipt && (
        <ThermalReceiptModal
          receipt={printedReceipt}
          settings={settings}
          onClose={() => setPrintedReceipt(null)}
        />
      )}

      {/* Webcam Snapshot Capture Modal */}
      {showWebcamModal && (
        <WebcamCaptureModal
          studentName={student?.name}
          onCapture={updateStudentPhoto}
          onClose={() => setShowWebcamModal(false)}
        />
      )}
    </div>
  );
}
