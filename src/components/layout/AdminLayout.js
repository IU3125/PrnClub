import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon,
  UsersIcon,
  FilmIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout, userRole } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (sidebarOpen && 
          window.innerWidth < 1024 &&
          sidebar && 
          !sidebar.contains(event.target) && 
          toggleButton && 
          !toggleButton.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isAdAdmin = userRole === 'ad_admin';
  const isFullAdmin = userRole === 'admin';

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon, access: true },
    { name: 'Users', path: '/admin/users', icon: UsersIcon, access: isFullAdmin },
    { name: 'Videos', path: '/admin/videos', icon: FilmIcon, access: isFullAdmin },
    { name: 'Comments', path: '/admin/comments', icon: ChatBubbleLeftRightIcon, access: isFullAdmin },
    { name: 'Advertisements', path: '/admin/advertisements', icon: CurrencyDollarIcon, access: true },
    { name: 'Profile', path: '/admin/profile', icon: UserCircleIcon, access: true },
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#0c1e4a]' : 'bg-gray-100'} overflow-hidden`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 ${darkMode ? 'bg-[#0c1e4a]' : 'bg-white'} transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 w-64 sm:w-72' : 'translate-x-0 w-0 lg:w-20'
        } lg:static lg:min-h-screen overflow-hidden`}
      >
        {/* Top blue line */}
        <div className="h-1 bg-blue-500"></div>
        
        {/* Logo Area with close button for mobile and toggle button for all screens */}
        <div className={`flex items-center justify-between h-16 ${darkMode ? 'bg-[#0c1e4a] border-[#1a2c5c]' : 'bg-white border-gray-200'} border-b px-4`}>
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
                <img src="/images/guzel-removebg-preview.png" alt="Prnclub Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>Prnclub</h1>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md flex items-center justify-center mx-auto overflow-hidden">
              <img src="/images/guzel-removebg-preview.png" alt="Prnclub Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            {/* Theme toggle button */}
            <button 
              className={`p-1 rounded-md ${darkMode ? 'text-white hover:bg-[#132456]' : 'text-gray-700 hover:bg-gray-200'}`}
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Toggle button for all screen sizes */}
            <button 
              className={`p-1 rounded-md ${darkMode ? 'text-white hover:bg-[#132456]' : 'text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <ChevronLeftIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Close button only for mobile */}
            <button 
              className={`lg:hidden p-1 rounded-md ${darkMode ? 'text-white hover:bg-[#132456]' : 'text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 px-2 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md relative ${
                    isActive 
                      ? `text-white ${darkMode ? 'bg-[#132456]' : 'bg-blue-600'}`
                      : `${darkMode ? 'text-gray-300 hover:bg-[#132456] hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`
                  } ${!item.access ? 'opacity-50 cursor-not-allowed' : ''}`
                }
                onClick={(e) => !item.access && e.preventDefault()}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.name}</span>}
                  </>
                )}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-4 py-3 mt-8 text-sm font-medium rounded-md ${
                darkMode 
                  ? 'text-gray-300 hover:bg-[#132456] hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Logout</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-x-hidden">
        {/* Top header for mobile only */}
        <header className={`sticky top-0 z-10 flex items-center justify-between h-16 ${
          darkMode ? 'bg-[#0c1e4a] border-[#1a2c5c]' : 'bg-white border-gray-200'
        } border-b px-4`}>
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            } lg:hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-md`}
          >
            <span className="sr-only">Menüyü Aç/Kapat</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="w-6"></div> {/* Empty div for flex alignment */}
        </header>

        {/* Page content */}
        <main className={`flex-1 p-4 sm:p-6 overflow-y-auto ${
          darkMode ? 'bg-[#0c1e4a]' : 'bg-gray-100'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 