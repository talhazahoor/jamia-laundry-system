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
  ArrowRight,
  Info,
  Calendar,
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

    // Focus registration input on load
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

  // Lookup student (COL-01: Under 1 second)
  const lookupStudent = async (targetRegNo?: string) => {
    const query = (targetRegNo || regNoInput).trim();
    if (!query) return;

    setLoadingStudent(true);
    setStudentError(null);
    setStudent(null);
    setPendingReceipts([]);
    setHasExistingTodaySarkari(false);

    try {
      const startTime = performance.now();
      const res = await fetch(`/api/students/${encodeURIComponent(query)}`);
      const data = await res.json();
      const elapsed = (performance.now() - startTime).toFixed(0);

      if (!res.ok) {
        setStudentError(data.error || 'Student not found');
        return;
      }

      setStudent(data.student);
      setPendingReceipts(data.pendingReceipts || []);
      setHasExistingTodaySarkari(data.hasExistingTodaySarkari || false);

      // Automatic category selection:
      // Sarkari if student is Sarkari-registered AND today is collection day; otherwise Private
      if (data.isSarkariEligible && isTodaySarkariDay) {
        setLaundryType('Sarkari');
      } else {
        setLaundryType('Private');
      }

      // Reset quantities for fresh entry
      setQuantities({});
      setDiscount(0);
      setNotes('');

      // Auto focus on first laundry item input for high-speed counter queue
      setTimeout(() => {
        firstItemInputRef.current?.focus();
      }, 50);

      console.log(`Student lookup completed in ${elapsed}ms`);
    } catch (err: any) {
      setStudentError(err.message || 'Lookup failed');
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleQuantityChange = (itemId: string, val: string) => {
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
      setStudentError('پہلے طالب علم تلاش کریں (Please search for a student first)');
      regNoInputRef.current?.focus();
      return;
    }

    if (totalPieces === 0) {
      alert('کم از کم ایک شے کی تعداد درج کرنا لازمی ہے۔ (At least one item must have a quantity > 0)');
      return;
    }

    // Check Sarkari day condition
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

      // Success: open thermal receipt modal
      setPrintedReceipt(data.receipt);
      setSuccessToast(`رسید ${data.receipt.receipt_no} محفوظ ہو گئی اور پرنٹ کے لیے تیار ہے!`);

      // Reset form for next student
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
    // Update backend
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...student, photo_url: newPhoto }),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Success Notification */}
      {successToast && (
        <div className="mb-4 bg-emerald-600 text-white p-3 rounded-xl shadow flex items-center justify-between animate-fade-in text-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Left = Student Lookup & Profile, Right = Item Entry & Live Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Student Lookup & Profile (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Fast Lookup Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>{t.enter_reg_no} (Registration No.)</span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                فاسٹ لوک اپ (Under 1 Sec)
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
                  placeholder={t.search_student_placeholder}
                  className="w-full pl-3 pr-9 py-2.5 rounded-lg border-2 border-slate-300 focus:border-emerald-500 focus:outline-none text-base font-bold text-slate-900 shadow-inner"
                  autoFocus
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <button
                onClick={() => lookupStudent()}
                disabled={loadingStudent}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5 shadow transition"
              >
                {loadingStudent ? 'تلاش...' : 'تلاش کریں (Enter)'}
              </button>
            </div>

            {studentError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{studentError}</span>
              </div>
            )}
          </div>

          {/* Student Profile Display */}
          {student && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm">تفصیلات طالب علم (Student Info)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    student.is_sarkari
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {student.is_sarkari ? 'سرکاری رجسٹرڈ' : 'صرف پرائیویٹ'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    student.status === 'Active' ? 'bg-emerald-700 text-emerald-100' : 'bg-red-700 text-red-100'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-4 items-start">
                  {/* Student Photo */}
                  <div className="relative group shrink-0">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shadow-inner">
                        <User className="w-10 h-10 mb-1" />
                        <span className="text-[10px]">تصویر نہیں ہے</span>
                      </div>
                    )}
                    <button
                      onClick={() => setShowWebcamModal(true)}
                      className="absolute bottom-0 right-0 bg-slate-900/90 text-white p-1 rounded-lg hover:bg-emerald-600 transition shadow"
                      title="کیمرہ سے تصویر بنائیں"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Student Credentials */}
                  <div className="space-y-1 flex-1 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-500">{t.name}:</span>
                      <span className="font-bold text-sm text-slate-900 urdu-compact">{student.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-500">{t.father_name}:</span>
                      <span className="font-semibold text-slate-800 urdu-compact">{student.father_name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-500">{t.darja_class}:</span>
                      <span className="font-medium text-slate-800">{student.class_name} ({student.section || 'عام'})</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-500">{t.iqamat}:</span>
                      <span className="font-medium text-slate-800 text-[11px] truncate max-w-[180px]">{student.iqamat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">رابطہ:</span>
                      <span className="font-medium text-slate-700">{student.contact || 'دستیاب نہیں'}</span>
                    </div>
                  </div>
                </div>

                {/* Warnings: Duplicate Day Sarkari Receipt */}
                {hasExistingTodaySarkari && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold">تنبہیہ: آج کی سرکاری رسید پہلے سے موجود ہے!</div>
                      <div className="text-[11px] text-amber-800">اس طالب علم نے آج سرکاری کپڑے جمع کرا دیے ہیں (COL-10)۔</div>
                    </div>
                  </div>
                )}

                {/* Pending Undelivered Receipts */}
                {pendingReceipts.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                    <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>غیر موصولہ رسیدات ({pendingReceipts.length}):</span>
                    </div>
                    <div className="space-y-1">
                      {pendingReceipts.map(pr => (
                        <div key={pr.id} className="flex justify-between text-[11px] bg-white p-1 rounded border border-blue-100">
                          <span className="font-semibold">{pr.receipt_no} ({pr.type})</span>
                          <span>{pr.total_pieces} عدد • حالت: {pr.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Counter Helper Hints */}
          <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>کی بورڈ شارٹ کٹس (Keyboard Navigation):</span>
            </div>
            <div>• <kbd className="bg-white px-1.5 py-0.5 rounded border">Enter</kbd> : طالب علم تلاش کریں / اگلے خانے میں جائیں</div>
            <div>• <kbd className="bg-white px-1.5 py-0.5 rounded border">F9</kbd> یا <kbd className="bg-white px-1.5 py-0.5 rounded border">Ctrl+P</kbd> : فوری محفوظ کریں اور تھرمل پرنٹ نکالیں</div>
            <div>• <kbd className="bg-white px-1.5 py-0.5 rounded border">Esc</kbd> : فارم صاف کر کے اگلا طالب علم لیں</div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clothes Entry & Live Thermal Billing (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            
            {/* Top Toolbar: Laundry Type Selection */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  لانڈری کی قسم (Category)
                </label>
                <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
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
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                      laundryType === 'Sarkari'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>سرکاری (مفت)</span>
                    {student?.is_sarkari && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaundryType('Private')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                      laundryType === 'Private'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>پرائیویٹ (بل فی عدد)</span>
                  </button>
                </div>
              </div>

              {/* Sarkari Collection Day Reminder */}
              <div className="text-right text-xs">
                <div className="text-slate-500">متوقع واپسی (Ready Date):</div>
                <div className="font-bold text-slate-900 text-sm flex items-center justify-end gap-1 text-emerald-700">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {laundryType === 'Sarkari' ? `+${settings.sarkari_turnaround_days} دن (2 Days)` : `+${settings.private_turnaround_days} دن (1 Day)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-4">
              <div className="grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
                <span className="col-span-5">{t.item_name}</span>
                <span className="col-span-3 text-center">{t.quantity}</span>
                {laundryType === 'Private' ? (
                  <>
                    <span className="col-span-2 text-right">{t.unit_rate}</span>
                    <span className="col-span-2 text-right">{t.line_total}</span>
                  </>
                ) : (
                  <span className="col-span-4 text-right text-blue-600">سرکاری (مفت)</span>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
                {activeItems.map((item, idx) => {
                  const qty = quantities[item.id] || '';
                  const lineTotal = (Number(qty) || 0) * item.private_rate;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 items-center py-2 hover:bg-slate-50/80 rounded transition px-1"
                    >
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-4">{item.display_order}.</span>
                        <div>
                          <div className="font-bold text-slate-900 urdu-compact text-sm">
                            {item.name_ur}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.name_en}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Input Box */}
                      <div className="col-span-3 flex justify-center">
                        <input
                          ref={idx === 0 ? firstItemInputRef : undefined}
                          type="number"
                          min="0"
                          max="99"
                          value={qty}
                          onChange={e => handleQuantityChange(item.id, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const nextInput = (e.currentTarget.parentElement?.parentElement?.nextElementSibling?.querySelector('input')) as HTMLInputElement;
                              if (nextInput) {
                                nextInput.focus();
                                nextInput.select();
                              } else {
                                handleSaveAndPrint();
                              }
                            }
                          }}
                          placeholder="0"
                          className="w-16 text-center py-1.5 rounded-lg border-2 border-slate-200 focus:border-emerald-500 focus:bg-emerald-50 text-base font-bold text-slate-900 shadow-sm"
                        />
                      </div>

                      {laundryType === 'Private' ? (
                        <>
                          <div className="col-span-2 text-right font-medium text-slate-600 text-xs">
                            Rs {item.private_rate}
                          </div>
                          <div className="col-span-2 text-right font-bold text-slate-900 text-sm">
                            Rs {lineTotal}
                          </div>
                        </>
                      ) : (
                        <div className="col-span-4 text-right text-xs font-semibold text-blue-700">
                          Rs 0
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bill Summary & Options */}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 space-y-3 bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-xl">
              
              {/* Optional Notes */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="خصوصی نوٹ / داغ وغیرہ (Optional notes: e.g. stain, button missing)"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Private Payment Details */}
              {laundryType === 'Private' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ادائیگی کی صورتحال (Payment Status):
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('Paid')}
                        className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                          paymentStatus === 'Paid'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        ادا شدہ (Cash Paid)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('Unpaid')}
                        className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                          paymentStatus === 'Unpaid'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        واپسی پر (Unpaid)
                      </button>
                    </div>
                  </div>

                  {user?.role === 'Administrator' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        رعایت (Admin Discount PKR):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={discount || ''}
                        onChange={e => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="0"
                        className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Live Totals & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">{t.total_pieces}</div>
                    <div className="text-2xl font-black text-slate-900">{totalPieces} <span className="text-xs font-normal">عدد</span></div>
                  </div>

                  {laundryType === 'Private' ? (
                    <div>
                      <div className="text-xs text-slate-500 font-semibold">{t.grand_total}</div>
                      <div className="text-2xl font-black text-amber-600">Rs {netTotalAmount}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-slate-500 font-semibold">کل بل</div>
                      <div className="text-2xl font-black text-blue-600">Rs 0 <span className="text-xs font-normal">(مفت)</span></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-white hover:bg-slate-200 text-slate-700 text-xs px-3 py-2.5 rounded-lg border border-slate-300 font-medium transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>صاف کریں (Esc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndPrint}
                    disabled={saving || !student || totalPieces === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-lg flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں اور پرنٹ (F9)'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Admin Override Modal for Sarkari Day */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                ایڈمن خصوصی اجازت (Sarkari Day Override)
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              آج سرکاری کلیکشن کا دن نہیں ہے (مقررہ دن: منگل، جمعہ)۔ سرکاری رسید بنانے کے لیے ایڈمنسٹریٹر کی خصوصی اجازت اور وجہ درج کرنا لازمی ہے۔
            </p>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="خصوصی اجازت کی وجہ درج فرمائیں (Reason for override)..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setLaundryType('Private');
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
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
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold"
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
