import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Footer from './Footer';

const ClientLayout = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-dark-800' : 'bg-gray-100'}`}>
      <Header />
      <main className={`flex-grow container mx-auto px-4 py-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ClientLayout; 