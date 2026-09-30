import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getClasses, getSchoolYears, getUsers } from '../lib/db';

export default function Classes() {
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    schoolYearId: 0,
    teacherId: 0,
    grade: '10',
    isActive: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClasses(getClasses());
    
    const years = getSchoolYears();
    setSchoolYears(years);
    
    const users = getUsers();
    const onlyTeachers = users.filter((u: any) => u.role === 'Teacher' || u.role === 'Admin');
    setTeachers(onlyTeachers);

    if (years.length > 0 && formData.schoolYearId === 0) {
      const activeYear = years.find((y: any) => y.isActive === 1) || years[0];
      setFormData(prev => ({ ...prev, schoolYearId: activeYear.id }));
    }
  };

  const handleOpenModal = (cls: any = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData(cls);
    } else {
      setEditingClass(null);
      const activeYear = schoolYears.find(y => y.isActive === 1) || schoolYears[0];
      setFormData({ 
        name: '', 
        schoolYearId: activeYear ? activeYear.id : 0, 
        teacherId: 0, 
        grade: '10',
        isActive: 1 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.schoolYearId) {
      toast.error('Vui lòng chọn Năm học!');
      return;
    }
    if (!formData.teacherId) {
      toast.error('Vui lòng chọn Giáo viên chủ nhiệm!');
      return;
    }

    const currentClasses = getClasses();
    
    // Validate unique class name in the same school year
    const isDuplicate = currentClasses.some((c: any) => 
      c.name.toLowerCase() === formData.name.toLowerCase() && 
      c.schoolYearId === formData.schoolYearId && 
      (!editingClass || c.id !== editingClass.id)
    );

    if (isDuplicate) {
      toast.error('Tên lớp đã tồn tại trong năm học này!');
      return;
    }

    if (editingClass) {
      const updatedClasses = currentClasses.map((c: any) => 
        c.id === editingClass.id ? { ...c, ...formData } : c
      );
      localStorage.setItem('classes', JSON.stringify(updatedClasses));
      toast.success('Cập nhật lớp học thành công');
    } else {
      const newId = currentClasses.length > 0 ? Math.max(...currentClasses.map((c: any) => c.id)) + 1 : 1;
      const newClass = {
        ...formData,
        id: newId
      };
      localStorage.setItem('classes', JSON.stringify([...currentClasses, newClass]));
      toast.success('Thêm mới lớp học thành công');
    }
    
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      const currentClasses = getClasses();
      const filteredClasses = currentClasses.filter((c: any) => c.id !== id);
      localStorage.setItem('classes', JSON.stringify(filteredClasses));
      loadData();
      toast.success('Xóa lớp học thành công');
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSchoolYearName = (id: any) => {
    const year = schoolYears.find(y => Number(y.id) === Number(id));
    return year ? year.yearName : 'Không xác định';
  };

  const getTeacherName = (id: any) => {
    const teacher = teachers.find(t => Number(t.id) === Number(id));
    return teacher ? teacher.fullName : 'Chưa phân công';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Quản lý Lớp học</h1>
          <p className="text-sm text-black dark:text-white mt-1">Quản lý danh sách lớp học và giáo viên chủ nhiệm.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Thêm mới
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-black dark:text-white" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm lớp học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-black dark:border-white rounded-md leading-5 bg-transparent text-black dark:text-white placeholder-black dark:placeholder-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white sm:text-sm transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Tên lớp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Khối</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Năm học</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">GV Chủ nhiệm</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{cls.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black dark:text-white">{cls.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">Khối {cls.grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{getSchoolYearName(cls.schoolYearId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{getTeacherName(cls.teacherId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Number(cls.isActive) === 1 ? (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300">
                          Không hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(cls)}
                          className="p-1.5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cls.id)}
                          className="p-1.5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-black dark:text-white font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={32} className="text-black dark:text-white mb-3" />
                      <p>Không tìm thấy lớp học nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-black dark:border-white">
              <h3 className="text-lg font-bold text-black dark:text-white">
                {editingClass ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Năm học</label>
                  <select
                    required
                    value={formData.schoolYearId}
                    onChange={(e) => setFormData({...formData, schoolYearId: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value={0} disabled>-- Chọn năm học --</option>
                    {schoolYears.map(year => (
                      <option key={year.id} value={year.id}>{year.yearName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">Tên lớp</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 10A1"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black dark:text-white">Khối</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                    >
                      <option value="10">Khối 10</option>
                      <option value="11">Khối 11</option>
                      <option value="12">Khối 12</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Giáo viên chủ nhiệm</label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({...formData, teacherId: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value={0} disabled>-- Chọn giáo viên --</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Trạng thái</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="p-5 border-t border-black dark:border-white flex justify-end space-x-3 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-md text-sm font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {editingClass ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
