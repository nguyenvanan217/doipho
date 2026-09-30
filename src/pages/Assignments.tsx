import React, { useState, useEffect } from 'react';
import { getAssignments, getClasses, getSubjects } from '../lib/db';
import { BookOpen, AlertCircle } from 'lucide-react';

export default function Assignments() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      setClasses(getClasses());
      setSubjects(getSubjects());
      
      const allAssignments = getAssignments();
      setMyAssignments(allAssignments.filter((a: any) => Number(a.teacherId) === Number(user.id)));
    }
  }, []);

  if (!currentUser) return null;

  const getClassName = (id: number) => classes.find(c => Number(c.id) === Number(id))?.name || 'Lớp không rõ';
  const getSubjectName = (id: number) => subjects.find(s => Number(s.id) === Number(id))?.name || 'Môn không rõ';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            Thông tin giảng dạy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Danh sách các lớp học và môn học bạn được phân công giảng dạy.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">STT</th>
                <th className="px-6 py-4 font-semibold w-1/4">Lớp học</th>
                <th className="px-6 py-4 font-semibold w-1/4">Môn học</th>
                <th className="px-6 py-4 font-semibold text-center">Thứ</th>
                <th className="px-6 py-4 font-semibold text-center">Tiết</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {myAssignments.length > 0 ? (
                myAssignments.map((assignment, index) => (
                  <tr key={assignment.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-black dark:text-white text-base">
                        {getClassName(assignment.classId)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                        <BookOpen size={16} className="mr-2 text-gray-400" />
                        {getSubjectName(assignment.subjectId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 text-sm font-bold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {assignment.dayOfWeek || 'Thứ ?'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 text-sm font-bold rounded-md bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-800">
                        {assignment.period || 'Tiết ?'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Đang dạy
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <AlertCircle size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">Bạn chưa được phân công giảng dạy môn nào.</p>
                      <p className="text-sm mt-1">Vui lòng liên hệ Admin hệ thống để được xếp lịch.</p>
                    </div>
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
