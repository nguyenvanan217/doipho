import React, { useState, useEffect } from 'react';
import { getClasses, getStudents } from '../lib/db';
import { Search, UserCircle2 } from 'lucide-react';

export default function Homeroom() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [homeroomClass, setHomeroomClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      const allClasses = getClasses();
      const hClass = allClasses.find((c: any) => Number(c.teacherId) === Number(user.id));
      
      if (hClass) {
        setHomeroomClass(hClass);
        const allStudents = getStudents();
        setStudents(allStudents.filter((s: any) => Number(s.classId) === Number(hClass.id)));
      }
    }
  }, []);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Lớp chủ nhiệm: {homeroomClass.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sĩ số: {students.length} học sinh</p>
        </div>
      </div>

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900 text-black dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Học sinh</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Giới tính</th>
                <th className="px-6 py-4 font-semibold w-40">Ngày sinh</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Dân tộc</th>
                <th className="px-6 py-4 font-semibold w-40">Liên hệ</th>
                <th className="px-6 py-4 font-semibold text-center w-36">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="font-medium text-black dark:text-white">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-600 dark:text-gray-300">{student.gender}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-300">{student.birthday || 'Chưa cập nhật'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-600 dark:text-gray-300">{student.ethnicity || 'Kinh'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-300">{student.contactPhone || 'Chưa cập nhật'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.status === 'Đang học' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : student.status === 'Đã tốt nghiệp'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {student.status || 'Đang học'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Không tìm thấy học sinh nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
