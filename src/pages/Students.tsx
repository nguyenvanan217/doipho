import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getStudents, getClasses } from '../lib/db';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    classId: 0,
    gender: 'Nam',
    birthday: '',
    ethnicity: 'Kinh',
    contactPhone: '',
    status: 'Đang học'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStudents(getStudents());
    const clsList = getClasses();
    setClasses(clsList);
    
    if (clsList.length > 0 && formData.classId === 0) {
      setFormData(prev => ({ ...prev, classId: clsList[0].id }));
    }
  };

  const handleOpenModal = (student: any = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData(student);
    } else {
      setEditingStudent(null);
      setFormData({ 
        name: '', 
        classId: classes.length > 0 ? classes[0].id : 0, 
        gender: 'Nam', 
        birthday: '',
        ethnicity: 'Kinh',
        contactPhone: '',
        status: 'Đang học' 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId) {
      toast.error('Vui lòng chọn Lớp học!');
      return;
    }

    const currentStudents = getStudents();
    
    if (editingStudent) {
      const updatedStudents = currentStudents.map((s: any) => 
        s.id === editingStudent.id ? { ...s, ...formData } : s
      );
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      toast.success('Cập nhật hồ sơ học sinh thành công');
    } else {
      const newId = currentStudents.length > 0 ? Math.max(...currentStudents.map((s: any) => s.id)) + 1 : 1;
      const newStudent = {
        ...formData,
        id: newId
      };
      localStorage.setItem('students', JSON.stringify([...currentStudents, newStudent]));
      toast.success('Thêm mới học sinh thành công');
    }
    
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ học sinh này?')) {
      const currentStudents = getStudents();
      const filteredStudents = currentStudents.filter((s: any) => s.id !== id);
      localStorage.setItem('students', JSON.stringify(filteredStudents));
      loadData();
      toast.success('Xóa học sinh thành công');
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass, filterStatus]);

  const filteredStudents = students.filter(student => {
    const matchName = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'all' || Number(student.classId) === Number(filterClass);
    const matchStatus = filterStatus === 'all' || student.status === filterStatus;
    return matchName && matchClass && matchStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getClassName = (id: any) => {
    const cls = classes.find(c => Number(c.id) === Number(id));
    return cls ? cls.name : 'Chưa xếp lớp';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Danh sách Học sinh</h1>
          <p className="text-sm text-black dark:text-white mt-1">Quản lý toàn diện hồ sơ học sinh, hỗ trợ bộ lọc và tra cứu nhanh.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} className="mr-2" />
          Thêm mới
        </button>
      </div>

      {/* Filters and Table Card */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            
            <div className="flex-1 w-full relative">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tìm kiếm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Nhập tên học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <Filter size={12} /> Lớp học
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white sm:text-sm"
              >
                <option value="all">Tất cả các lớp</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <Filter size={12} /> Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white sm:text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Đang học">Đang học</option>
                <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                <option value="Chuyển trường">Chuyển trường</option>
                <option value="Đình chỉ">Đình chỉ</option>
              </select>
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hồ sơ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Lớp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Ngày sinh</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Liên hệ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    
                    {/* Hồ sơ */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-black dark:text-white font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-black dark:text-white">{student.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {student.gender} • {student.ethnicity || 'Kinh'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 rounded-md border border-gray-200 dark:border-zinc-600">
                          {getClassName(student.classId)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {student.birthday ? new Date(student.birthday).toLocaleDateString('vi-VN') : '--'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{student.contactPhone || '--'}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status === 'Đang học' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : student.status === 'Đã tốt nghiệp'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
                      }`}>
                        {student.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(student)}
                          className="p-1.5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
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
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-black dark:text-white font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={32} className="text-gray-400 dark:text-gray-500 mb-3" />
                      <p>Không tìm thấy hồ sơ học sinh nào phù hợp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Hiển thị <span className="font-bold text-black dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-bold text-black dark:text-white">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> trong tổng số <span className="font-bold text-black dark:text-white">{filteredStudents.length}</span> học sinh
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded-md text-sm font-medium text-black dark:text-white bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Trước
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-black dark:bg-white text-white dark:text-black' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded-md text-sm font-medium text-black dark:text-white bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cập nhật */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-black dark:border-white">
              <h3 className="text-lg font-bold text-black dark:text-white">
                {editingStudent ? 'Cập nhật Hồ sơ' : 'Thêm Học sinh mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Cột 1 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">Họ và Tên (*)</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">Lớp học (*)</label>
                      <select
                        required
                        value={formData.classId}
                        onChange={(e) => setFormData({...formData, classId: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                      >
                        <option value={0} disabled>-- Chọn lớp học --</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">Giới tính</label>
                      <div className="flex items-center space-x-4 pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer text-black dark:text-white">
                          <input type="radio" name="gender" value="Nam" checked={formData.gender === 'Nam'} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="accent-black dark:accent-white" />
                          <span>Nam</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer text-black dark:text-white">
                          <input type="radio" name="gender" value="Nữ" checked={formData.gender === 'Nữ'} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="accent-black dark:accent-white" />
                          <span>Nữ</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">Ngày sinh</label>
                      <input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-black dark:text-white">Dân tộc</label>
                        <input
                          type="text"
                          placeholder="VD: Kinh"
                          value={formData.ethnicity}
                          onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-black dark:text-white">Trạng thái</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                        >
                          <option value="Đang học">Đang học</option>
                          <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                          <option value="Chuyển trường">Chuyển trường</option>
                          <option value="Đình chỉ">Đình chỉ</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-black dark:text-white">Điện thoại liên hệ</label>
                      <input
                        type="text"
                        placeholder="Số điện thoại phụ huynh"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                      />
                    </div>
                  </div>
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
                  {editingStudent ? 'Lưu hồ sơ' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
