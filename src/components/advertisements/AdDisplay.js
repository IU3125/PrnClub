import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Advertisement from '../Advertisement';

const AdDisplay = ({ position }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        // Query for active ads in the specified position
        const adsQuery = query(
          collection(db, 'advertisements'),
          where('position', '==', position),
          where('active', '==', true)
        );
        
        const adsSnapshot = await getDocs(adsQuery);
        
        if (!adsSnapshot.empty) {
          // Get all matching ads
          const ads = adsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Randomly select one ad to display
          const randomIndex = Math.floor(Math.random() * ads.length);
          setAd(ads[randomIndex]);
        }
      } catch (error) {
        console.error('Error fetching advertisement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [position]);

  if (loading) {
    return <div className="ad-placeholder animate-pulse"></div>;
  }

  if (!ad) {
    return null; // No ad to display
  }

  return (
    <div className="relative">
      <Advertisement adId={ad.id} link={ad.link} position={position}>
        {ad.adType === 'video' ? (
          <video 
            src={ad.imageUrl} 
            className="w-full h-auto"
            muted 
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img 
            src={ad.imageUrl} 
            alt={ad.companyName || 'Advertisement'} 
            className="w-full h-auto"
          />
        )}
      </Advertisement>
    </div>
  );
};

export default AdDisplay; 