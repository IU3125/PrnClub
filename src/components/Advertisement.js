import React, { useEffect } from 'react';
import { useAd } from '../context/AdContext';

const Advertisement = ({ adId, link, position, children }) => {
  const { trackAdClick, trackAdImpression } = useAd();

  useEffect(() => {
    // Reklam gösterildiğinde impression'ı kaydet
    trackAdImpression(adId, position);
  }, [adId, position, trackAdImpression]);

  const handleClick = (e) => {
    // Reklama tıklandığında click'i kaydet
    trackAdClick(adId, position);
  };

  return (
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block"
    >
      {children}
    </a>
  );
};

export default Advertisement; 