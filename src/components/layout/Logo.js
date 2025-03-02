import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ size = 'default' }) => {
  // Size classes
  const sizeClasses = {
    small: 'text-xl',
    default: 'text-2xl',
    large: 'text-3xl'
  };
  
  const fontSizeClass = sizeClasses[size] || sizeClasses.default;
  const imageSize = size === 'small' ? 32 : size === 'large' ? 48 : 40;
  
  return (
    <Link to="/" className="flex items-center">
      <div className="mr-2">
        <img 
          src="/images/guzel-removebg-preview.png" 
          alt="PRNClub Logo" 
          width={imageSize} 
          height={imageSize}
          className="object-contain"
        />
      </div>
      <div className="flex items-center">
        <span className={`${fontSizeClass} font-bold text-primary-500`}>PRN</span>
        <span className={`${fontSizeClass} font-bold text-white`}>Club</span>
      </div>
    </Link>
  );
};

export default Logo; 