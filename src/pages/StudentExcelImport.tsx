import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileText, 
  HelpCircle,
  Check,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { getStudents, getClasses, saveStudents, saveClasses } from '../lib/db';

interface ParsedStudent {
  rawRow: number;
  name: string;
  gender: string;
  birthday: string;
  ethnicity: string;
  contactPhone: string;
  className: string;
  classId?: number;
  status: string;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  rawDetails?: any;
}

export default function StudentExcelImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudent[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Helper: Format Excel serial date or string to YYYY-MM-DD
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const [d, m, y] = trimmed.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
    }
    return '';
  };

  // Helper: Normalize phone number
  const normalizePhone = (val: any): string => {
    if (!val) return '';
    let str = String(val).trim().replace(/\D/g, '');
    if (str.length === 9) {
      str = '0' + str;
    }
    return str;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Chỉ hỗ trợ file Excel (.xlsx, .xls)!');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file quá lớn (Tối đa 5MB)!');
      return;
    }

    setFile(selected);
    processExcelFile(selected);
  };

  const processExcelFile = (fileToProcess: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          toast.error('File Excel không có dữ liệu!');
          setIsProcessing(false);
          return;
        }

        const currentStudents = getStudents();
        const currentClasses = getClasses();

        const phonesInExcel = new Map<string, number>();
        const parsedList: ParsedStudent[] = [];

        rawJson.forEach((row, index) => {
          const rowIndex = index + 2; // Excel row index (row 1 is header)
          const errors: string[] = [];
          let isDuplicate = false;

          const name = String(row.fullName || row.name || row['Họ và tên'] || row['Họ tên'] || '').trim();
          const gender = String(row.gender || row['Giới tính'] || 'Nam').trim();
          const birthday = parseExcelDate(row.birthday || row['Ngày sinh']);
          const ethnicity = String(row.ethnicity || row['Dân tộc'] || 'Kinh').trim();
          const rawPhone = row.contactPhone || row.phone || row['Số điện thoại'] || row['SĐT'] || '';
          const phone = normalizePhone(rawPhone);
          const className = String(row.className || row['Lớp'] || row['Lớp học'] || '').trim();

          // 1. Validate Tên
          if (!name) {
            errors.push('Họ và tên học sinh không được để trống.');
          }

          // 2. Validate & Check trùng Số điện thoại
          if (!phone) {
            errors.push('Số điện thoại liên hệ không được để trống hoặc sai định dạng.');
          } else {
            // Check trùng trong Database hiện tại
            const dupInDB = currentStudents.find((s: any) => normalizePhone(s.contactPhone) === phone);
            if (dupInDB) {
              errors.push(`SĐT ${phone} đã tồn tại trong hệ thống (Học sinh: ${dupInDB.name}).`);
              isDuplicate = true;
            }

            // Check trùng ngay trong chính file Excel
            if (phonesInExcel.has(phone)) {
              const prevRow = phonesInExcel.get(phone);
              errors.push(`SĐT ${phone} bị trùng lặp với dòng ${prevRow} trong file.`);
              isDuplicate = true;
            } else {
              phonesInExcel.set(phone, rowIndex);
            }
          }

          // 3. Check trùng Họ tên + Ngày sinh trong Database
          if (name && birthday) {
            const dupNameAndBirth = currentStudents.find((s: any) => 
              s.name.toLowerCase().trim() === name.toLowerCase().trim() && 
              s.birthday === birthday
            );
            if (dupNameAndBirth) {
              errors.push(`Học sinh "${name}" (sinh ngày ${new Date(birthday).toLocaleDateString('vi-VN')}) đã tồn tại trong hệ thống.`);
              isDuplicate = true;
            }
          }

          // 4. Map lớp học
          let matchedClassId = currentClasses[0]?.id || 1;
          if (className) {
            const matched = currentClasses.find((c: any) => 
              c.name.toLowerCase().trim() === className.toLowerCase().trim()
            );
            if (matched) {
              matchedClassId = matched.id;
            }
          }

          parsedList.push({
            rawRow: rowIndex,
            name,
            gender: gender.toLowerCase() === 'nữ' ? 'Nữ' : 'Nam',
            birthday,
            ethnicity: ethnicity || 'Kinh',
            contactPhone: phone,
            className: className || (currentClasses[0]?.name || '10E1'),
            classId: matchedClassId,
            status: 'Đang học',
            isValid: errors.length === 0,
            errors,
            isDuplicate,
            rawDetails: row
          });
        });

        setParsedRows(parsedList);

        const dupCount = parsedList.filter(p => p.isDuplicate).length;
        const errCount = parsedList.filter(p => !p.isValid).length;

        if (errCount > 0) {
          toast.warning(`Đã đọc ${parsedList.length} dòng: phát hiện ${dupCount} học sinh trùng lặp, ${errCount - dupCount} dòng lỗi.`);
        } else {
          toast.success(`Đã đọc thành công ${parsedList.length} học sinh hợp lệ!`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Có lỗi xảy ra khi xử lý file Excel. Vui lòng kiểm tra lại định dạng!');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(fileToProcess);
  };

  const handleImportAll = () => {
    const errorRows = parsedRows.filter(p => !p.isValid);
    if (errorRows.length > 0) {
      setShowErrorModal(true);
      return;
    }
    executeSaveStudents(parsedRows);
  };

  const handleImportValidOnly = () => {
    const validRows = parsedRows.filter(p => p.isValid);
    if (validRows.length === 0) {
      toast.error('Không có học sinh nào hợp lệ để thêm!');
      return;
    }
    setShowErrorModal(false);
    executeSaveStudents(validRows);
  };

  const executeSaveStudents = (studentsToImport: ParsedStudent[]) => {
    const currentStudents = getStudents();
    const currentClasses = getClasses();
    let maxId = currentStudents.length > 0 ? Math.max(...currentStudents.map((s: any) => s.id)) : 0;

    // Check if any new classes need to be created automatically
    const updatedClasses = [...currentClasses];
    let maxClassId = updatedClasses.length > 0 ? Math.max(...updatedClasses.map((c: any) => c.id)) : 0;

    const newStudents = studentsToImport.map(item => {
      maxId += 1;
      let targetClassId = item.classId;

      // If class name does not exist in classes list, create it automatically!
      if (item.className) {
        let cls = updatedClasses.find(c => c.name.toLowerCase() === item.className.toLowerCase());
        if (!cls) {
          maxClassId += 1;
          const gradeMatch = item.className.match(/\d+/);
          const newClassObj = {
            id: maxClassId,
            name: item.className,
            grade: gradeMatch ? gradeMatch[0] : '10',
            schoolYearId: 2,
            teacherId: 2,
            isActive: 1
          };
          updatedClasses.push(newClassObj);
          targetClassId = maxClassId;
        } else {
          targetClassId = cls.id;
        }
      }

      return {
        id: maxId,
        name: item.name,
        classId: targetClassId,
        gender: item.gender,
        birthday: item.birthday || '2008-01-01',
        ethnicity: item.ethnicity,
        contactPhone: item.contactPhone,
        status: 'Đang học',
        ...item.rawDetails
      };
    });

    if (updatedClasses.length > currentClasses.length) {
      saveClasses(updatedClasses);
    }

    saveStudents([...currentStudents, ...newStudents]);
    toast.success(`🎉 Nhập thành công ${newStudents.length} học sinh vào hệ thống!`);
    
    // Redirect to students list
    setTimeout(() => {
      navigate('/students');
    }, 800);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;
  const errorCount = parsedRows.filter(r => !r.isValid && !r.isDuplicate).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link 
              to="/students" 
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-black dark:text-white transition-colors"
              title="Quay lại danh sách học sinh"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600 dark:text-emerald-500" size={26} />
              Nhập dữ liệu học sinh từ Excel
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            Hỗ trợ tải lên file Excel danh sách học sinh, tự động kiểm tra trùng lặp Số điện thoại và Hồ sơ học sinh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm font-medium text-black dark:text-white bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <HelpCircle size={16} className="mr-2 text-gray-500" />
            Hướng dẫn
          </button>
          <a
            href="/templates/student_template.xlsx"
            download="student_template.xlsx"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} className="mr-2" />
            Tải file mẫu
          </a>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center hover:border-black dark:hover:border-white transition-colors">
        <input
          type="file"
          id="excel-file-input"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <label 
          htmlFor="excel-file-input"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Upload size={28} />
          </div>
          <div>
            <span className="font-bold text-black dark:text-white hover:underline">
              Bấm vào đây để chọn file Excel
            </span>
            <span className="text-gray-500 dark:text-gray-400"> hoặc kéo thả file vào vùng này</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Hỗ trợ định dạng: .xlsx, .xls (Tối đa 5MB)
          </p>
        </label>

        {file && (
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 size={16} />
            Đã chọn: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      {/* Preview Section */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng số dòng đọc được</div>
              <div className="text-2xl font-bold text-black dark:text-white mt-1">{parsedRows.length}</div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Hợp lệ sẵn sàng nhập
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{validCount}</div>
            </div>

            <div className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/40 shadow-sm">
              <div className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle size={14} /> Bị trùng SĐT / Thông tin
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">{duplicateCount}</div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm">
              <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle size={14} /> Lỗi thiếu thông tin
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{errorCount}</div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {duplicateCount > 0 || errorCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Phát hiện {duplicateCount + errorCount} dòng có vấn đề. Bạn có thể nhấn để xem chi tiết hoặc chỉ nhập các dòng hợp lệ.
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✅ Tất cả {validCount} học sinh đều hợp lệ và sẵn sàng nhập vào hệ thống!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(duplicateCount > 0 || errorCount > 0) && (
                <button
                  onClick={() => setShowErrorModal(true)}
                  className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-sm font-semibold transition-colors cursor-pointer"
                >
                  Xem danh sách trùng / lỗi ({duplicateCount + errorCount})
                </button>
              )}

              <button
                onClick={handleImportAll}
                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer ml-auto sm:ml-0"
              >
                {duplicateCount > 0 ? 'Xử lý Import' : 'Xác nhận Import Tất cả'}
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 font-bold text-black dark:text-white text-sm">
              Xem trước dữ liệu ({parsedRows.length} học sinh)
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-800/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Dòng</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Họ và tên</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Giới tính</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ngày sinh</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Lớp</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Số điện thoại</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Trạng thái kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {parsedRows.map((item, idx) => (
                    <tr 
                      key={idx}
                      className={
                        !item.isValid 
                          ? 'bg-red-50/40 dark:bg-red-950/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                      }
                    >
                      <td className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                        #{item.rawRow}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-black dark:text-white">
                        {item.name || <span className="text-red-500 italic">Thiếu tên</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.gender}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.birthday ? new Date(item.birthday).toLocaleDateString('vi-VN') : '--'}
                      </td>
                      <td className="px-4 py-3 text-sm text-black dark:text-white font-medium">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs">
                          {item.className}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.contactPhone || <span className="text-red-500 italic">Trống</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                            <Check size={12} /> Hợp lệ
                          </span>
                        ) : item.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-semibold" title={item.errors.join(' | ')}>
                            <AlertTriangle size={12} /> Trùng lặp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold" title={item.errors.join(' | ')}>
                            <AlertCircle size={12} /> Lỗi dữ liệu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Báo cáo trùng lặp & lỗi */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowErrorModal(false)}></div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                  Cảnh báo trùng lặp & lỗi dữ liệu Excel
                </h3>
              </div>
              <button onClick={() => setShowErrorModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Hệ thống phát hiện <b>{parsedRows.filter(p => !p.isValid).length}</b> dòng bị lỗi hoặc đã tồn tại học sinh/SĐT này trong hệ thống:
              </p>

              <div className="border border-red-200 dark:border-red-900/50 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/30 space-y-3 max-h-72 overflow-y-auto">
                {parsedRows.filter(p => !p.isValid).map((row, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-red-600 dark:text-red-400">
                        ❌ Dòng {row.rawRow}: {row.name || 'Chưa có tên'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 font-normal">
                        Lớp: {row.className} • SĐT: {row.contactPhone || 'Trống'}
                      </span>
                    </div>
                    {row.errors.map((err, eIdx) => (
                      <div key={eIdx} className="text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-red-400 dark:border-red-600">
                        {err}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {validCount > 0 ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                  💡 <b>Gợi ý xử lý:</b> Bạn vẫn có <b>{validCount}</b> học sinh hoàn toàn hợp lệ. Bạn có thể chọn <b>"Chỉ nhập {validCount} học sinh hợp lệ"</b> (hệ thống sẽ tự động bỏ qua các dòng bị trùng), hoặc <b>"Hủy bỏ"</b> để sửa lại file Excel.
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ Tất cả các dòng trong file đều đã tồn tại trong hệ thống hoặc bị lỗi. Bạn cần chỉnh sửa lại dữ liệu trong file Excel trước khi nhập lại.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-black dark:text-white rounded-md text-sm font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hủy bỏ & Sửa file
              </button>

              {validCount > 0 && (
                <button
                  type="button"
                  onClick={handleImportValidOnly}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold transition-colors cursor-pointer"
                >
                  Chỉ nhập {validCount} học sinh hợp lệ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng dẫn */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGuideModal(false)}></div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <HelpCircle size={20} className="text-blue-500" />
                Hướng dẫn Nhập Excel
              </h3>
              <button onClick={() => setShowGuideModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <b className="text-black dark:text-white">Tải file mẫu:</b> Bấm nút <b>"Tải file mẫu"</b> ở góc trên để tải file cấu trúc chuẩn (.xlsx).
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <b className="text-black dark:text-white">Điền dữ liệu học sinh:</b> Cần có các cột bắt buộc: <code>fullName</code> (Họ tên), <code>contactPhone</code> (Số điện thoại), <code>birthday</code> (Ngày sinh), <code>className</code> (Lớp).
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <b className="text-black dark:text-white">Quy tắc chống trùng lặp:</b> Hệ thống sẽ tự động đối chiếu số điện thoại và tên học sinh. Nếu số điện thoại đã có người dùng khác đăng ký trong hệ thống, hệ thống sẽ cảnh báo chi tiết từng dòng.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  4
                </div>
                <div>
                  <b className="text-black dark:text-white">Xử lý linh hoạt:</b> Bạn có thể chọn nhập toàn bộ học sinh mới và tự động bỏ qua những học sinh đã bị trùng.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-bold cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
