'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Student } from '@/types';
import WebcamCaptureModal from '@/components/WebcamCaptureModal';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  UserPlus,
  FileSpreadsheet,
  Download,
  Camera,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function StudentsPage() {
  const { user, t } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});
  const [savingStudent, setSavingStudent] = useState(false);

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number; errors: any[] } | null>(null);

  // Webcam modal
  const [webcamTargetStudent, setWebcamTargetStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.students) setStudents(data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudent(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save student');

      setShowModal(false);
      setEditingStudent({});
      fetchStudents();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportRows(data);
      } catch (err) {
        alert('فائل پڑھنے میں خرابی پیش آئی (Failed to read Excel/CSV file)');
      }
    };
    reader.readAsBinaryString(file);
  };

  const executeBulkImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    setImportSummary(null);

    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: importRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportSummary({
        added: data.added,
        updated: data.updated,
        errors: data.skippedErrors || [],
      });
      fetchStudents();
    } catch (err: any) {
      alert(`خرابی: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.reg_no.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.father_name.toLowerCase().includes(q) ||
      s.class_name.toLowerCase().includes(q) ||
      s.iqamat.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 urdu-compact">
              طلبہ کا مکمل ریکارڈ (Student Directory)
            </h1>
            <p className="text-xs text-slate-500">
              رجسٹریشن، اقامت، درجہ اور سرکاری لانڈری اہلیت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'Administrator' && (
            <>
              <button
                onClick={() => {
                  setImportRows([]);
                  setImportSummary(null);
                  setShowImportModal(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>ایکسل امپورٹ (Bulk Import)</span>
              </button>

              <button
                onClick={() => {
                  setEditingStudent({
                    reg_no: '',
                    name: '',
                    father_name: '',
                    class_name: 'درجہ اولیٰ',
                    section: 'A',
                    iqamat: '',
                    status: 'Active',
                    is_sarkari: false,
                  });
                  setShowModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
              >
                <UserPlus className="w-4 h-4" />
                <span>نیا طالب علم شامل کریں</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="رجسٹریشن نمبر، نام، والد کا نام، کلاس یا ہاسٹل سے تلاش کریں..."
            className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
        <div className="text-xs text-slate-500 font-semibold self-center px-2">
          کل طلبہ: {students.length}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b">
              <tr>
                <th className="p-3 text-center">تصویر</th>
                <th className="p-3">رجسٹریشن</th>
                <th className="p-3">طالب علم کا نام</th>
                <th className="p-3">ولدیت</th>
                <th className="p-3">درجہ / کلاس</th>
                <th className="p-3">اقامت / ہاسٹل</th>
                <th className="p-3">رابطہ فون</th>
                <th className="p-3 text-center">لانڈری کیٹیگری</th>
                <th className="p-3 text-center">حالت</th>
                {user?.role === 'Administrator' && <th className="p-3 text-center">ایکشن</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">لوڈ ہو رہا ہے...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500">کوئی طالب علم موجود نہیں ہے</td>
                </tr>
              ) : (
                filteredStudents.map(stu => (
                  <tr key={stu.id} className="hover:bg-slate-50/80">
                    <td className="p-2.5 text-center">
                      <div className="relative inline-block group">
                        {stu.photo_url ? (
                          <img src={stu.photo_url} alt={stu.name} className="w-9 h-9 rounded-full object-cover border mx-auto" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto">
                            {stu.name.charAt(0)}
                          </div>
                        )}
                        <button
                          onClick={() => setWebcamTargetStudent(stu)}
                          className="absolute -bottom-1 -right-1 bg-slate-800 text-white p-0.5 rounded-full hover:bg-emerald-600"
                          title="کیمرہ سے تصویر کھینچیں"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{stu.reg_no}</td>
                    <td className="p-3 font-bold text-slate-900 urdu-compact text-sm">{stu.name}</td>
                    <td className="p-3 font-semibold text-slate-700 urdu-compact">{stu.father_name}</td>
                    <td className="p-3 font-medium text-slate-800">
                      <div>{stu.class_name}</div>
                      {stu.section && <div className="text-[10px] text-slate-500">سیکشن: {stu.section}</div>}
                    </td>
                    <td className="p-3 text-slate-700 truncate max-w-[160px]">{stu.iqamat}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{stu.contact || '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        stu.is_sarkari ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {stu.is_sarkari ? 'سرکاری (مفت)' : 'پرائیویٹ'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        stu.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stu.status}
                      </span>
                    </td>
                    {user?.role === 'Administrator' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setEditingStudent(stu);
                            setShowModal(true);
                          }}
                          className="p-1 rounded text-slate-600 hover:text-emerald-600 hover:bg-slate-100"
                          title="ترمیم کریں"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-200 mb-4">
              {editingStudent.id ? 'طالب علم کے ریکارڈ میں ترمیم' : 'نیا طالب علم شامل کریں'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رجسٹریشن نمبر *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.reg_no || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, reg_no: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نام طالب علم *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ولدیت (Father Name) *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.father_name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, father_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">درجہ / کلاس *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.class_name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, class_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="مثلاً: درجہ ثانیہ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سیکشن</label>
                  <input
                    type="text"
                    value={editingStudent.section || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, section: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رابطہ فون نمبر</label>
                  <input
                    type="text"
                    value={editingStudent.contact || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, contact: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">اقامت / رہائش (Hostel & Room) *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.iqamat || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, iqamat: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="مثلاً: ہاسٹل خالد بن ولید، کمرہ 12 یا ڈے اسکالر"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حیثیت (Status)</label>
                  <select
                    value={editingStudent.status || 'Active'}
                    onChange={e => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="Active">Active (فعال)</option>
                    <option value="Left">Left (فارغ ہو گیا)</option>
                    <option value="Suspended">Suspended (معطل)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="sarkariCheck"
                    checked={!!editingStudent.is_sarkari}
                    onChange={e => setEditingStudent({ ...editingStudent, is_sarkari: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="sarkariCheck" className="font-bold text-slate-800">
                    سرکاری لانڈری کے اہل ہیں (Sarkari Free)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100"
                >
                  کینسل کریں
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow"
                >
                  {savingStudent ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal (STU-02, STU-04) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  ایکسل / سی ایس وی سے طلبہ کا بلک امپورٹ (Bulk Import)
                </h3>
              </div>
              <a
                href="/api/students/template"
                download
                className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>نمونہ ٹیمپلیٹ ڈاؤن لوڈ کریں</span>
              </a>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Excel (.xlsx, .xls) یا CSV فائل منتخب کریں۔ سسٹم رجسٹریشن نمبر کے مطابق موجودہ طلبہ کو اپ ڈیٹ کر دے گا اور نئے طلبہ کا اندراج کرے گا (STU-04)۔
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              {importRows.length > 0 && (
                <div className="mt-2 text-xs font-bold text-emerald-600">
                  ✓ {importRows.length} طلبہ کے ریکارڈ فائل میں موجود ہیں
                </div>
              )}
            </div>

            {importSummary && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border text-xs space-y-1">
                <div className="font-bold text-slate-800">امپورٹ کا نتیجہ:</div>
                <div className="text-emerald-700 font-semibold">✓ نئے شامل ہوئے: {importSummary.added}</div>
                <div className="text-blue-700 font-semibold">✓ اپ ڈیٹ ہوئے: {importSummary.updated}</div>
                {importSummary.errors.length > 0 && (
                  <div className="text-red-700">
                    ⚠ نظر انداز کیے گئے (خرابی کی وجہ سے): {importSummary.errors.length}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-slate-100"
              >
                بند کریں
              </button>
              <button
                disabled={importing || importRows.length === 0}
                onClick={executeBulkImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
              >
                {importing ? 'امپورٹ جاری ہے...' : 'امپورٹ شروع کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam modal */}
      {webcamTargetStudent && (
        <WebcamCaptureModal
          studentName={webcamTargetStudent.name}
          onCapture={(photo) => {
            fetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...webcamTargetStudent, photo_url: photo }),
            }).then(() => fetchStudents());
            setWebcamTargetStudent(null);
          }}
          onClose={() => setWebcamTargetStudent(null)}
        />
      )}
    </div>
  );
}
