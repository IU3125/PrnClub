import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, increment, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLocation } from 'react-router-dom';

const DeviceContext = createContext();

export function useDevice() {
  return useContext(DeviceContext);
}

export function DeviceProvider({ children }) {
  const [deviceType, setDeviceType] = useState(null);
  const location = useLocation();

  // Function to detect device type
  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    return isMobile ? 'mobile' : 'pc';
  };

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('visitorSession');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('visitorSession', sessionId);
    }
    return sessionId;
  };

  // Check if this is a new visit
  const isNewVisit = () => {
    const lastVisitTime = localStorage.getItem('lastVisitTime');
    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (!lastVisitTime || (currentTime - parseInt(lastVisitTime)) > thirtyMinutes) {
      localStorage.setItem('lastVisitTime', currentTime.toString());
      return true;
    }
    return false;
  };

  // Update device statistics in Firebase
  const updateDeviceStats = async (type) => {
    try {
      // Skip tracking for admin routes
      if (location.pathname.startsWith('/admin')) {
        return;
      }

      // Skip if not a new visit
      if (!isNewVisit()) {
        return;
      }

      // Get or create session ID
      const sessionId = getSessionId();

      const statsRef = doc(db, 'statistics', 'mainSiteVisitors');
      const statsDoc = await getDoc(statsRef);

      // Update main statistics document
      if (statsDoc.exists()) {
        await setDoc(statsRef, {
          [type]: increment(1),
          total: increment(1),
          lastUpdated: new Date()
        }, { merge: true });
      } else {
        await setDoc(statsRef, {
          mobile: type === 'mobile' ? 1 : 0,
          pc: type === 'pc' ? 1 : 0,
          total: 1,
          lastUpdated: new Date()
        });
      }

      // Add daily statistics
      const dailyStatsRef = collection(db, 'statistics', 'mainSiteVisitors', 'dailyStats');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await addDoc(dailyStatsRef, {
        date: today,
        [type]: 1,
        sessionId: sessionId,
        createdAt: new Date()
      });

    } catch (error) {
      console.error('Error updating device statistics:', error);
    }
  };

  useEffect(() => {
    const type = detectDevice();
    setDeviceType(type);
    
    // Only update stats on first page load
    if (!sessionStorage.getItem('visitorSession')) {
      updateDeviceStats(type);
    }
  }, []); // Remove location.pathname dependency

  const value = {
    deviceType
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
} 