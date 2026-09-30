import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSubjects } from '../lib/db';

export default function Subjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = () => {
    setSubjects(getSubjects());
  };

  const handleOpenModal = (subject: any = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData(subject);
    } else {
      setEditingSubject(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSubjects = getSubjects();
    
    if (editingSubject) {
      const updatedSubjects = currentSubjects.map((s: any) => 
        s.id === editingSubject.id ? { ...s, ...formData } : s
      );
      localStorage.setItem('subjects', JSON.stringify(updatedSubjects));
      toast.success('Cập nhật môn học thành công');
    } else {
      const newId = currentSubjects.length > 0 ? Math.max(...currentSubjects.map((s: any) => s.id)) + 1 : 1;
      const newSubject = {
        ...formData,
        id: newId
      };
      localStorage.setItem('subjects', JSON.stringify([...currentSubjects, newSubject]));
      toast.success('Thêm mới môn học thành công');
    }
    
    loadSubjects();
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      const currentSubjects = getSubjects();
      const filteredSubjects = currentSubjects.filter((s: any) => s.id !== id);
      localStorage.setItem('subjects', JSON.stringify(filteredSubjects));
      loadSubjects();
      toast.success('Xóa môn học thành công');
    }
  };

  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Quản lý môn học</h1>
          <p className="text-sm text-black dark:text-white mt-1">Quản lý danh sách môn học trong hệ thống.</p>
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
              placeholder="Tìm kiếm môn học..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Tên môn học</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Mô tả</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#18181b] divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{subject.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-black dark:text-white">{subject.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black dark:text-white">{subject.description || 'Không có mô tả'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(subject)}
                          className="p-1.5 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(subject.id)}
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
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-black dark:text-white font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={32} className="text-black dark:text-white mb-3" />
                      <p>Không tìm thấy môn học nào</p>
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
                {editingSubject ? 'Cập nhật Môn học' : 'Thêm Môn học mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Tên môn học</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Toán học"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black dark:text-white">Mô tả</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả về môn học..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-transparent text-black dark:text-white resize-none"
                  />
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
                  {editingSubject ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
