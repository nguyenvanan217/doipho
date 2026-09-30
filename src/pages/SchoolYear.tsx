import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSchoolYears } from '../lib/db';

export default function SchoolYear() {
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    yearName: '',
    startDate: '',
    endDate: '',
    isActive: 1
  });

  useEffect(() => {
    loadSchoolYears();
  }, []);

  const loadSchoolYears = () => {
    setSchoolYears(getSchoolYears());
  };

  const handleOpenModal = (year: any = null) => {
    if (year) {
      setEditingYear(year);
      setFormData(year);
    } else {
      setEditingYear(null);
      setFormData({ yearName: '', startDate: '', endDate: '', isActive: 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYear(null);
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

    const currentYears = getSchoolYears();
    
    if (editingYear) {
      const updatedYears = currentYears.map((y: any) => 
        y.id === editingYear.id ? { ...y, ...formData } : y
      );
      localStorage.setItem('schoolYears', JSON.stringify(updatedYears));
      toast.success('Cập nhật năm học thành công');
    } else {
      const newId = currentYears.length > 0 ? Math.max(...currentYears.map((y: any) => y.id)) + 1 : 1;
      const newYear = {
        ...formData,
        id: newId
      };
      localStorage.setItem('schoolYears', JSON.stringify([...currentYears, newYear]));
      toast.success('Thêm mới năm học thành công');
    }
    
    loadSchoolYears();
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa năm học này?')) {
      const currentYears = getSchoolYears();
      const filteredYears = currentYears.filter((y: any) => y.id !== id);
      localStorage.setItem('schoolYears', JSON.stringify(filteredYears));
      loadSchoolYears();
      toast.success('Xóa năm học thành công');
    }
  };

  const filteredYears = schoolYears.filter(year => 
    year.yearName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Quản lý năm học</h1>
          <p className="text-sm text-black dark:text-white mt-1">Quản lý thông tin năm học trong hệ thống.</p>
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
              placeholder="Tìm kiếm năm học..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Tên năm học</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Ngày bắt đầu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Ngày kết thúc</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredYears.length > 0 ? (
                filteredYears.map((year) => (
                  <tr key={year.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{year.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black dark:text-white">{year.yearName || 'Chưa có'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {year.startDate ? new Date(year.startDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">
                        {year.endDate ? new Date(year.endDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Number(year.isActive) === 1 ? (
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
                          onClick={() => handleOpenModal(year)}
                          className="p-1.5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(year.id)}
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
                      <AlertCircle size={32} className="text-black dark:text-white mb-3" />
                      <p>Không tìm thấy năm học nào</p>
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
                {editingYear ? 'Cập nhật Năm học' : 'Thêm Năm học mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Tên năm học</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 2025-2026"
                    value={formData.yearName}
                    onChange={(e) => setFormData({...formData, yearName: e.target.value})}
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
                  {editingYear ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
