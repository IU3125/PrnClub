import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdDisplay = ({ position }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adTime, setAdTime] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [adDuration, setAdDuration] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

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
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [position]);

  // Start timer when video ad starts playing
  useEffect(() => {
    if (ad && ad.adType === 'video' && videoRef.current) {
      // Reset timer state
      setAdTime(0);
      setCanSkip(false);
      
      // Get skip time from ad data or default to 5 seconds
      const skipAfter = ad.skipAfter !== undefined ? ad.skipAfter : 5;
      
      // Setup video event listeners
      const videoElement = videoRef.current;
      
      // Get video duration when metadata is loaded
      const handleMetadata = () => {
        setAdDuration(Math.floor(videoElement.duration));
      };
      
      const handlePlay = () => {
        // Start timer when video plays
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
          setAdTime(prevTime => {
            const newTime = prevTime + 1;
            
            // Enable skip button based on skipAfter setting
            if (skipAfter === 0) {
              // Cannot skip
              setCanSkip(false);
            } else if (skipAfter === -1) {
              // Can skip only after ad ends
              setCanSkip(false);
            } else if (newTime >= skipAfter) {
              // Can skip after specified time
              setCanSkip(true);
            }
            
            return newTime;
          });
        }, 1000);
      };
      
      const handlePause = () => {
        // Pause timer when video pauses
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
      
      const handleEnded = () => {
        // Clear timer when video ends
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        // If skipAfter is -1, enable skip button at the end
        if (skipAfter === -1) {
          setCanSkip(true);
        }
      };
      
      // Add event listeners
      videoElement.addEventListener('loadedmetadata', handleMetadata);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      
      // Auto-play video
      videoElement.play().catch(error => {
        console.error('Auto-play failed:', error);
      });
      
      // Cleanup
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleMetadata);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [ad]);

  // Handle skip ad
  const handleSkipAd = () => {
    setShowAd(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  if (loading) {
    return <div className="ad-placeholder animate-pulse"></div>;
  }

  if (!ad || !showAd) {
    return null; // No ad to display or ad was skipped
  }

  // Track ad click
  const handleAdClick = () => {
    // You could implement analytics tracking here
    console.log(`Ad clicked: ${ad.id}`);
  };

  // Determine container class
  const containerClass = position === 'left' 
    ? 'ad-container-left' 
    : position === 'right' 
      ? 'ad-container-right' 
      : position === 'video-before' || position === 'video-after'
        ? 'ad-container-video'
        : '';

  // Get skip time from ad data or default to 5 seconds
  const skipAfter = ad.skipAfter !== undefined ? ad.skipAfter : 5;

  return (
    <div className={`ad-container ${containerClass} relative ${position === 'video-before' ? 'mb-4' : ''}`}>
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className="block"
      >
        {ad.adType === 'video' ? (
          <div className="relative">
            <video 
              ref={videoRef}
              src={ad.imageUrl} 
              className={`ad-media ad-${position} w-full`}
              muted 
              loop={false}
              controls={false}
              playsInline
            />
            
            {/* Skip button */}
            {canSkip && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSkipAd();
                }}
                className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm font-medium hover:bg-opacity-90 transition-all z-20"
              >
                Reklamı Geç
              </button>
            )}
            
            {/* Timer display */}
            {!canSkip && skipAfter > 0 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm font-medium z-20">
                {skipAfter - adTime > 0 
                  ? `Reklam: ${skipAfter - adTime}...` 
                  : "Yükleniyor..."}
              </div>
            )}
            
            {/* For ads that can't be skipped */}
            {skipAfter === 0 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm font-medium z-20">
                Reklam
              </div>
            )}
            
            {/* For ads that can only be skipped at the end */}
            {skipAfter === -1 && !canSkip && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm font-medium z-20">
                {adDuration > 0 ? `Reklam: ${adDuration - adTime}...` : "Reklam..."}
              </div>
            )}
          </div>
        ) : (
          <img 
            src={ad.imageUrl} 
            alt={ad.companyName || 'Advertisement'} 
            className={`ad-media ad-${position} w-full`}
          />
        )}
        
        {/* Optional: Add a small "Ad" label */}
        <div className="ad-label absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">Reklam</div>
      </a>
    </div>
  );
};

export default AdDisplay; 