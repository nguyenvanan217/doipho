import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSemesters, getSchoolYears } from '../lib/db';

export default function Semesters() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    schoolYearId: 0,
    name: '',
    startDate: '',
    endDate: '',
    isActive: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSemesters(getSemesters());
    const years = getSchoolYears();
    setSchoolYears(years);
    
    // Set default schoolYearId to the first active one, or just the first one
    if (years.length > 0 && formData.schoolYearId === 0) {
      const activeYear = years.find((y: any) => y.isActive === 1) || years[0];
      setFormData(prev => ({ ...prev, schoolYearId: activeYear.id }));
    }
  };

  const handleOpenModal = (semester: any = null) => {
    if (semester) {
      setEditingSemester(semester);
      setFormData(semester);
    } else {
      setEditingSemester(null);
      const activeYear = schoolYears.find(y => y.isActive === 1) || schoolYears[0];
      setFormData({ 
        schoolYearId: activeYear ? activeYear.id : 0, 
        name: '', 
        startDate: '', 
        endDate: '', 
        isActive: 1 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
        return;
      }
    }

    if (!formData.schoolYearId) {
      toast.error('Vui lòng chọn Năm học!');
      return;
    }

    const currentSemesters = getSemesters();
    
    if (editingSemester) {
      const updatedSemesters = currentSemesters.map((s: any) => 
        s.id === editingSemester.id ? { ...s, ...formData } : s
      );
      localStorage.setItem('semesters', JSON.stringify(updatedSemesters));
      toast.success('Cập nhật học kỳ thành công');
    } else {
      const newId = currentSemesters.length > 0 ? Math.max(...currentSemesters.map((s: any) => s.id)) + 1 : 1;
      const newSemester = {
        ...formData,
        id: newId
      };
      localStorage.setItem('semesters', JSON.stringify([...currentSemesters, newSemester]));
      toast.success('Thêm mới học kỳ thành công');
    }
    
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) {
      const currentSemesters = getSemesters();
      const filteredSemesters = currentSemesters.filter((s: any) => s.id !== id);
      localStorage.setItem('semesters', JSON.stringify(filteredSemesters));
      loadData();
      toast.success('Xóa học kỳ thành công');
    }
  };

  const filteredSemesters = semesters.filter(semester => 
    semester.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSchoolYearName = (id: number) => {
    const year = schoolYears.find(y => y.id === id);
    return year ? year.yearName : 'Không xác định';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Quản lý học kỳ</h1>
          <p className="text-sm text-black dark:text-white mt-1">Quản lý danh sách học kỳ theo năm học.</p>
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
              placeholder="Tìm kiếm học kỳ..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Năm học</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Tên học kỳ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Ngày bắt đầu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Ngày kết thúc</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredSemesters.length > 0 ? (
                filteredSemesters.map((semester) => (
                  <tr key={semester.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{semester.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black dark:text-white">{getSchoolYearName(semester.schoolYearId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black dark:text-white">{semester.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {semester.startDate ? new Date(semester.startDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {semester.endDate ? new Date(semester.endDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Number(semester.isActive) === 1 ? (
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
                          onClick={() => handleOpenModal(semester)}
                          className="p-1.5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(semester.id)}
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
                      <p>Không tìm thấy học kỳ nào</p>
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
                {editingSemester ? 'Cập nhật Học kỳ' : 'Thêm Học kỳ mới'}
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Tên học kỳ</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Học kỳ 1"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Ngày kết thúc</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
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
                  {editingSemester ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
