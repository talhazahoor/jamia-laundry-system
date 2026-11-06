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
  Plus,
  Minus,
  ReceiptText,
  BadgeCheck,
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

  const regNoInputRef = useRef<HTMLInputElement>(null);
  const firstItemInputRef = useRef<HTMLInputElement>(null);

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

  const lookupStudent = async (overrideRegNo?: string) => {
    const targetReg = (overrideRegNo || regNoInput).trim();
    if (!targetReg) return;

    setLoadingStudent(true);
    setStudentError(null);
    setStudent(null);
    setPendingReceipts([]);
    setHasExistingTodaySarkari(false);

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(targetReg)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'طالب علم کا ریکارڈ نہیں ملا');
      }

      setStudent(data.student);
      setPendingReceipts(data.pendingReceipts || []);
      setHasExistingTodaySarkari(!!data.hasExistingTodaySarkari);

      if (data.student.is_sarkari && isTodaySarkariDay && !data.hasExistingTodaySarkari) {
        setLaundryType('Sarkari');
      } else {
        setLaundryType('Private');
      }

      setTimeout(() => {
        firstItemInputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      setStudentError(err.message || 'طالب علم تلاش کرنے میں خرابی پیش آئی');
    } finally {
      setLoadingStudent(false);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const current = quantities[itemId] || 0;
    const nextVal = Math.max(0, current + delta);
    setQuantities(prev => ({
      ...prev,
      [itemId]: nextVal,
    }));
  };

  const setDirectQuantity = (itemId: string, val: string) => {
    const num = parseInt(val, 10);
    setQuantities(prev => ({
      ...prev,
      [itemId]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const activeItems = items.filter(item => {
    if (laundryType === 'Sarkari') return item.allowed_sarkari;
    return item.allowed_private;
  });

  const totalPieces = activeItems.reduce((sum, item) => {
    return sum + (quantities[item.id] || 0);
  }, 0);

  const rawTotalAmount = laundryType === 'Private'
    ? activeItems.reduce((sum, item) => {
        const qty = quantities[item.id] || 0;
        return sum + qty * item.private_rate;
      }, 0)
    : 0;

  const netTotalAmount = Math.max(0, rawTotalAmount - (discount || 0));

  const handleSaveAndPrint = async () => {
    if (!student) {
      alert('براہ کرم پہلے طالب علم کا انتخاب فرمائیں');
      regNoInputRef.current?.focus();
      return;
    }

    if (totalPieces === 0) {
      alert('براہ کرم کم از کم ایک شے کی تعداد درج فرمائیں');
      return;
    }

    if (laundryType === 'Sarkari' && !isTodaySarkariDay && !overrideReason) {
      setShowOverrideModal(true);
      return;
    }

    setSaving(true);
    try {
      const itemsPayload = activeItems
        .filter(i => (quantities[i.id] || 0) > 0)
        .map(i => ({
          item_id: i.id,
          quantity: quantities[i.id],
          rate: laundryType === 'Private' ? i.private_rate : 0,
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
        throw new Error(data.error || 'رسید محفوظ نہیں ہو سکی');
      }

      setPrintedReceipt(data.receipt);
      setSuccessToast(`رسید #${data.receipt.receipt_no} جاری ہو گئی`);
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
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-white hover:opacity-75">✕</button>
        </div>
      )}

      {/* Top Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full max-w-lg">
          <div className="relative flex rounded-lg border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden bg-white">
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
              placeholder="طالب علم کا رجسٹریشن نمبر درج کریں (مثلاً: 1234)..."
              className="w-full px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => lookupStudent()}
              disabled={loadingStudent}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 flex items-center gap-1.5 transition shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loadingStudent ? 'تلاش...' : 'تلاش'}</span>
            </button>
          </div>

          {studentError && (
            <div className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              <span>{studentError}</span>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
          <span><kbd className="bg-slate-100 px-1 py-0.5 rounded border font-mono">Enter</kbd> تلاش</span>
          <span><kbd className="bg-slate-100 px-1 py-0.5 rounded border font-mono font-bold text-emerald-700">F9</kbd> پرنٹ</span>
          <span><kbd className="bg-slate-100 px-1 py-0.5 rounded border font-mono">Esc</kbd> نیا اندراج</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left 7 Columns: Student Profile & Items Entry */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Student Profile Card */}
          {student ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={() => setShowWebcamModal(true)}
                      className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1 rounded-md text-[9px]"
                      title="تصویر تبدیل کریں"
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{student.name}</div>
                    <div className="text-[11px] text-slate-500">
                      ولدیت: <span className="text-slate-700">{student.father_name}</span> • کلاس: <span className="text-slate-700">{student.class_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">رہائش: {student.iqamat}</div>
                  </div>
                </div>

                <div className="text-left">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {student.reg_no}
                  </span>
                  <div className="mt-1">
                    <span className={`inline-block text-[10px] px-2 py-0.2 rounded font-semibold ${
                      student.is_sarkari ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {student.is_sarkari ? 'سرکاری مفت' : 'پرائیویٹ بل'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duplicate day warning */}
              {hasExistingTodaySarkari && (
                <div className="text-[11px] p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>طالب علم آج پہلے ہی سرکاری کپڑے جمع کرا چکا ہے۔</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              رجسٹریشن نمبر درج کر کے طالب علم منتخب فرمائیں (مثلاً: <button onClick={() => lookupStudent('1234')} className="text-emerald-700 font-mono underline font-bold">1234</button> یا <button onClick={() => lookupStudent('1236')} className="text-emerald-700 font-mono underline font-bold">1236</button>)
            </div>
          )}

          {/* Items Entry Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs">کپڑوں کی اشیاء اور تعداد</span>

              {/* Sarkari / Private toggle */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    if (!student?.is_sarkari) {
                      alert('یہ طالب علم سرکاری لانڈری کے لیے رجسٹرڈ نہیں ہے');
                      return;
                    }
                    if (!isTodaySarkariDay) setShowOverrideModal(true);
                    setLaundryType('Sarkari');
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    laundryType === 'Sarkari' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  سرکاری (مفت)
                </button>
                <button
                  type="button"
                  onClick={() => setLaundryType('Private')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    laundryType === 'Private' ? 'bg-amber-600 text-white' : 'text-slate-600'
                  }`}
                >
                  پرائیویٹ
                </button>
              </div>
            </div>

            {/* Steppers */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
              {activeItems.map((item, idx) => {
                const qty = quantities[item.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition ${
                      isSelected ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50/40 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{item.name_ur}</div>
                      <div className="text-[10px] text-slate-400">{item.name_en}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-mono text-[11px]">
                        {laundryType === 'Private' ? (
                          <span className="text-slate-600 font-semibold">Rs {item.private_rate}</span>
                        ) : (
                          <span className="text-blue-700">مفت</span>
                        )}
                      </div>

                      <div className="flex items-center bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
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
                          className="w-10 text-center py-1 text-xs font-bold text-slate-900 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live Bill Slip & Actions */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3.5 sticky top-16">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-semibold text-slate-800">
            <span>رسید کا پیش منظر (Live Receipt)</span>
            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
              laundryType === 'Sarkari' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {laundryType === 'Sarkari' ? 'سرکاری' : 'پرائیویٹ'}
            </span>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>طالب علم:</span>
              <span className="font-bold text-slate-900">{student ? student.name : '—'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>رجسٹریشن:</span>
              <span className="font-mono text-slate-800">{student ? student.reg_no : '—'}</span>
            </div>
          </div>

          <div className="border-t border-b border-slate-100 py-2.5 space-y-1.5 text-xs">
            {activeItems
              .filter(i => (quantities[i.id] || 0) > 0)
              .map(i => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-slate-700">{i.name_ur} × {quantities[i.id]}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {laundryType === 'Private' ? `Rs ${quantities[i.id] * i.private_rate}` : 'Rs 0'}
                  </span>
                </div>
              ))}
            {totalPieces === 0 && (
              <div className="text-slate-400 text-center py-2 text-[11px]">کوئی شے منتخب نہیں ہے</div>
            )}
          </div>

          {/* Notes input */}
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="کوئی نوٹ یا خصوصی ہدایت..."
            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {/* Payment Toggle for Private */}
          {laundryType === 'Private' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentStatus('Paid')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  paymentStatus === 'Paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                ادا شدہ (Paid)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Unpaid')}
                className={`py-1.5 rounded-lg font-medium transition ${
                  paymentStatus === 'Unpaid'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                واپسی پر (Unpaid)
              </button>
            </div>
          )}

          {/* Total & Action */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>کل کپڑے:</span>
              <span className="font-mono font-bold text-slate-900">{totalPieces} عدد</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-slate-200">
              <span>کل بل رقم:</span>
              <span className="font-mono text-base text-slate-900">
                {laundryType === 'Private' ? `Rs ${netTotalAmount}` : 'مفت (سرکاری)'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSaveAndPrint}
              disabled={saving || !student || totalPieces === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں اور پرنٹ نکالیں (F9)'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-1.5 text-slate-500 hover:text-slate-700 text-xs transition flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>صاف کریں (Esc)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Admin Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>ایڈمن خصوصی اجازت</span>
            </div>
            <p className="text-slate-600 leading-normal">
              آج سرکاری کلیکشن کا مقررہ دن نہیں ہے۔ سرکاری رسید جاری کرنے کی وجہ درج فرمائیں:
            </p>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="وجہ تحریر کریں..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setLaundryType('Private');
                }}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
              >
                کینسل
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={() => {
                  setShowOverrideModal(false);
                  handleSaveAndPrint();
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50 font-semibold"
              >
                اجازت دیں
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
