import React, { useState, useEffect } from 'react';
import { User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers } from '../lib/db';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('account');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      const allUsers = getUsers();
      const freshUser = allUsers.find((u: any) => u.id === parsed.id) || parsed;
      setCurrentUser(freshUser);
      setFormData({
        fullName: freshUser.fullName || '',
        gender: freshUser.gender || 'male',
        phone: freshUser.phone || ''
      });
    }
  }, []);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = getUsers();
    const updatedUsers = allUsers.map((u: any) => {
      if (u.id === currentUser.id) {
        return { ...u, ...formData };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    const updatedUser = { ...currentUser, ...formData };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    toast.success('Cập nhật thông tin tài khoản thành công');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.currentPassword !== currentUser.password) {
      toast.error('Mật khẩu hiện tại không chính xác!');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    const allUsers = getUsers();
    const updatedUsers = allUsers.map((u: any) => {
      if (u.id === currentUser.id) {
        return { ...u, password: passwordData.newPassword };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    const updatedUser = { ...currentUser, password: passwordData.newPassword };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Đổi mật khẩu thành công!');
  };

  if (!currentUser) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 h-[calc(100vh-64px)] overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Cài đặt</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý cài đặt tài khoản và tùy chọn của bạn.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mt-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex shrink-0 md:flex-col gap-1 overflow-x-auto border-b md:border-b-0 md:border-r border-gray-200 dark:border-zinc-800 pb-2 md:pb-0 md:pr-4">
          <button
            onClick={() => setSelectedTab('account')}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedTab === 'account' 
                ? 'bg-gray-100 text-black dark:bg-zinc-800 dark:text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-white'
            }`}
          >
            <User size={18} />
            Tài khoản
          </button>
          <button
            onClick={() => setSelectedTab('password')}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedTab === 'password' 
                ? 'bg-gray-100 text-black dark:bg-zinc-800 dark:text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-white'
            }`}
          >
            <Shield size={18} />
            Mật khẩu
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
            {selectedTab === 'account' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
                  <h3 className="text-lg font-medium text-black dark:text-white">Tài khoản</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thay đổi thông tin tài khoản tại đây. Nhấn lưu khi bạn hoàn tất.</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSaveAccount}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white">Email</label>
                    <input 
                      type="email" 
                      value={currentUser.email} 
                      disabled 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white">Tên người dùng</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white">Giới tính</label>
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white">Số điện thoại</label>
                      <input 
                        type="tel" 
                        placeholder="Số điện thoại" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </form>
              </div>
            )}

            {selectedTab === 'password' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
                  <h3 className="text-lg font-medium text-black dark:text-white">Mật khẩu</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cập nhật mật khẩu để bảo vệ tài khoản của bạn.</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleChangePassword}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black dark:text-white">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      required
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Đổi mật khẩu
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
