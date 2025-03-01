import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-white mb-6">Sayfa Bulunamadı</h2>
      <p className="text-gray-400 text-center max-w-md mb-8">
        Aradığınız sayfa mevcut değil veya kaldırılmış olabilir. 
        Lütfen ana sayfaya dönün veya başka bir sayfa deneyin.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
};

export default NotFound; 