import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdDisplay from '../advertisements/AdDisplay';

const ClientLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#1a1b1f]">
      <Header />
      
      <div className="flex-grow">
        <div className="max-w-[1920px] mx-auto relative flex">
          {/* Sol reklam alanı */}
          <div className="hidden lg:block w-[200px] shrink-0">
            <div className="sticky top-[80px] w-[200px]">
              <AdDisplay position="left" />
            </div>
          </div>

          {/* Ana içerik */}
          <main className="flex-grow px-4">
            <Outlet />
          </main>

          {/* Sağ reklam alanı */}
          <div className="hidden lg:block w-[200px] shrink-0">
            <div className="sticky top-[80px] w-[200px]">
              <AdDisplay position="right" />
            </div>
          </div>
        </div>
      </div>

      
      
      <Footer />
    </div>
  );
};

export default ClientLayout; 