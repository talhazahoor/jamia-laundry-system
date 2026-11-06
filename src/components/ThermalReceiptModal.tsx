'use client';

import React, { useEffect, useState } from 'react';
import { Receipt, SettingsMap } from '@/types';
import { Printer, X, Copy, QrCode } from 'lucide-react';
import { generateReceiptQRDataUrl } from '@/lib/thermal-printer';

interface ThermalReceiptModalProps {
  receipt: Receipt | null;
  settings: SettingsMap;
  onClose: () => void;
  isDuplicate?: boolean;
}

export default function ThermalReceiptModal({
  receipt,
  settings,
  onClose,
  isDuplicate = false,
}: ThermalReceiptModalProps) {
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'student' | 'laundry'>('student');

  useEffect(() => {
    if (receipt) {
      generateReceiptQRDataUrl(receipt.receipt_no).then(setQrCodeData);
    }
  }, [receipt]);

  if (!receipt) return null;

  const triggerDirectPrint = () => {
    window.print();
  };

  const isWidth58 = settings.paper_width === '58mm';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-900/20">
        {/* Modal Top Actions */}
        <div className="bg-gradient-to-r from-jamia-950 via-slate-900 to-emerald-950 text-white p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <Printer className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-sm font-nastaliq block leading-tight">
                پرنٹر رسید (Thermal Receipt)
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">
                {receipt.receipt_no}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerDirectPrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>پرنٹ (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Copy Selector */}
        {settings.print_copies === 2 && (
          <div className="bg-slate-100 border-b border-slate-200 p-2 flex justify-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 py-1 rounded font-medium ${
                activeTab === 'student' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border'
              }`}
            >
              طالب علم کی کاپی (Student Copy)
            </button>
            <button
              onClick={() => setActiveTab('laundry')}
              className={`px-3 py-1 rounded font-medium ${
                activeTab === 'laundry' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border'
              }`}
            >
              لانڈری بیگ ٹیگ (Bag Tag)
            </button>
          </div>
        )}

        {/* Receipt Container - This is targeted by @media print */}
        <div className="p-4 bg-slate-50 flex justify-center overflow-auto max-h-[75vh]">
          <div
            id="thermal-receipt"
            className={`thermal-receipt-printable bg-white p-4 shadow-sm border border-slate-300 font-mono text-black text-xs ${
              isWidth58 ? 'width-58mm max-w-[58mm]' : 'max-w-[80mm]'
            }`}
          >
            {/* DUPLICATE STAMP */}
            {(isDuplicate || receipt.reprint_count > 0 || receipt.is_duplicate) && (
              <div className="border-2 border-red-600 text-red-600 text-center font-bold py-1 mb-2 text-sm tracking-widest uppercase">
                *** مثنیٰ / DUPLICATE (Copy #{receipt.reprint_count || 1}) ***
              </div>
            )}

            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <div className="font-bold text-sm urdu-compact leading-tight">
                {settings.jamia_name}
              </div>
              <div className="font-bold text-xs uppercase tracking-wide">
                {settings.jamia_name_en}
              </div>
              <div className="text-[11px] font-semibold text-emerald-800">
                {settings.laundry_name}
              </div>
              <div className="text-[10px] text-slate-600">
                فون: {settings.phone}
              </div>
              <div className="text-[10px] text-slate-600">
                {settings.address}
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold text-sm">
                <span>رسید: {receipt.receipt_no}</span>
                <span className={`px-1.5 py-0.2 rounded text-white ${
                  receipt.type === 'Sarkari' ? 'bg-blue-700' : 'bg-amber-600'
                }`}>
                  {receipt.type === 'Sarkari' ? 'سرکاری (مفت)' : 'پرائیویٹ (بل)'}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-700">
                <span>تاریخ: {new Date(receipt.date_time).toLocaleDateString()}</span>
                <span>وقت: {new Date(receipt.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-[10px] text-slate-700">
                آپریٹر: {receipt.operator_name}
              </div>
            </div>

            {/* Student Info */}
            <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>رجسٹریشن: {receipt.student_reg_no}</span>
                <span>نام: {receipt.student_name}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>ولدیت: {receipt.father_name}</span>
                <span>کلاس: {receipt.class_name} ({receipt.section})</span>
              </div>
              <div className="text-[10px] truncate">
                رہائش: {receipt.iqamat}
              </div>
            </div>

            {/* Itemized List */}
            <div className="py-2 border-b border-dashed border-black">
              {receipt.type === 'Private' ? (
                <>
                  <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-300">
                    <span className="col-span-6">شے (Item)</span>
                    <span className="col-span-2 text-center">تعداد</span>
                    <span className="col-span-2 text-right">ریٹ</span>
                    <span className="col-span-2 text-right">رقم</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-[11px]">
                    {receipt.items?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 py-0.5 items-center">
                        <span className="col-span-6 font-semibold urdu-compact leading-none">
                          {item.item_name_ur} <span className="text-[9px] text-slate-500 font-normal">({item.item_name_en})</span>
                        </span>
                        <span className="col-span-2 text-center font-bold">{item.quantity}</span>
                        <span className="col-span-2 text-right text-[10px]">{item.rate_at_time}</span>
                        <span className="col-span-2 text-right font-medium">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-300">
                    <span className="col-span-9">شے (Item)</span>
                    <span className="col-span-3 text-center">تعداد (Qty)</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-[11px]">
                    {receipt.items?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 py-0.5 items-center">
                        <span className="col-span-9 font-semibold urdu-compact leading-none">
                          {item.item_name_ur} <span className="text-[9px] text-slate-500 font-normal">({item.item_name_en})</span>
                        </span>
                        <span className="col-span-3 text-center font-bold">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span>کل کپڑے (Pieces):</span>
                <span className="text-sm">{receipt.total_pieces} عدد</span>
              </div>

              {receipt.type === 'Private' && (
                <>
                  {receipt.discount > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>رعایت (Discount):</span>
                      <span>Rs {receipt.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm">
                    <span>کل بل (Total Bill):</span>
                    <span>Rs {receipt.total_amount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px] pt-1">
                    <span>ادائیگی (Status):</span>
                    <span className={`px-2 py-0.5 rounded ${
                      receipt.payment_status === 'Paid' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
                    }`}>
                      {receipt.payment_status === 'Paid' ? 'ادا شدہ (PAID)' : 'واجب الادا (UNPAID)'}
                    </span>
                  </div>
                </>
              )}

              {receipt.type === 'Sarkari' && (
                <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                  <span>چارجز:</span>
                  <span>مفت (سرکاری رجسٹریشن)</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] pt-1 font-semibold text-emerald-900">
                <span>متوقع واپسی تاریخ:</span>
                <span>{receipt.expected_date}</span>
              </div>

              {receipt.notes && (
                <div className="text-[10px] text-slate-600 italic pt-0.5">
                  نوٹ: {receipt.notes}
                </div>
              )}
            </div>

            {/* QR Code and Barcode */}
            {settings.print_barcode && (
              <div className="py-2 text-center border-b border-dashed border-black flex flex-col items-center">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="Receipt QR" className="w-24 h-24 mx-auto" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px]">
                    [ QR Code ]
                  </div>
                )}
                <div className="text-[10px] font-bold tracking-widest mt-1">
                  *{receipt.receipt_no}*
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-700 leading-tight">
              <div className="urdu-compact mb-1">{settings.receipt_footer}</div>
              <div>Please bring this slip when collecting clean clothes.</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono">
            کاغذ سائز: <span className="font-bold text-slate-800">{settings.paper_width}</span> | پرنٹر: <span className="font-bold text-slate-800">ESC-POS</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-300 font-semibold transition"
            >
              بند کریں (Close)
            </button>
            <button
              onClick={triggerDirectPrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition flex items-center gap-2 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>پرنٹ کریں (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
