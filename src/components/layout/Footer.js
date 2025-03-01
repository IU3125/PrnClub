import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { darkMode } = useTheme();

  return (
    <footer className={`${darkMode ? 'bg-dark-900 border-dark-700' : 'bg-gray-100 border-gray-200'} border-t py-8`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-500">PRN</span>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Club</span>
            </Link>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              En kaliteli video içeriklerini sunan platform.
            </p>
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Kategoriler</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/?category=popular" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Popüler
                </Link>
              </li>
              <li>
                <Link to="/?category=trending" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Trend
                </Link>
              </li>
              <li>
                <Link to="/?category=newest" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  En Yeni
                </Link>
              </li>
              <li>
                <Link to="/?category=top-rated" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  En Çok Beğenilen
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/faq" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  SSS
                </Link>
              </li>
              <li>
                <Link to="/dmca" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  DMCA
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Yasal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/cookies" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link to="/2257" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  2257 Beyanı
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`mt-8 pt-6 ${darkMode ? 'border-dark-700' : 'border-gray-200'} border-t text-center`}>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            &copy; {currentYear} PRN Club. Tüm hakları saklıdır.
          </p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm mt-2`}>
            Bu sitedeki tüm videolar iframe kodları ile eklenmiştir ve üçüncü taraf sitelerden alınmaktadır.
            Telif hakkı ihlali bildirimi için lütfen iletişime geçin.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 