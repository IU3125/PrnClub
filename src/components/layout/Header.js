import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MagnifyingGlassIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Logo from './Logo';
import FilterBar from '../ui/FilterBar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('newest');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePornstar, setActivePornstar] = useState('all');
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  
  // Featured count - now using userData instead of currentUser
  const featuredCount = userData?.featured?.length || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Arama sorgusunu küçük harfe çevirip URL'e ekle
      const query = searchQuery.trim().toLowerCase();
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error occurred during logout:', error);
    }
  };

  return (
    <header className="bg-gradient-to-b from-dark-900 to-dark-800">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos..."
                  className="w-full py-2.5 pl-4 pr-10 bg-dark-800/50 border-dark-600 text-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Hello User text */}
                <div className="flex items-center text-white">
                  <span className="mr-1">Hello</span>
                  <Link to="/profile" className="text-white hover:text-primary-400 ml-1">
                    {currentUser.displayName || 'User'}
                  </Link>
                </div>
                
                {/* Favorites count with heart icon */}
                <Link to="/favorites" className="flex items-center text-white hover:text-primary-400">
                  <span className="mr-1">Favorites</span>
                  <span className="mx-1">{featuredCount}</span>
                  <HeartIconSolid className="w-5 h-5 text-red-500" />
                </Link>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-dark">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-dark-700 rounded-xl shadow-lg p-4">
            {/* Search Bar - Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos..."
                  className="w-full py-2.5 pl-4 pr-10 bg-dark-800/50 border-dark-600 text-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* User Menu - Mobile */}
            <div className="flex flex-col space-y-2">
              {currentUser ? (
                <>
                  {/* Hello User text */}
                  <div className="flex items-center text-white py-2">
                    <span className="mr-1">Hello</span>
                    <span className="font-medium ml-1">{currentUser.displayName || 'User'}</span>
                  </div>
                  
                  {/* Featured link */}
                  <Link
                    to="/favorites"
                    className="flex items-center py-2 px-4 rounded-md text-white hover:bg-dark-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-1">Favorites</span>
                    <span className="mx-1">{featuredCount}</span>
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  </Link>
                  
                  {/* Profile link */}
                  <Link
                    to="/profile"
                    className="flex items-center py-2 px-4 rounded-md text-white hover:bg-dark-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  
                  {/* Logout button */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center py-2 px-4 rounded-md text-gray-300 hover:bg-dark-600"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="py-2 px-4 bg-dark-700 hover:bg-dark-600 text-white border border-dark-600 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar Integration */}
      <div className="border-t border-dark-700/50">
        <div className="container mx-auto px-4">
          <FilterBar
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activePornstar={activePornstar}
            setActivePornstar={setActivePornstar}
          />
        </div>
      </div>
    </header>
  );
};

export default Header; 