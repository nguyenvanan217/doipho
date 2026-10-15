import React, { useState, useEffect, useCallback } from 'react';
import { getClasses, getStudents, saveStudentEvaluation } from '../lib/db';
import { generateStudentEvaluation } from '../lib/ai';
import FormattedMarkdown from '../components/FormattedMarkdown';
import {
  Search, UserCircle2, Pencil, Check, X, Sparkles, AlertTriangle,
  ShieldCheck, TrendingUp, TrendingDown, BookOpen, ChevronDown, ChevronUp,
  BarChart3, Users, Award
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const computeRisk = (gpa: number | null | undefined): 'safe' | 'warning' | 'danger' | null => {
  if (gpa == null) return null; // catches both null and undefined
  if (gpa >= 6.5) return 'safe';
  if (gpa >= 5.0) return 'warning';
  return 'danger';
};

const RISK_META = {
  safe:    { label: 'An toàn',        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: ShieldCheck,    dot: 'bg-emerald-500' },
  warning: { label: 'Cần theo dõi',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',       icon: AlertTriangle,  dot: 'bg-amber-500'   },
  danger:  { label: 'Cảnh báo khẩn',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               icon: TrendingDown,   dot: 'bg-red-500'     },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
interface RiskBadgeProps { risk: 'safe' | 'warning' | 'danger' | null; gpa: number | null | undefined; }
function RiskBadge({ risk, gpa }: RiskBadgeProps) {
  if (!risk) return <span className="text-gray-400 dark:text-gray-500 text-xs italic">Chưa nhập</span>;
  const meta = RISK_META[risk];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <Icon size={12} />
      {gpa != null ? Number(gpa).toFixed(1) : '—'} · {meta.label}
    </span>
  );
}

// ─── Preset Labels ───────────────────────────────────────────────────────────
const POSITIVE_LABELS = [
  'Chăm chỉ học tập', 'Sáng tạo', 'Tích cực phát biểu', 'Hòa đồng với bạn bè',
  'Lễ phép với thầy cô', 'Tự giác học tập', 'Tinh thần đội nhóm tốt',
  'Có ý chí phấn đấu', 'Năng khiếu Nghệ thuật', 'Giỏi Thể thao',
  'Kỹ năng thuyết trình tốt', 'Cẩn thận, tỷ mỉ', 'Kết quả ổn định',
  'Biết giúp đỡ bạn bè', 'Nhanh nhẹn, linh hoạt',
];

const LIMITATION_LABELS = [
  'Hay mất tập trung', 'Chưa hoàn thành bài tập', 'Thường đi muộn',
  'ít tương tác trong giờ học', 'Kỹ năng nhóm yếu', 'Chưa tự giác',
  'Hay nói chuyện riêng trong giờ', 'Chữ viết cẩu thả', 'Kết quả không ổn định',
  'Thiếu tự tin khi phát biểu', 'Dễ nản lòng khi khó', 'Hạn chế kỹ năng đọc hiểu',
  'Chưa chú trọng môn cơ bản', 'Hay quên dụng cụ học tập',
];

// ─── Chip Selector ────────────────────────────────────────────────────────────
interface ChipSelectorProps {
  label: string;
  color: 'emerald' | 'rose';
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}
function ChipSelector({ label, color, options, selected, onChange }: ChipSelectorProps) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);

  const activeClass = color === 'emerald'
    ? 'bg-emerald-500 text-white border-emerald-500'
    : 'bg-rose-500 text-white border-rose-500';
  const inactiveClass = color === 'emerald'
    ? 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-emerald-400 hover:text-emerald-600'
    : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-rose-400 hover:text-rose-600';

  const dotColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-sm font-semibold text-black dark:text-white">{label}</span>
        {selected.length > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>{selected.length}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-150 ${
              selected.includes(opt) ? activeClass : inactiveClass
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Evaluation Modal ─────────────────────────────────────────────────────────
interface EvaluationModalProps {
  student: any;
  className: string;
  onClose: () => void;
}
function EvaluationModal({ student, className, onClose }: EvaluationModalProps) {
  const [evalText, setEvalText] = useState<string>(student.aiEvaluation || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [positives, setPositives] = useState<string[]>(student.positiveTraits || []);
  const [limitations, setLimitations] = useState<string[]>(student.limitationTraits || []);

  const handleGenerate = async () => {
    if (!student.gpa) { setError('Vui lòng nhập điểm trung bình trước!'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await generateStudentEvaluation({
        name: student.name,
        gender: student.gender,
        birthday: student.birthday,
        ethnicity: student.ethnicity,
        gpa: student.gpa,
        className,
        status: student.status,
        positiveTraits: positives,
        limitationTraits: limitations,
      });
      setEvalText(result);
      saveStudentEvaluation(student.id, {
        aiEvaluation: result,
        positiveTraits: positives,
        limitationTraits: limitations,
      } as any);
    } catch (e: any) {
      setError('Có lỗi khi gọi AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const risk = computeRisk(student.gpa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-black dark:text-white text-lg leading-tight">{student.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Lớp {className}</span>
                {risk && <RiskBadge risk={risk} gpa={student.gpa} />}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Trait Selectors */}
          <div className="px-6 pt-5 pb-4 space-y-4 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              Chọn các đặc điểm phù hợp — AI sẽ dựa vào đó viết nhận xét cá nhân hóa hơn.
            </p>
            <ChipSelector
              label="✨ Điểm tích cực"
              color="emerald"
              options={POSITIVE_LABELS}
              selected={positives}
              onChange={setPositives}
            />
            <ChipSelector
              label="⚠️ Hạn chế cần cải thiện"
              color="rose"
              options={LIMITATION_LABELS}
              selected={limitations}
              onChange={setLimitations}
            />
          </div>

          {/* AI Result */}
          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}
            {evalText ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <FormattedMarkdown content={evalText} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <Sparkles size={26} className="text-violet-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  Chọn đặc điểm bên trên rồi nhấn <strong>Tạo nhận xét</strong> để AI soạn nhận xét học bạ cho <strong>{student.name}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang soạn nhận xét...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {evalText ? '🔄 Tạo lại nhận xét' : '✨ Tạo nhận xét'}
              </>
            )}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors font-medium">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Homeroom() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [homeroomClass, setHomeroomClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editGpa, setEditGpa] = useState('');
  const [evalStudent, setEvalStudent] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const loadStudents = useCallback(() => {
    const allClasses = getClasses();
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const hClass = allClasses.find((c: any) => Number(c.teacherId) === Number(user.id));
    if (!hClass) return;
    setHomeroomClass(hClass);
    const allStudents = getStudents();
    setStudents(allStudents.filter((s: any) => Number(s.classId) === Number(hClass.id)));
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    loadStudents();
  }, [loadStudents]);

  if (!currentUser) return null;

  if (!homeroomClass) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 h-[calc(100vh-64px)] flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle2 size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-black dark:text-white mb-2">Bạn chưa được phân công lớp chủ nhiệm</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Vui lòng liên hệ Admin để được phân công lớp chủ nhiệm.
          </p>
        </div>
      </div>
    );
  }

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Stats
  const withGpa = students.filter(s => s.gpa !== null);
  const avgGpa = withGpa.length > 0 ? (withGpa.reduce((sum, s) => sum + s.gpa, 0) / withGpa.length) : null;
  const safeCount = students.filter(s => computeRisk(s.gpa) === 'safe').length;
  const warnCount = students.filter(s => computeRisk(s.gpa) === 'warning').length;
  const dangerCount = students.filter(s => computeRisk(s.gpa) === 'danger').length;
  const evalCount = students.filter(s => s.aiEvaluation).length;

  const startEdit = (student: any) => {
    setEditingId(student.id);
    setEditGpa(student.gpa !== null ? String(student.gpa) : '');
  };

  const confirmEdit = (student: any) => {
    const val = parseFloat(editGpa);
    if (isNaN(val) || val < 0 || val > 10) {
      setEditingId(null);
      return;
    }
    const rounded = Math.round(val * 10) / 10;
    const risk = computeRisk(rounded);
    saveStudentEvaluation(student.id, { gpa: rounded, riskLevel: risk });
    loadStudents();
    setEditingId(null);
    // If there's an AI evaluation, clear it since GPA changed
    if (student.aiEvaluation) {
      saveStudentEvaluation(student.id, { gpa: rounded, riskLevel: risk, aiEvaluation: null });
      loadStudents();
    }
  };

  const cancelEdit = () => setEditingId(null);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEval = (student: any) => setEvalStudent(student);

  const closeEval = () => {
    setEvalStudent(null);
    loadStudents();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Lớp chủ nhiệm: <span className="text-violet-600 dark:text-violet-400">{homeroomClass.name}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sĩ số: {students.length} học sinh · Năm học 2026 - 2027</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <Users size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-black dark:text-white">{students.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Tổng học sinh</div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-black dark:text-white">{avgGpa !== null ? avgGpa.toFixed(1) : '—'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ĐTB lớp</div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-black dark:text-white">
              {dangerCount > 0 ? <span className="text-red-600 dark:text-red-400">{dangerCount}</span> : dangerCount} {warnCount > 0 && <span className="text-amber-500 text-lg">+{warnCount}</span>}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Cần chú ý / theo dõi</div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Award size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-black dark:text-white">{evalCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Đã có nhận xét AI</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-zinc-900 text-black dark:text-white text-sm"
            />
          </div>
          <div className="flex gap-2 text-xs">
            {dangerCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {dangerCount} cảnh báo khẩn
              </span>
            )}
            {warnCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {warnCount} cần theo dõi
              </span>
            )}
            {safeCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {safeCount} an toàn
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Học sinh</th>
                <th className="px-4 py-4 font-semibold text-center w-24">Giới tính</th>
                <th className="px-4 py-4 font-semibold w-36">Ngày sinh</th>
                <th className="px-4 py-4 font-semibold text-center w-28">Dân tộc</th>
                <th className="px-4 py-4 font-semibold w-36">Liên hệ</th>
                <th className="px-4 py-4 font-semibold text-center w-36">ĐTB / Cảnh báo</th>
                <th className="px-4 py-4 font-semibold text-center w-36">AI Nhận xét</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const risk = computeRisk(student.gpa);
                  const isEditing = editingId === student.id;
                  const isExpanded = expandedRows.has(student.id);
                  return (
                    <React.Fragment key={student.id}>
                      <tr className={`transition-colors ${
                        risk === 'danger' ? 'hover:bg-red-50/50 dark:hover:bg-red-900/10' :
                        risk === 'warning' ? 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10' :
                        'hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}>
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                              risk === 'danger' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                              risk === 'warning' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                              risk === 'safe' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
                              'bg-gradient-to-br from-gray-400 to-gray-600'
                            }`}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-black dark:text-white">{student.name}</div>
                              {risk === 'danger' && (
                                <div className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                                  <AlertTriangle size={10} /> Cần can thiệp ngay
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Gender */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-gray-600 dark:text-gray-300">{student.gender}</span>
                        </td>
                        {/* Birthday */}
                        <td className="px-4 py-4">
                          <span className="text-gray-600 dark:text-gray-300">{student.birthday || 'Chưa cập nhật'}</span>
                        </td>
                        {/* Ethnicity */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-gray-600 dark:text-gray-300">{student.ethnicity || 'Kinh'}</span>
                        </td>
                        {/* Phone */}
                        <td className="px-4 py-4">
                          <span className="text-gray-600 dark:text-gray-300">{student.contactPhone || 'Chưa cập nhật'}</span>
                        </td>

                        {/* GPA Edit */}
                        <td className="px-4 py-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min="0" max="10" step="0.1"
                                value={editGpa}
                                onChange={e => setEditGpa(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmEdit(student); if (e.key === 'Escape') cancelEdit(); }}
                                autoFocus
                                className="w-16 text-center border border-violet-400 rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-zinc-800 dark:text-white"
                              />
                              <button onClick={() => confirmEdit(student)} className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors" title="Lưu">
                                <Check size={16} />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Huỷ">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-center group">
                              <RiskBadge risk={risk} gpa={student.gpa} />
                              <button
                                onClick={() => startEdit(student)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-violet-600 transition-all"
                                title="Chỉnh sửa điểm"
                              >
                                <Pencil size={13} />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* AI Eval */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEval(student)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                student.aiEvaluation
                                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                                  : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-400'
                              }`}
                            >
                              <Sparkles size={12} />
                              {student.aiEvaluation ? 'Xem / Tạo lại' : 'Nhận xét AI'}
                            </button>
                            {student.aiEvaluation && (
                              <button
                                onClick={() => toggleRow(student.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title={isExpanded ? 'Thu gọn' : 'Xem nhanh'}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded AI evaluation preview */}
                      {isExpanded && student.aiEvaluation && (
                        <tr>
                          <td colSpan={7} className="px-6 pb-4 pt-0">
                            <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-violet-500" />
                                <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">Nhận xét AI - {student.name}</span>
                              </div>
                              <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                                <FormattedMarkdown content={student.aiEvaluation} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen size={32} className="text-gray-300" />
                      <span>Không tìm thấy học sinh nào</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Modal */}
      {evalStudent && (
        <EvaluationModal
          student={evalStudent}
          className={homeroomClass.name}
          onClose={closeEval}
        />
      )}
    </div>
  );
}
