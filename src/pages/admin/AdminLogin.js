import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInactiveAccount, setIsInactiveAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Always start with dark mode, but check if user has a saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return true; // Default to dark mode
  });
  
  // Save and apply theme change
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setIsInactiveAccount(false);
    
    try {
      // Login with Firebase Authentication
      const result = await adminLogin(data.email, data.password);
      
      // Redirect based on admin role
      if (result.role === 'admin' || result.role === 'ad_admin') {
        navigate('/admin/dashboard');
      } else {
        setError('This user does not have admin permissions.');
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      
      // Customize error messages
      if (error.message === 'This user does not have admin permissions.') {
        setError(error.message);
      } else if (error.message === 'Account is inactive. Please contact support.') {
        setIsInactiveAccount(true);
        setError('Your account has been deactivated. Please contact support for assistance.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No user found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-[#0c1226]' : 'bg-gray-100'}`}>
      {/* Left Side - Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center ${darkMode ? 'bg-[#0c1226]' : 'bg-white'} p-8`}>
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sign In</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enter your email and password to sign in</p>
          </div>
          
          {isInactiveAccount ? (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-6 flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Account Deactivated</p>
                <p className="text-sm">Your account has been deactivated. Please contact support for assistance.</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
              {error}
            </div>
          ) : null}
          
          <form onSubmit={handleSubmit(onSubmit)} className={darkMode ? '' : 'space-y-4'}>
            <div className="mb-6">
              <label htmlFor="email" className={`block text-sm mb-2 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>Email</label>
              <input
                id="email"
                type="email"
                className={`w-full rounded-md px-4 py-3 ${
                  darkMode 
                    ? 'bg-[#0c1226] border-gray-700 text-white focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-600 shadow-sm'
                } border focus:outline-none focus:ring-2 focus:border-transparent`}
                placeholder="mail@example.com"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className={`block text-sm mb-2 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-md px-4 py-3 ${
                    darkMode 
                      ? 'bg-[#0c1226] border-gray-700 text-white focus:ring-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-600 shadow-sm'
                  } border focus:outline-none focus:ring-2 focus:border-transparent`}
                  placeholder="Min. 6 characters"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="keepLoggedIn"
                  type="checkbox"
                  className={`h-4 w-4 rounded focus:ring-blue-500 ${
                    darkMode ? 'bg-[#0c1226] border-gray-700 text-blue-600' : 'bg-white border-gray-300 text-blue-600 shadow-sm'
                  }`}
                  checked={keepLoggedIn}
                  onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                />
                <label htmlFor="keepLoggedIn" className={`ml-2 block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Keep me logged in
                </label>
              </div>
              <div>
                <Link to="/admin/forgot-password" className={`text-sm ${darkMode ? 'text-blue-500 hover:text-blue-400' : 'text-blue-600 hover:text-blue-800'}`}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full text-white font-medium py-3 px-4 rounded-lg transition duration-200 ease-in-out ${
                darkMode 
                  ? 'bg-[#7e5bef] hover:bg-[#6a4dd3]' 
                  : 'bg-[#7e5bef] hover:bg-[#6a4dd3] shadow-md'
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          
        </div>
      </div>
      
      {/* Right Side - Logo and Gradient Background */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Rounded edge and gradient background */}
        <div className={`absolute inset-0 rounded-l-[5rem] ${
          darkMode 
            ? 'bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900' 
            : 'bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800'
        }`}></div>
        
        {/* Top pink-blue gradient effect */}
        <div className={`absolute top-0 left-0 right-0 h-40 rounded-bl-full ${
          darkMode
            ? 'bg-gradient-to-r from-purple-800 via-indigo-700 to-transparent opacity-70'
            : 'bg-gradient-to-r from-pink-300 via-purple-300 to-transparent opacity-50'
        }`}></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="z-10 text-center">
            {/* Logo */}
            <img 
              src="/images/guzel-removebg-preview.png" 
              alt="PrnClub Logo" 
              className="w-40 h-40 mx-auto mb-4"
            />
            {/* PrnClub text */}
            <h1 className="text-4xl font-bold text-white">PrnClub</h1>
          </div>
        </div>
        
        {/* Dark Mode Toggle */}
        <div className="absolute bottom-4 right-4">
          <button 
            onClick={toggleDarkMode}
            className="text-white bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
          >
            {darkMode ? (
              // Moon icon (dark mode active)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              // Sun icon (light mode active)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 