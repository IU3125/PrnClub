import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

export const initializeAdStats = async () => {
  try {
    const adStatsRef = doc(db, 'statistics', 'adPerformance');
    const adStatsDoc = await getDoc(adStatsRef);

    // Eğer belge yoksa oluştur
    if (!adStatsDoc.exists()) {
      await setDoc(adStatsRef, {
        totalClicks: 0,
        totalImpressions: 0,
        totalPageViews: 0,
        ctr: 0,
        impressionsPerPage: 0,
        lastUpdated: Timestamp.now(),
        positionStats: {
          sidebar: { clicks: 0, impressions: 0 },
          header: { clicks: 0, impressions: 0 },
          footer: { clicks: 0, impressions: 0 },
          left: { clicks: 0, impressions: 0 },
          right: { clicks: 0, impressions: 0 },
          'video-before': { clicks: 0, impressions: 0 },
          'video-after': { clicks: 0, impressions: 0 }
        }
      });
      console.log('Ad statistics initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing ad statistics:', error);
  }
};

// Call this function when setting up your app for the first time
// initializeAdStats(); 