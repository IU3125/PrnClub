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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  
  // Featured count - now using userData instead of currentUser
  const featuredCount = userData?.featured?.length || 0;

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
      console.error('Error occurred during logout:', error);
    }
  };

  return (
    <header className="bg-dark-700 shadow-md">
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
                  className="w-full py-2 pl-4 pr-10 bg-dark-800 border-dark-600 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
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
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
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
          <div className="md:hidden mt-4 bg-dark-700 rounded-md shadow-lg p-4">
            {/* Search Bar - Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos..."
                  className="w-full py-2 pl-4 pr-10 bg-dark-800 border-dark-600 text-white border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
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
    </header>
  );
};

export default Header; 