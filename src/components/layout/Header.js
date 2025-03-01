import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  MagnifyingGlassIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <header className={`${darkMode ? 'bg-dark-700' : 'bg-white'} shadow-md`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-500">PRN</span>
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Club</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Video ara..."
                  className={`w-full py-2 pl-4 pr-10 ${
                    darkMode 
                      ? 'bg-dark-800 border-dark-600 text-white' 
                      : 'bg-gray-100 border-gray-300 text-gray-800'
                  } border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className={`absolute right-0 top-0 h-full px-3 ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-dark-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            
            {currentUser ? (
              <>
                <span className={darkMode ? 'text-white' : 'text-gray-800'}>Merhaba, {currentUser.displayName || 'Kullanıcı'}</span>
                <Link to="/profile" className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}>
                  <UserCircleIcon className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleLogout}
                  className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Giriş Yap
                </Link>
                <Link to="/register" className={`btn ${darkMode ? 'btn-dark' : 'btn-light'}`}>
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle Button - Mobile */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              } focus:outline-none`}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden mt-4 ${darkMode ? 'bg-dark-700' : 'bg-white'} rounded-md shadow-lg p-4`}>
            {/* Search Bar - Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Video ara..."
                  className={`w-full py-2 pl-4 pr-10 ${
                    darkMode 
                      ? 'bg-dark-800 border-dark-600 text-white' 
                      : 'bg-gray-100 border-gray-300 text-gray-800'
                  } border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className={`absolute right-0 top-0 h-full px-3 ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* User Menu - Mobile */}
            <div className="flex flex-col space-y-2">
              {currentUser ? (
                <>
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Merhaba, {currentUser.displayName || 'Kullanıcı'}</span>
                  <Link
                    to="/profile"
                    className={`flex items-center py-2 px-4 rounded-md ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-dark-600' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircleIcon className="w-5 h-5 mr-2" />
                    Profil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center py-2 px-4 rounded-md ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-dark-600' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/register"
                    className={`py-2 px-4 rounded-md ${
                      darkMode 
                        ? 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 