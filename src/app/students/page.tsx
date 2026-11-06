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
  X,
  UploadCloud,
} from 'lucide-react';

export default function StudentsPage() {
  const { user } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sarkari' | 'private'>('all');
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
      if (!res.ok) throw new Error(data.error || 'طالب علم محفوظ نہیں ہو سکا');

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
        alert('فائل پڑھنے میں خرابی پیش آئی');
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
    if (categoryFilter === 'sarkari' && !s.is_sarkari) return false;
    if (categoryFilter === 'private' && s.is_sarkari) return false;

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
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">طلبہ ڈائرکٹری (Students)</h1>
          <p className="text-[11px] text-slate-500">
            رجسٹرڈ طلبہ کی تفصیل، اقامت گاہ اور لانڈری اہلیت
          </p>
        </div>

        {user?.role === 'Administrator' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImportRows([]);
                setImportSummary(null);
                setShowImportModal(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ایکسل امپورٹ</span>
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>نیا طالب علم</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="رجسٹریشن نمبر، نام، ولدیت یا کلاس سے تلاش کریں..."
            className="w-full text-xs pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold self-start sm:self-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md transition ${categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            تمام ({students.length})
          </button>
          <button
            onClick={() => setCategoryFilter('sarkari')}
            className={`px-2.5 py-1 rounded-md transition ${categoryFilter === 'sarkari' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'}`}
          >
            سرکاری ({students.filter(s => s.is_sarkari).length})
          </button>
          <button
            onClick={() => setCategoryFilter('private')}
            className={`px-2.5 py-1 rounded-md transition ${categoryFilter === 'private' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'}`}
          >
            پرائیویٹ ({students.filter(s => !s.is_sarkari).length})
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5 text-center">تصویر</th>
                <th className="p-2.5">رجسٹریشن</th>
                <th className="p-2.5">نام طالب علم</th>
                <th className="p-2.5">ولدیت</th>
                <th className="p-2.5">درجہ / کلاس</th>
                <th className="p-2.5">اقامت / ہاسٹل</th>
                <th className="p-2.5">فون</th>
                <th className="p-2.5 text-center">لانڈری کیٹیگری</th>
                <th className="p-2.5 text-center">حالت</th>
                {user?.role === 'Administrator' && <th className="p-2.5 text-center">ایکشن</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">لوڈ ہو رہا ہے...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">کوئی ریکارڈ نہیں ملا</td>
                </tr>
              ) : (
                filteredStudents.map(stu => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-2 text-center">
                      <div className="relative inline-block">
                        {stu.photo_url ? (
                          <img src={stu.photo_url} alt={stu.name} className="w-7 h-7 rounded-full object-cover border mx-auto" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] mx-auto">
                            {stu.name ? stu.name.charAt(0) : 'ط'}
                          </div>
                        )}
                        <button
                          onClick={() => setWebcamTargetStudent(stu)}
                          className="absolute -bottom-1 -right-1 bg-slate-800 text-white p-0.5 rounded-full hover:bg-emerald-600"
                          title="تصویر لیں"
                        >
                          <Camera className="w-2 h-2" />
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{stu.reg_no}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{stu.name}</td>
                    <td className="p-2.5 text-slate-600">{stu.father_name}</td>
                    <td className="p-2.5 text-slate-700">
                      <div>{stu.class_name}</div>
                      {stu.section && <span className="text-[10px] text-slate-400">سیکشن: {stu.section}</span>}
                    </td>
                    <td className="p-2.5 text-slate-600 truncate max-w-[160px]">{stu.iqamat}</td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px]">{stu.contact || '-'}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                        stu.is_sarkari ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {stu.is_sarkari ? 'سرکاری' : 'پرائیویٹ'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                        stu.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {stu.status === 'Active' ? 'فعال' : stu.status}
                      </span>
                    </td>
                    {user?.role === 'Administrator' && (
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            setEditingStudent(stu);
                            setShowModal(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="ترمیم کریں"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                {editingStudent.id ? 'طالب علم کے کوائف میں ترمیم' : 'نیا طالب علم درج کریں'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">رجسٹریشن نمبر *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.reg_no || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, reg_no: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">نام طالب علم *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full p-2 border rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">ولدیت *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.father_name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, father_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">درجہ / کلاس *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.class_name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, class_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">اقامت / ہاسٹل و کمرہ *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.iqamat || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, iqamat: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 items-center">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">حیثیت (Status)</label>
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
                <div className="flex items-center gap-1.5 pt-4">
                  <input
                    type="checkbox"
                    id="sarkariCheck"
                    checked={!!editingStudent.is_sarkari}
                    onChange={e => setEditingStudent({ ...editingStudent, is_sarkari: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-600 rounded"
                  />
                  <label htmlFor="sarkariCheck" className="font-semibold text-slate-800">
                    سرکاری لانڈری کے اہل ہیں
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
                >
                  کینسل
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 shadow-sm"
                >
                  {savingStudent ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-4 border border-slate-200 text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-bold text-slate-900 text-sm">ایکسل سے طلبہ کا امپورٹ</span>
              <a
                href="/api/students/template"
                download
                className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3 h-3" />
                <span>ٹیمپلیٹ ڈاؤن لوڈ کریں</span>
              </a>
            </div>

            <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700"
              />
              {importRows.length > 0 && (
                <div className="mt-2 text-emerald-700 font-semibold">
                  ✓ {importRows.length} طلبہ کی فائل پڑھی گئی
                </div>
              )}
            </div>

            {importSummary && (
              <div className="p-2.5 bg-slate-50 rounded border text-[11px] space-y-1">
                <div>نئے شامل ہوئے: <strong className="text-emerald-700 font-mono">{importSummary.added}</strong></div>
                <div>اپ ڈیٹ ہوئے: <strong className="text-blue-700 font-mono">{importSummary.updated}</strong></div>
                {importSummary.errors.length > 0 && (
                  <div>خرابی: <strong className="text-rose-700 font-mono">{importSummary.errors.length}</strong></div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50"
              >
                بند کریں
              </button>
              <button
                disabled={importing || importRows.length === 0}
                onClick={executeBulkImport}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 disabled:opacity-50"
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
