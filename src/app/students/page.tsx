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
  Sparkles,
  Award,
  Building,
  Phone,
  ShieldCheck,
  Filter,
  X,
  UploadCloud,
} from 'lucide-react';

export default function StudentsPage() {
  const { user, t } = useApp();
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

  const sarkariCount = students.filter(s => s.is_sarkari).length;
  const privateCount = students.length - sarkariCount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Institutional Seminary Header Card */}
      <div className="bg-gradient-to-r from-jamia-950 via-jamia-900 to-jamia-850 rounded-3xl p-6 sm:p-8 text-white shadow-jamia relative overflow-hidden border border-emerald-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-jamia-800 border border-gold-400/30 flex items-center justify-center shadow-inner">
              <Users className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[11px] font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>جامعہ طلبہ ڈائرکٹری و کوائف</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white urdu-naskh">
                طلبہ کا مکمل ریکارڈ و رجسٹریشن (Student Directory)
              </h1>
              <p className="text-xs text-emerald-200/80 mt-1">
                سرکاری لانڈری اہلیت، اقامتی کوائف، کمرہ نمبر اور فوٹو تصدیق کا مرکزی اندراج
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user?.role === 'Administrator' && (
              <>
                <button
                  onClick={() => {
                    setImportRows([]);
                    setImportSummary(null);
                    setShowImportModal(true);
                  }}
                  className="bg-jamia-800 hover:bg-jamia-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 border border-emerald-700/60 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-gold-400" />
                  <span>ایکسل امپورٹ (Excel Import)</span>
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
                  className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>نیا طالب علم شامل کریں</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick KPI Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/50">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-emerald-200/70 block">کل رجسٹرڈ طلبہ</span>
            <span className="text-lg font-bold text-white font-mono">{students.length}</span>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-emerald-200/70 block">اہلِ سرکاری لانڈری (مفت)</span>
            <span className="text-lg font-bold text-gold-300 font-mono">{sarkariCount}</span>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-emerald-200/70 block">پرائیویٹ طلبہ</span>
            <span className="text-lg font-bold text-emerald-300 font-mono">{privateCount}</span>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-emerald-200/70 block">سرکاری اہلیت کی شرح</span>
            <span className="text-lg font-bold text-white font-mono">
              {students.length > 0 ? `${Math.round((sarkariCount / students.length) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-subtle border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="رجسٹریشن نمبر، نام طالب علم، والد کا نام، کلاس یا اقامت گاہ سے تلاش کریں..."
            className="w-full text-xs pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-jamia-600 focus:border-transparent font-medium transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              categoryFilter === 'all'
                ? 'bg-white text-jamia-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تمام ({students.length})
          </button>
          <button
            onClick={() => setCategoryFilter('sarkari')}
            className={`px-3 py-1.5 rounded-lg transition ${
              categoryFilter === 'sarkari'
                ? 'bg-jamia-900 text-gold-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سرکاری ({sarkariCount})
          </button>
          <button
            onClick={() => setCategoryFilter('private')}
            className={`px-3 py-1.5 rounded-lg transition ${
              categoryFilter === 'private'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            پرائیویٹ ({privateCount})
          </button>
        </div>
      </div>

      {/* Students Table / Directory */}
      <div className="bg-white rounded-3xl shadow-subtle border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 text-center">تصویر</th>
                <th className="p-3.5">رجسٹریشن نمبر</th>
                <th className="p-3.5">طالب علم کا نام</th>
                <th className="p-3.5">ولدیت</th>
                <th className="p-3.5">درجہ / کلاس</th>
                <th className="p-3.5">اقامت / ہاسٹل و کمرہ</th>
                <th className="p-3.5">رابطہ فون</th>
                <th className="p-3.5 text-center">لانڈری کیٹیگری</th>
                <th className="p-3.5 text-center">حالت</th>
                {user?.role === 'Administrator' && <th className="p-3.5 text-center">ایکشن</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-jamia-800 border-t-transparent mb-2"></div>
                    <p className="text-xs font-semibold">طلبہ کا ریکارڈ لوڈ کیا جا رہا ہے...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">کوئی ریکارڈ نہیں ملا</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">تلاش کے الفاظ بدل کر کوشش کریں یا نیا طالب علم رجسٹر کریں</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(stu => (
                  <tr key={stu.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="p-3 text-center">
                      <div className="relative inline-block">
                        {stu.photo_url ? (
                          <img
                            src={stu.photo_url}
                            alt={stu.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100 mx-auto shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jamia-100 to-emerald-200 text-jamia-900 border border-emerald-300/40 flex items-center justify-center font-bold text-xs mx-auto shadow-sm">
                            {stu.name ? stu.name.charAt(0) : 'ط'}
                          </div>
                        )}
                        <button
                          onClick={() => setWebcamTargetStudent(stu)}
                          className="absolute -bottom-1 -right-1 bg-jamia-900 text-gold-400 p-1 rounded-full hover:bg-gold-500 hover:text-jamia-950 shadow transition opacity-80 group-hover:opacity-100"
                          title="کیمرہ سے تصویر کھینچیں"
                        >
                          <Camera className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-jamia-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {stu.reg_no}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 urdu-compact text-sm">{stu.name}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 urdu-compact">{stu.father_name}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{stu.class_name}</div>
                      {stu.section && (
                        <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                          سیکشن: {stu.section}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 font-medium truncate max-w-[180px]">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{stu.iqamat}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {stu.contact ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{stu.contact}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        stu.is_sarkari
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stu.is_sarkari ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{stu.is_sarkari ? 'سرکاری (مفت)' : 'پرائیویٹ'}</span>
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        stu.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {stu.status === 'Active' ? 'فعال' : stu.status}
                      </span>
                    </td>
                    {user?.role === 'Administrator' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setEditingStudent(stu);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-jamia-900 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 urdu-compact">
                    {editingStudent.id ? 'طالب علم کے کوائف میں ترمیم' : 'نیا طالب علم رجسٹر کریں'}
                  </h3>
                  <p className="text-[10px] text-slate-500">جامعہ رجسٹریشن اور سرکاری لانڈری درجہ بندی</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رجسٹریشن نمبر *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.reg_no || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, reg_no: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="مثلاً: J-1024"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نام طالب علم *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="محمد عبداللہ"
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
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="حافظ عبدالرحمن"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">درجہ / کلاس *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.class_name || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, class_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
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
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رابطہ فون نمبر</label>
                  <input
                    type="text"
                    value={editingStudent.contact || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, contact: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                    placeholder="03001234567"
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
                  className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl urdu-compact focus:ring-2 focus:ring-jamia-600 focus:outline-none"
                  placeholder="مثلاً: ہاسٹل خالد بن ولید، کمرہ 12 یا ڈے اسکالر"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حیثیت (Status)</label>
                  <select
                    value={editingStudent.status || 'Active'}
                    onChange={e => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-jamia-600 focus:outline-none font-medium"
                  >
                    <option value="Active">Active (فعال طالب علم)</option>
                    <option value="Left">Left (فارغ التحصیل / خارج)</option>
                    <option value="Suspended">Suspended (معطل)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="sarkariCheck"
                    checked={!!editingStudent.is_sarkari}
                    onChange={e => setEditingStudent({ ...editingStudent, is_sarkari: e.target.checked })}
                    className="w-4 h-4 text-jamia-800 rounded border-slate-300 focus:ring-jamia-600"
                  />
                  <label htmlFor="sarkariCheck" className="font-bold text-slate-900 cursor-pointer">
                    سرکاری لانڈری کے اہل ہیں (مفت)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition"
                >
                  کینسل کریں
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="px-5 py-2 bg-jamia-900 hover:bg-jamia-800 text-gold-300 font-bold rounded-xl shadow transition"
                >
                  {savingStudent ? 'محفوظ ہو رہا ہے...' : 'ریکارڈ محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 urdu-compact">
                    ایکسل / سی ایس وی سے طلبہ کا بلک امپورٹ (Bulk Import)
                  </h3>
                  <p className="text-[10px] text-slate-500">سابقہ ریکارڈز کی خودکار تجدید اور نئے طلبہ کا اندراج</p>
                </div>
              </div>
              <a
                href="/api/students/template"
                download
                className="text-jamia-900 hover:text-jamia-800 text-xs font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
              >
                <Download className="w-3.5 h-3.5 text-gold-600" />
                <span>نمونہ ایکسل ٹیمپلیٹ</span>
              </a>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Excel (.xlsx, .xls) یا CSV فائل منتخب کریں۔ سسٹم رجسٹریشن نمبر کے مطابق موجودہ طلبہ کو خودکار طور پر اپ ڈیٹ کر دے گا اور نئے طلبہ کا اندراج کرے گا۔
            </p>

            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/20 rounded-2xl p-6 text-center mb-4 transition hover:bg-emerald-50/40">
              <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-jamia-900 file:text-gold-300 hover:file:bg-jamia-800 cursor-pointer"
              />
              {importRows.length > 0 && (
                <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-100 py-1.5 px-3 rounded-lg inline-block">
                  ✓ {importRows.length} طلبہ کے ریکارڈ کامیابی سے پڑھے گئے
                </div>
              )}
            </div>

            {importSummary && (
              <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">امپورٹ کا حتمی خلاصہ:</div>
                <div className="text-emerald-700 font-semibold">✓ نئے طلبہ شامل ہوئے: {importSummary.added}</div>
                <div className="text-blue-700 font-semibold">✓ سابقہ طلبہ اپ ڈیٹ ہوئے: {importSummary.updated}</div>
                {importSummary.errors.length > 0 && (
                  <div className="text-rose-700 font-medium">
                    ⚠ نظر انداز کیے گئے (خرابی کی وجہ سے): {importSummary.errors.length}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2.5 text-xs pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition"
              >
                بند کریں
              </button>
              <button
                disabled={importing || importRows.length === 0}
                onClick={executeBulkImport}
                className="px-5 py-2 bg-jamia-900 hover:bg-jamia-800 disabled:opacity-50 text-gold-300 font-bold rounded-xl shadow transition"
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
