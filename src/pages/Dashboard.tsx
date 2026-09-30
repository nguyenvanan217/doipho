import React, { useEffect, useState } from 'react';
import { getStudents, getClasses, getUsers } from '../lib/db';
import { Users, GraduationCap, AlertCircle, Calendar, TrendingUp, School } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    studentsCount: 0,
    classesCount: 0,
    teachersCount: 0,
    activeSchoolYear: '2024-2025'
  });

  const [genderData, setGenderData] = useState<any[]>([]);
  const [classData, setClassData] = useState<any[]>([]);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    if (stats.studentsCount > 0) {
      let current = 0;
      const target = stats.studentsCount;
      const duration = 1000;
      const stepTime = Math.max(10, Math.floor(duration / target));
      
      const timer = setInterval(() => {
        current += 1;
        setAnimatedTotal(prev => {
          if (prev >= target) {
            clearInterval(timer);
            return target;
          }
          return current;
        });
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [stats.studentsCount]);

  useEffect(() => {
    const students = getStudents();
    const classes = getClasses();
    const users = getUsers();

    setStats({
      studentsCount: students.length,
      classesCount: classes.length,
      teachersCount: users.filter((u: any) => u.role === 'Teacher').length,
      activeSchoolYear: '2024-2025'
    });

    const males = students.filter((s: any) => s.gender === 'Nam').length;
    const females = students.filter((s: any) => s.gender === 'Nữ').length;
    setGenderData([
      { name: 'Nam', value: males },
      { name: 'Nữ', value: females }
    ]);

    const classCountObj: any = {};
    students.forEach((s: any) => {
      const studentClass = classes.find((c: any) => c.id === s.classId);
      const className = studentClass ? studentClass.name : 'Chưa phân lớp';
      classCountObj[className] = (classCountObj[className] || 0) + 1;
    });
    
    const formattedClassData = Object.keys(classCountObj).map(className => ({
      name: className,
      total: classCountObj[className]
    }));
    setClassData(formattedClassData);

  }, []);

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
          Xin chào, Chào mừng trở lại 👋
        </h2>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        
        <div className="bg-white dark:bg-[#18181b] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Năm học hiện tại</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 tabular-nums">{stats.activeSchoolYear}</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700">
              <Calendar size={14} /> Đang hoạt động
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-gray-800 dark:text-gray-200 items-center">
              Năm học đang diễn ra <TrendingUp size={16} />
            </div>
            <div className="text-gray-500 dark:text-gray-400">Theo dõi tiến độ năm học</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số học sinh</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 tabular-nums">{stats.studentsCount}</h3>
            </div>
            <span className="inline-flex items-center gap-1 p-1.5 rounded-md bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-gray-800 dark:text-gray-200 items-center">
              Học sinh đang theo học
            </div>
            <div className="text-gray-500 dark:text-gray-400">Tổng số học sinh trong hệ thống</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số giáo viên</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 tabular-nums">{stats.teachersCount}</h3>
            </div>
            <span className="inline-flex items-center gap-1 p-1.5 rounded-md bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700">
              <GraduationCap size={16} />
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-gray-800 dark:text-gray-200 items-center">
              Giáo viên đang công tác
            </div>
            <div className="text-gray-500 dark:text-gray-400">Tổng số giáo viên trong trường</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lớp học đang hoạt động</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1 tabular-nums">{stats.classesCount}</h3>
            </div>
            <span className="inline-flex items-center gap-1 p-1.5 rounded-md bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700">
              <School size={16} />
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-sm">
            <div className="flex gap-2 font-medium text-gray-800 dark:text-gray-200 items-center">
              Lớp trong năm học hiện tại
            </div>
            <div className="text-gray-500 dark:text-gray-400">Số lớp đang hoạt động</div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        {/* Biểu đồ Học sinh theo lớp */}
        <div className="bg-white dark:bg-[#18181b] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 min-h-[450px] flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Số lượng Học sinh theo Lớp</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Phân bổ học sinh qua các lớp</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} />
                <Tooltip cursor={{fill: 'rgba(79, 70, 229, 0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Biểu đồ Phân bổ Giới tính */}
        <div className="bg-white dark:bg-[#18181b] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 min-h-[450px] flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Phân bố Giới tính</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tỷ lệ nam và nữ trong toàn trường</p>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-4xl font-bold text-gray-800 dark:text-white tabular-nums">{animatedTotal}</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Học sinh</span>
            </div>
          </div>
          <div className="flex justify-center space-x-6 pb-2">
            <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300"><span className="w-3 h-3 bg-[#0088FE] rounded-full mr-2"></span>Nam</div>
            <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300"><span className="w-3 h-3 bg-[#FF8042] rounded-full mr-2"></span>Nữ</div>
          </div>
        </div>

      </div>

      {/* Cảnh báo AI */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 flex flex-col space-y-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Cảnh báo hệ thống</h2>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-400">Cảnh báo Học tập (Hệ thống AI đề xuất)</h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">Phát hiện 2 học sinh có dấu hiệu sa sút môn Tiếng Anh và Toán trong tháng vừa qua. <a href="#" className="underline font-medium hover:text-red-700 dark:hover:text-red-200">Xem chi tiết</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
