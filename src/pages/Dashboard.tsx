import React, { useEffect, useState } from 'react';
import { getStudents, getClasses, getUsers } from '../lib/db';
import { Users, BookOpen, GraduationCap, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    studentsCount: 0,
    classesCount: 0,
    teachersCount: 0
  });

  const [genderData, setGenderData] = useState<any[]>([]);
  const [classData, setClassData] = useState<any[]>([]);

  useEffect(() => {
    const students = getStudents();
    const classes = getClasses();
    const users = getUsers();

    setStats({
      studentsCount: students.length,
      classesCount: classes.length,
      teachersCount: users.filter((u: any) => u.role === 'Teacher').length
    });

    // Tính toán dữ liệu Giới tính
    const males = students.filter((s: any) => s.gender === 'Nam').length;
    const females = students.filter((s: any) => s.gender === 'Nữ').length;
    setGenderData([
      { name: 'Nam', value: males },
      { name: 'Nữ', value: females }
    ]);

    // Tính toán dữ liệu Lớp học
    const classCountObj: any = {};
    students.forEach((s: any) => {
      if (s.class) {
        classCountObj[s.class] = (classCountObj[s.class] || 0) + 1;
      }
    });
    
    const formattedClassData = Object.keys(classCountObj).map(className => ({
      name: className,
      total: classCountObj[className]
    }));
    setClassData(formattedClassData);

  }, []);

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thống kê Tổng quan</h1>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng Học Sinh</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.studentsCount}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng Số Lớp</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.classesCount}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Giáo Viên Nhậm Chức</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.teachersCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biểu đồ Phân bổ Giới tính */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Phân bố Giới tính</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center"><span className="w-3 h-3 bg-[#0088FE] rounded-full mr-2"></span>Nam</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-[#FF8042] rounded-full mr-2"></span>Nữ</div>
          </div>
        </div>

        {/* Biểu đồ Học sinh theo lớp */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Số lượng Học sinh theo Lớp</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cảnh báo AI */}
      <div className="mt-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start space-x-3">
        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-bold text-red-800">Cảnh báo Học tập (Hệ thống AI đề xuất)</h3>
          <p className="text-red-600 text-sm mt-1">Phát hiện 2 học sinh có dấu hiệu sa sút môn Tiếng Anh và Toán trong tháng vừa qua. <a href="#" className="underline font-medium">Xem chi tiết</a>.</p>
        </div>
      </div>
    </div>
  );
}
