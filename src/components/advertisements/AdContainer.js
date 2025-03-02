import React from 'react';
import AdDisplay from './AdDisplay';

const AdContainer = ({ position, className }) => {
  return (
    <div className={`ad-wrapper ${className || ''}`}>
      <AdDisplay position={position} />
      <div className="text-xs text-gray-500 text-center mt-1">Ad</div>
    </div>
  );
};

export default AdContainer; 