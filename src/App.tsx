import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, FileText, CalendarDays, ClipboardList, Sun, Moon, CalendarCheck, Calendar, Kanban, User, UserCog, PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react';
import './lib/db'; // Initialize fake DB
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import UsersPage from './pages/Users';
import SchoolYear from './pages/SchoolYear';
import Subjects from './pages/Subjects';
import Semesters from './pages/Semesters';
import Classes from './pages/Classes';
import TeachingAssignments from './pages/TeachingAssignments';
import Homeroom from './pages/Homeroom';
import Assignments from './pages/Assignments';
import Profile from './pages/Profile';

const SidebarLink = ({ to, icon: Icon, label, isCollapsed }: { to: string, icon: any, label: string, isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      title={isCollapsed ? label : undefined}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium cursor-pointer ${isActive ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800/80'} ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon strokeWidth={isActive ? 2.5 : 2} size={18} className="text-black dark:text-white flex-shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const isAdmin = currentUser?.role === 'Admin';
  const isTeacher = currentUser?.role === 'Teacher';

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Thống kê Tổng quan';
      case '/users': return 'Quản lý Người dùng';
      case '/school-year': return 'Quản lý Năm học';
      case '/semesters': return 'Quản lý Học kỳ';
      case '/classes': return 'Quản lý Lớp học';
      case '/students': return 'Danh sách Học sinh';
      case '/subjects': return 'Quản lý Môn học';
      case '/kanban': return 'Phân công Giảng dạy';
      case '/homeroom': return 'Lớp Chủ nhiệm';
      case '/assignments': return 'Thông tin Giảng dạy';
      case '/profile': return 'Tài khoản của tôi';
      default: return 'Sổ Theo Dõi Học Tập Học Sinh';
    }
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] dark:bg-zinc-950 transition-colors duration-300 overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'md:w-[70px]' : 'md:w-[260px]'} w-[260px] bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-zinc-800 flex flex-col h-full transition-all duration-300`}>
        <div className="p-4 flex items-center mt-2 mb-2 justify-between h-12">
          <div className="flex items-center">
            <div className={`bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-black dark:text-white truncate">Everest school</span>
              </div>
            )}
          </div>
          {isMobileOpen && (
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>
        <nav className={`px-3 py-2 space-y-1 flex-1 overflow-y-auto ${(isCollapsed && !isMobileOpen) ? 'overflow-x-hidden' : ''}`}>
          
          {isAdmin && (
            <>
              <div className={`text-xs font-bold uppercase tracking-wider text-black dark:text-white mt-3 mb-2 ${(isCollapsed && !isMobileOpen) ? 'text-center' : 'px-2'}`}>
                {(isCollapsed && !isMobileOpen) ? '—' : 'Overview'}
              </div>
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/" icon={LayoutDashboard} label="Thống kê" />

              <div className={`text-xs font-bold uppercase tracking-wider text-black dark:text-white mt-5 mb-2 ${(isCollapsed && !isMobileOpen) ? 'text-center' : 'px-2'}`}>
                {(isCollapsed && !isMobileOpen) ? '—' : 'Quản lý'}
              </div>
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/users" icon={Users} label="Người dùng" />
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/school-year" icon={CalendarCheck} label="Năm học" />
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/semesters" icon={Calendar} label="Học kỳ" />
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/classes" icon={BookOpen} label="Lớp học" />
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/students" icon={Users} label="Danh sách học sinh" />
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/subjects" icon={FileText} label="Môn học" />
              <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/kanban" icon={Kanban} label="Phân công giảng dạy" />
            </>
          )}

          <div className={`text-xs font-bold uppercase tracking-wider text-black dark:text-white mt-5 mb-2 ${(isCollapsed && !isMobileOpen) ? 'text-center' : 'px-2'}`}>
            {(isCollapsed && !isMobileOpen) ? '—' : 'Giảng dạy'}
          </div>
          <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/homeroom" icon={User} label="Lớp chủ nhiệm" />
          <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/assignments" icon={ClipboardList} label="Thông tin giảng dạy" />

          <div className={`text-xs font-bold uppercase tracking-wider text-black dark:text-white mt-5 mb-2 ${(isCollapsed && !isMobileOpen) ? 'text-center' : 'px-2'}`}>
            {(isCollapsed && !isMobileOpen) ? '—' : 'Tài khoản'}
          </div>
          <SidebarLink isCollapsed={isCollapsed && !isMobileOpen} to="/profile" icon={UserCog} label="Tài khoản của tôi" />
          
        </nav>
        <div className="p-3">
          <button onClick={() => {
            localStorage.removeItem('currentUser');
            window.location.reload();
          }} className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 w-full transition-colors duration-200 cursor-pointer ${(isCollapsed && !isMobileOpen) ? 'justify-center' : ''}`}>
            <LogOut size={18} className="text-black dark:text-white flex-shrink-0" />
            {!(isCollapsed && !isMobileOpen) && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f9fafb] dark:bg-zinc-950">
        {/* Header */}
        <header className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800 h-16 flex items-center justify-between px-4 sm:px-6 z-0 transition-colors duration-300">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <div className="text-black dark:text-white font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2">
              <span className="font-bold hidden sm:inline">Dashboard</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-bold truncate max-w-[150px] sm:max-w-none">{getPageTitle(location.pathname)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button 
                onClick={(e) => {
                  const x = e.clientX;
                  const y = e.clientY;
                  document.documentElement.style.setProperty('--x', `${x}px`);
                  document.documentElement.style.setProperty('--y', `${y}px`);
                  
                  if (!document.startViewTransition) {
                    document.documentElement.classList.toggle('dark');
                    return;
                  }
                  document.startViewTransition(() => {
                    document.documentElement.classList.toggle('dark');
                  });
                }}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
             >
                <Moon className="hidden dark:block" size={20} />
                <Sun className="block dark:hidden" size={20} />
             </button>
             <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
               {currentUser?.fullName?.charAt(0) || 'A'}
             </div>
             <div className="text-sm hidden md:block">
               <p className="font-bold text-black dark:text-white">{currentUser?.fullName || 'Admin'}</p>
               <p className="text-xs text-black dark:text-white font-medium">{currentUser?.role === 'Admin' ? 'Quản trị viên' : 'Giáo viên'}</p>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};

function App() {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return <Login onLogin={(u) => {
      setUser(u);
      window.history.replaceState(null, '', u.role === 'Admin' ? '/' : '/homeroom');
    }} />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {user.role === 'Admin' ? (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/school-year" element={<SchoolYear />} />
              <Route path="/students" element={<Students />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/kanban" element={<TeachingAssignments />} />
              <Route path="/semesters" element={<Semesters />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/homeroom" replace />} />
              <Route path="/users" element={<Navigate to="/homeroom" replace />} />
              <Route path="/school-year" element={<Navigate to="/homeroom" replace />} />
              <Route path="/students" element={<Navigate to="/homeroom" replace />} />
              <Route path="/classes" element={<Navigate to="/homeroom" replace />} />
              <Route path="/subjects" element={<Navigate to="/homeroom" replace />} />
              <Route path="/kanban" element={<Navigate to="/homeroom" replace />} />
              <Route path="/semesters" element={<Navigate to="/homeroom" replace />} />
            </>
          )}
          
          <Route path="/homeroom" element={<Homeroom />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to={user.role === 'Admin' ? "/" : "/homeroom"} replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
