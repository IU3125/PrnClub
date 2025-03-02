import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import AdContainer from '../advertisements/AdContainer';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-800 py-8 mt-auto">
      {/* Top Banner Ad */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex justify-center">
          <AdContainer position="footer_top" className="w-full max-w-3xl" />
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        {/* Main Footer Content with Side Ads */}
        <div className="flex flex-col lg:flex-row">
          {/* Left Side Ad */}
          <div className="hidden lg:block lg:w-1/6 mr-4">
            <AdContainer position="footer_left" className="sticky top-4" />
          </div>
          
          {/* Main Footer Content */}
          <div className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <Logo size="small" />
                <p className="text-gray-400 mt-2 text-sm">
                  En kaliteli video içeriklerini sunan platform.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Kategoriler</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/category/popular" className="text-gray-400 hover:text-primary-400 text-sm">
                      Popüler
                    </Link>
                  </li>
                  <li>
                    <Link to="/category/trending" className="text-gray-400 hover:text-primary-400 text-sm">
                      Trend
                    </Link>
                  </li>
                  <li>
                    <Link to="/category/newest" className="text-gray-400 hover:text-primary-400 text-sm">
                      En Yeni
                    </Link>
                  </li>
                  <li>
                    <Link to="/category/most-liked" className="text-gray-400 hover:text-primary-400 text-sm">
                      En Çok Beğenilen
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Bağlantılar</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-gray-400 hover:text-primary-400 text-sm">
                      Hakkımızda
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-400 hover:text-primary-400 text-sm">
                      İletişim
                    </Link>
                  </li>
                  <li>
                    <Link to="/sss" className="text-gray-400 hover:text-primary-400 text-sm">
                      SSS
                    </Link>
                  </li>
                  <li>
                    <Link to="/dmca" className="text-gray-400 hover:text-primary-400 text-sm">
                      DMCA
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Yasal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/terms" className="text-gray-400 hover:text-primary-400 text-sm">
                      Kullanım Şartları
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-gray-400 hover:text-primary-400 text-sm">
                      Gizlilik Politikası
                    </Link>
                  </li>
                  <li>
                    <Link to="/cookie" className="text-gray-400 hover:text-primary-400 text-sm">
                      Çerez Politikası
                    </Link>
                  </li>
                  <li>
                    <Link to="/2257" className="text-gray-400 hover:text-primary-400 text-sm">
                      2257 Beyanı
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-dark-600">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm mb-4 md:mb-0">
                  &copy; {currentYear} PRN Club. Tüm hakları saklıdır.
                </p>
                <p className="text-gray-500 text-xs">
                  Bu sitedeki tüm videolar iframe kodları ile eklenmiştir ve üçüncü taraf sitelerden alınmaktadır. Telif hakkı ihlal bildirimi için lütfen iletişime geçin.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right Side Ad */}
          <div className="hidden lg:block lg:w-1/6 ml-4">
            <AdContainer position="footer_right" className="sticky top-4" />
          </div>
        </div>
      </div>
      
      {/* Bottom Banner Ad */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex justify-center">
          <AdContainer position="footer_bottom" className="w-full max-w-3xl" />
        </div>
      </div>
    </footer>
  );
};

export default Footer; 