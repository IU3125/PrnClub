import React, { createContext, useContext, useEffect } from 'react';
import { doc, updateDoc, increment, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const AdContext = createContext();

export const useAd = () => {
  return useContext(AdContext);
};

export const AdProvider = ({ children }) => {
  // Reklam tıklamasını kaydet
  const trackAdClick = async (adId, position) => {
    try {
      const adStatsRef = doc(db, 'statistics', 'adPerformance');
      const dailyStatsRef = doc(db, 'statistics/adPerformance/dailyStats', new Date().toISOString().split('T')[0]);

      // Ana istatistikleri güncelle
      const updates = {
        totalClicks: increment(1),
        lastUpdated: Timestamp.now(),
        [`positionStats.${position}.clicks`]: increment(1)
      };

      await updateDoc(adStatsRef, updates);

      // Günlük istatistikleri güncelle
      const dailyStatsDoc = await getDoc(dailyStatsRef);
      if (dailyStatsDoc.exists()) {
        await updateDoc(dailyStatsRef, {
          clicks: increment(1),
          [`positionClicks.${position}`]: increment(1)
        });
      } else {
        await setDoc(dailyStatsRef, {
          date: Timestamp.now(),
          clicks: 1,
          impressions: 0,
          positionClicks: {
            [position]: 1
          },
          positionImpressions: {
            [position]: 0
          }
        });
      }

      // CTR'yi güncelle
      const statsDoc = await getDoc(adStatsRef);
      const stats = statsDoc.data();
      const ctr = (stats.totalClicks / stats.totalImpressions) * 100;
      await updateDoc(adStatsRef, { ctr });

    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  // Reklam gösterimini kaydet
  const trackAdImpression = async (adId, position) => {
    try {
      const adStatsRef = doc(db, 'statistics', 'adPerformance');
      const dailyStatsRef = doc(db, 'statistics/adPerformance/dailyStats', new Date().toISOString().split('T')[0]);

      // Ana istatistikleri güncelle
      const updates = {
        totalImpressions: increment(1),
        lastUpdated: Timestamp.now(),
        [`positionStats.${position}.impressions`]: increment(1)
      };

      await updateDoc(adStatsRef, updates);

      // Günlük istatistikleri güncelle
      const dailyStatsDoc = await getDoc(dailyStatsRef);
      if (dailyStatsDoc.exists()) {
        await updateDoc(dailyStatsRef, {
          impressions: increment(1),
          [`positionImpressions.${position}`]: increment(1)
        });
      } else {
        await setDoc(dailyStatsRef, {
          date: Timestamp.now(),
          clicks: 0,
          impressions: 1,
          positionClicks: {
            [position]: 0
          },
          positionImpressions: {
            [position]: 1
          }
        });
      }

      // Sayfa başına gösterim sayısını güncelle
      const statsDoc = await getDoc(adStatsRef);
      const stats = statsDoc.data();
      const impressionsPerPage = stats.totalImpressions / stats.totalPageViews;
      await updateDoc(adStatsRef, { impressionsPerPage });

    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  // Sayfa görüntülemeyi kaydet
  const trackPageView = async () => {
    try {
      const adStatsRef = doc(db, 'statistics', 'adPerformance');
      await updateDoc(adStatsRef, {
        totalPageViews: increment(1),
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const value = {
    trackAdClick,
    trackAdImpression,
    trackPageView
  };

  return (
    <AdContext.Provider value={value}>
      {children}
    </AdContext.Provider>
  );
}; 