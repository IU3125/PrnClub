import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import AdContainer from '../advertisements/AdContainer';

const ClientLayout = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-dark-800' : 'bg-gray-100'}`}>
      <Header />
      
      {/* Top Banner Ad */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center">
          <AdContainer position="header_bottom" className="w-full max-w-3xl" />
        </div>
      </div>
      
      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Left Side Ad - Fixed Position */}
        <div className="hidden xl:block">
          <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-10">
            <AdContainer position="left" />
          </div>
        </div>
        
        {/* Main Content */}
        <main className={`flex-grow container mx-auto px-4 py-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Outlet />
        </main>
        
        {/* Right Side Ad - Fixed Position */}
        <div className="hidden xl:block">
          <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-10">
            <AdContainer position="right" />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ClientLayout; 