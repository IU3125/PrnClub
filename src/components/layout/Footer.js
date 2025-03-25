import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import AdContainer from '../advertisements/AdContainer';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-800 py-8 mt-auto">
      
      
      <div className="container mx-auto px-4">
        {/* Main Footer Content with Side Ads */}
        <div className="flex flex-col lg:flex-row">
          
         
          
          {/* Main Footer Content */}
          <div className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <Logo size="small" />
                <p className="text-gray-400 mt-2 text-sm">
                  Platform providing the highest quality video content.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-gray-400 hover:text-primary-400 text-sm">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-400 hover:text-primary-400 text-sm">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to="/sss" className="text-gray-400 hover:text-primary-400 text-sm">
                      FAQ
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
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/terms" className="text-gray-400 hover:text-primary-400 text-sm">
                      Terms of Use
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-gray-400 hover:text-primary-400 text-sm">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/cookie" className="text-gray-400 hover:text-primary-400 text-sm">
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/2257" className="text-gray-400 hover:text-primary-400 text-sm">
                      2257 Statement
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-dark-600">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm mb-4 md:mb-0">
                  &copy; {currentYear} PRN Club. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs">
                  All videos on this site are embedded using iframe codes and are sourced from third-party sites. Please contact us for any copyright infringement notices.
                </p>
              </div>
            </div>
          </div>
          
        
        </div>
      </div>
      
     
    </footer>
  );
};

export default Footer; 