import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, getCountFromServer, doc, getDoc, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useTheme } from '../../context/ThemeContext';
import {
  UsersIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  FilmIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  ClockIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalComments: 0,
    totalViews: 0
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Firebase'den gelecek veriler için state'ler
  const [osStats, setOsStats] = useState([]);
  const [countryStats, setCountryStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  
  // Grafik verileri ve zaman aralığı seçimi için state'ler
  const [timeRange, setTimeRange] = useState('daily');
  const [graphData, setGraphData] = useState({
    mobile: [],
    pc: []
  });
  
  // Use theme context instead of local dark mode state
  const { darkMode } = useTheme();
  
  // Admin kullanıcı bilgisi
  const [adminUser, setAdminUser] = useState(null);

  const [deviceStats, setDeviceStats] = useState({
    mobile: 0,
    pc: 0,
    total: 0,
    lastUpdated: null
  });

  // Add new states for user behavior statistics
  const [userBehaviorStats, setUserBehaviorStats] = useState({
    avgSessionDuration: 0,
    bounceRate: 0,
    peakHours: [],
    lastUpdated: null
  });

  // Add new state for behavior graph data
  const [behaviorGraphData, setBehaviorGraphData] = useState({
    sessionDuration: [],
    bounceRate: [],
    peakHours: []
  });

  // Add new state for ad statistics
  const [adStats, setAdStats] = useState({
    ctr: 0,
    impressionsPerPage: 0,
    lastUpdated: null
  });

  // Time range changed, update data
  useEffect(() => {
    fetchGraphData(timeRange);
  }, [timeRange]);
  
  // Get current user information when the page loads
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setAdminUser(user);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch device statistics
  useEffect(() => {
    const fetchDeviceStats = async () => {
      try {
        const statsRef = doc(db, 'statistics', 'mainSiteVisitors');
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          setDeviceStats(statsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching device statistics:', error);
      }
    };

    fetchDeviceStats();
  }, []);

  // Fetch user behavior statistics
  useEffect(() => {
    const fetchUserBehaviorStats = async () => {
      try {
        const statsRef = doc(db, 'statistics', 'userBehavior');
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          setUserBehaviorStats(statsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user behavior statistics:', error);
      }
    };

    fetchUserBehaviorStats();
  }, []);

  // Fetch behavior graph data based on time range
  const fetchBehaviorGraphData = async (selectedRange) => {
    try {
      const behaviorRef = collection(db, 'statistics', 'userBehavior', 'dailyStats');
      let startDate = new Date();
      const now = new Date();

      // Set date range based on selection
      switch (selectedRange) {
        case 'daily':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'monthly':
          startDate.setMonth(now.getMonth() - 6);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      startDate.setHours(0, 0, 0, 0);
      const behaviorQuery = query(
        behaviorRef,
        where('date', '>=', startDate),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(behaviorQuery);
      const data = {
        sessionDuration: [],
        bounceRate: [],
        peakHours: []
      };

      snapshot.docs.forEach(doc => {
        const behaviorData = doc.data();
        const date = behaviorData.date.toDate();
        const formattedDate = date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'short'
        });

        data.sessionDuration.push({
          date: formattedDate,
          value: behaviorData.avgSessionDuration || 0
        });

        data.bounceRate.push({
          date: formattedDate,
          value: behaviorData.bounceRate || 0
        });

        data.peakHours.push({
          date: formattedDate,
          value: behaviorData.peakHourVisitors || 0
        });
      });

      setBehaviorGraphData(data);
    } catch (error) {
      console.error('Error fetching behavior graph data:', error);
    }
  };

  // Update behavior data when time range changes
  useEffect(() => {
    fetchBehaviorGraphData(timeRange);
  }, [timeRange]);

  // Fetch graph data based on time range
  const fetchGraphData = async (selectedRange) => {
    try {
      setLoading(true);
      const visitsRef = collection(db, 'statistics', 'mainSiteVisitors', 'dailyStats');
      let visitsQuery;
      const now = new Date();
      let startDate = new Date();

      // Set date range based on selection
      switch (selectedRange) {
        case 'daily':
          startDate.setDate(now.getDate() - 7); // Last 7 days
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 30); // Last 30 days
          break;
        case 'monthly':
          startDate.setMonth(now.getMonth() - 6); // Last 6 months
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      startDate.setHours(0, 0, 0, 0);
      visitsQuery = query(
        visitsRef,
        where('date', '>=', startDate),
        orderBy('date', 'asc')
      );

      const visitsSnapshot = await getDocs(visitsQuery);
      const dailyStats = {};

      // Initialize data structure
      visitsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.date.toDate();
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { mobile: 0, pc: 0, date: dateKey };
        }
        
        if (data.mobile) dailyStats[dateKey].mobile++;
        if (data.pc) dailyStats[dateKey].pc++;
      });

      // Convert to arrays for the graph
      const mobileData = [];
      const pcData = [];
      
      Object.values(dailyStats).forEach(stat => {
        const formattedDate = new Date(stat.date).toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'short'
        });
        
        mobileData.push({ date: formattedDate, value: stat.mobile });
        pcData.push({ date: formattedDate, value: stat.pc });
      });

      setGraphData({
        mobile: mobileData,
        pc: pcData
      });
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get statistics
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const videosSnapshot = await getDocs(collection(db, 'videos'));
        const commentsSnapshot = await getDocs(collection(db, 'comments'));
        
        // Calculate total view count
        let totalViewCount = 0;
        videosSnapshot.docs.forEach(doc => {
          totalViewCount += doc.data().viewCount || 0;
        });
        
        setStats({
          totalUsers: usersSnapshot.size,
          totalVideos: videosSnapshot.size,
          totalComments: commentsSnapshot.size,
          totalViews: totalViewCount
        });
        
        // Get recently added videos
        const recentVideosQuery = query(
          collection(db, 'videos'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const recentVideosSnapshot = await getDocs(recentVideosQuery);
        const recentVideosList = recentVideosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentVideos(recentVideosList);
        
        // Get most popular videos
        const popularVideosQuery = query(
          collection(db, 'videos'),
          orderBy('viewCount', 'desc'),
          limit(6)
        );
        
        const popularVideosSnapshot = await getDocs(popularVideosQuery);
        const popularVideosList = popularVideosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPopularVideos(popularVideosList);
        
        // Fetch category statistics with view counts
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = categoriesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            viewCount: data.viewCount || 0,
            color: data.color || getRandomColor() // Use existing color or generate a random one
          };
        });
        
        // Sort categories by view count in descending order
        const sortedCategories = categoriesList.sort((a, b) => b.viewCount - a.viewCount);
        setCategoryStats(sortedCategories);
        
        // Get graph data for the initially selected time range
        fetchGraphData(timeRange);
        
      } catch (error) {
        console.error('Dashboard verileri getirilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch ad statistics
  useEffect(() => {
    const fetchAdStats = async () => {
      try {
        const statsRef = doc(db, 'statistics', 'adPerformance');
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          setAdStats(statsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching ad statistics:', error);
      }
    };

    fetchAdStats();
  }, []);

  // Calculate percentages for the graph
  const calculatePercentage = (value) => {
    return deviceStats.total > 0 ? (value / deviceStats.total) * 100 : 0;
  };

  const mobilePercentage = calculatePercentage(deviceStats.mobile);
  const pcPercentage = calculatePercentage(deviceStats.pc);

  // İzlenme sayısını biçimlendir
  const formatNumber = (num) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  // Video süresini biçimlendir (saniye cinsinden)
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Format view count
  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toString();
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  // Zaman aralığı değiştiğinde çağrılacak fonksiyon
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value.toLowerCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Ay isimlerini içeren dizi
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper function to generate random colors for categories that don't have one
  const getRandomColor = () => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#8AC249', '#EA5545', '#F46A9B', '#EF9B20'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className={`p-4 sm:p-6 ${darkMode ? 'bg-dark-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Üst Kısım - Başlık ve Profil */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pages / Dashboard</p>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Main Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Profil Resmi */}
          <div className="h-8 w-8 rounded-full bg-blue-500 overflow-hidden">
            {adminUser && adminUser.photoURL ? (
              <img 
                src={adminUser.photoURL} 
                alt="Admin Profile" 
                className="h-full w-full object-cover"
              />
            ) : (
              <img 
                src="/images/avatar-default.png" 
                alt="Default Avatar" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff";
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Ana Grafik - Mobil ve PC Kullanımı */}
      <div className={`rounded-lg p-4 sm:p-6 mb-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Daily Active Users by Device Type
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'daily'
                  ? 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-dark-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'weekly'
                  ? 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-dark-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'monthly'
                  ? 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-dark-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Visits</p>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {deviceStats.total || 0}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                <UsersIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mobile Users</p>
                <h3 className={`text-2xl font-bold text-purple-500`}>
                  {deviceStats.mobile || 0}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-purple-500 bg-opacity-10">
                <DevicePhoneMobileIcon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PC Users</p>
                <h3 className={`text-2xl font-bold text-red-500`}>
                  {deviceStats.pc || 0}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-red-500 bg-opacity-10">
                <ComputerDesktopIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="h-80 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 800 300">
              {/* Background Grid */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                  <line
                    x1="50"
                    y1={i * 60}
                    x2="750"
                    y2={i * 60}
                    stroke={darkMode ? '#2D3748' : '#E2E8F0'}
                    strokeWidth="1"
                  />
                  <text
                    x="30"
                    y={300 - i * 60}
                    fill={darkMode ? '#A0AEC0' : '#4A5568'}
                    fontSize="12"
                    textAnchor="end"
                  >
                    {i * Math.ceil(Math.max(...[...graphData.mobile, ...graphData.pc].map(d => d.value)) / 5)}
                  </text>
                </g>
              ))}

              {/* X-Axis Labels */}
              {graphData.mobile.map((point, i) => (
                <text
                  key={i}
                  x={50 + (i * (700 / (graphData.mobile.length - 1)))}
                  y="290"
                  fill={darkMode ? '#A0AEC0' : '#4A5568'}
                  fontSize="12"
                  textAnchor="middle"
                >
                  {point.date}
                </text>
              ))}

              {/* Mobile Data Line */}
              <path
                d={`M${graphData.mobile
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (graphData.mobile.length - 1)));
                    const y = 300 - (point.value * (240 / Math.max(...graphData.mobile.map(d => d.value))));
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#9F7AEA"
                strokeWidth="3"
              />

              {/* PC Data Line */}
              <path
                d={`M${graphData.pc
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (graphData.pc.length - 1)));
                    const y = 300 - (point.value * (240 / Math.max(...graphData.pc.map(d => d.value))));
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#F56565"
                strokeWidth="3"
              />

              {/* Area under Mobile Line */}
              <path
                d={`M50,300 ${graphData.mobile
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (graphData.mobile.length - 1)));
                    const y = 300 - (point.value * (240 / Math.max(...graphData.mobile.map(d => d.value))));
                    return `L${x},${y}`;
                  })
                  .join(' ')} L750,300 Z`}
                fill="url(#purpleGradient)"
                opacity="0.1"
              />

              {/* Area under PC Line */}
              <path
                d={`M50,300 ${graphData.pc
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (graphData.pc.length - 1)));
                    const y = 300 - (point.value * (240 / Math.max(...graphData.pc.map(d => d.value))));
                    return `L${x},${y}`;
                  })
                  .join(' ')} L750,300 Z`}
                fill="url(#redGradient)"
                opacity="0.1"
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9F7AEA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9F7AEA" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F56565" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F56565" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mobile Users</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>PC Users</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-right mt-4">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Last Updated: {deviceStats.lastUpdated ? new Date(deviceStats.lastUpdated.toDate()).toLocaleString('tr-TR') : 'N/A'}
          </span>
        </div>
      </div>
      
      {/* User Behavior Statistics */}
      <div className={`rounded-lg p-6 mb-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            User Behavior Analytics
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'daily'
                  ? 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-dark-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'weekly'
                  ? 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-dark-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === 'monthly'
                  ? 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-dark-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Behavior Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Session Duration</p>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(userBehaviorStats.avgSessionDuration || 0)} min
                </h3>
              </div>
              <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
                <ClockIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bounce Rate</p>
                <h3 className={`text-2xl font-bold text-orange-500`}>
                  {Math.round(userBehaviorStats.bounceRate || 0)}%
                </h3>
              </div>
              <div className="p-3 rounded-full bg-orange-500 bg-opacity-10">
                <EyeIcon className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Peak Hour Traffic</p>
                <h3 className={`text-2xl font-bold text-blue-500`}>
                  {userBehaviorStats.peakHour || 'N/A'}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                <UsersIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Behavior Graph */}
        <div className="h-80 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 800 300">
              {/* Background Grid */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                  <line
                    x1="50"
                    y1={i * 60}
                    x2="750"
                    y2={i * 60}
                    stroke={darkMode ? '#2D3748' : '#E2E8F0'}
                    strokeWidth="1"
                  />
                  <text
                    x="30"
                    y={300 - i * 60}
                    fill={darkMode ? '#A0AEC0' : '#4A5568'}
                    fontSize="12"
                    textAnchor="end"
                  >
                    {i * 20}%
                  </text>
                </g>
              ))}

              {/* X-Axis Labels */}
              {behaviorGraphData.sessionDuration.map((point, i) => (
                <text
                  key={i}
                  x={50 + (i * (700 / (behaviorGraphData.sessionDuration.length - 1)))}
                  y="290"
                  fill={darkMode ? '#A0AEC0' : '#4A5568'}
                  fontSize="12"
                  textAnchor="middle"
                >
                  {point.date}
                </text>
              ))}

              {/* Session Duration Line */}
              <path
                d={`M${behaviorGraphData.sessionDuration
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (behaviorGraphData.sessionDuration.length - 1)));
                    const y = 300 - (point.value * (240 / 100));
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#48BB78"
                strokeWidth="3"
              />

              {/* Bounce Rate Line */}
              <path
                d={`M${behaviorGraphData.bounceRate
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (behaviorGraphData.bounceRate.length - 1)));
                    const y = 300 - (point.value * (240 / 100));
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#ED8936"
                strokeWidth="3"
              />

              {/* Peak Hours Line */}
              <path
                d={`M${behaviorGraphData.peakHours
                  .map((point, i) => {
                    const x = 50 + (i * (700 / (behaviorGraphData.peakHours.length - 1)));
                    const y = 300 - (point.value * (240 / 100));
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#4299E1"
                strokeWidth="3"
              />
            </svg>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Session Duration</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bounce Rate</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Peak Hours</span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-right mt-4">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Last Updated: {userBehaviorStats.lastUpdated ? new Date(userBehaviorStats.lastUpdated.toDate()).toLocaleString('tr-TR') : 'N/A'}
          </span>
        </div>
      </div>
      
      {/* Operating System Stats yerine Ad Position Stats */}
      <div className={`rounded-lg p-6 mb-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ad Position Stats</h2>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Last Updated: {adStats.lastUpdated ? new Date(adStats.lastUpdated.toDate()).toLocaleString('tr-TR') : 'N/A'}
          </div>
        </div>
        {adStats && adStats.positionStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {Object.entries(adStats.positionStats).map(([position, stats]) => {
              const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
              const gradientColor = position.includes('video') ? 'from-purple-500 to-pink-500' :
                                  position === 'sidebar' ? 'from-blue-500 to-cyan-500' :
                                  position === 'header' ? 'from-green-500 to-emerald-500' :
                                  position === 'footer' ? 'from-orange-500 to-yellow-500' :
                                  position === 'left' ? 'from-indigo-500 to-blue-500' :
                                  'from-red-500 to-pink-500';
              
              return (
                <div key={position} className={`p-4 rounded-xl ${darkMode ? 'bg-dark-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {position.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {(stats?.clicks || 0).toLocaleString()} clicks • {(stats?.impressions || 0).toLocaleString()} views
                      </p>
                    </div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {ctr.toFixed(1)}%
                    </div>
                  </div>
                  <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-dark-600' : 'bg-gray-200'} overflow-hidden`}>
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${gradientColor} transition-all duration-500 ease-out`}
                      style={{ 
                        width: `${Math.min(ctr * 2, 100)}%`,
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className={`rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
              <EyeIcon className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Ad position statistics are not available yet.</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Data will be collected as ads are viewed and clicked.</p>
          </div>
        )}
      </div>
      
      {/* Country Statistics and Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Ad Performance Statistics */}
        <div className={`rounded-lg p-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ad Performance</h2>
          <div className="space-y-6">
            {/* CTR Stats */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click Through Rate (CTR)</p>
                  <h3 className={`text-2xl font-bold text-green-500`}>
                    {(adStats.ctr || 0).toFixed(2)}%
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
                  <HandThumbUpIcon className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-dark-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.min((adStats.ctr || 0), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Impressions per Page Stats */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Impressions per Page</p>
                  <h3 className={`text-2xl font-bold text-blue-500`}>
                    {Math.round(adStats.impressionsPerPage || 0)}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                  <EyeIcon className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-dark-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.min((adStats.impressionsPerPage || 0) * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-right mt-4">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Last Updated: {adStats.lastUpdated ? new Date(adStats.lastUpdated.toDate()).toLocaleString('tr-TR') : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Most Popular Categories */}
        <div className={`rounded-lg p-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>Most Popular Categories</h2>
          {categoryStats.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  {/* Circular Chart */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="20" />
                    
                    {/* Category Slices - Will be filled with data from Firebase */}
                    {categoryStats.map((category, index) => {
                      // Calculate the proportion of this category's views to total views
                      const totalViews = categoryStats.reduce((sum, cat) => sum + cat.viewCount, 0);
                      const proportion = totalViews > 0 ? category.viewCount / totalViews : 1 / categoryStats.length;
                      
                      // Calculate the dash length based on the proportion
                      const circumference = 2 * Math.PI * 40;
                      const dashLength = circumference * proportion;
                      
                      // Calculate the dash offset
                      let dashOffset = 0;
                      for (let i = 0; i < index; i++) {
                        const prevProportion = totalViews > 0 
                          ? categoryStats[i].viewCount / totalViews 
                          : 1 / categoryStats.length;
                        dashOffset -= circumference * prevProportion;
                      }
                      
                      return (
                        <circle 
                          key={index}
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent" 
                          stroke={category.color} 
                          strokeWidth="20" 
                          strokeDasharray={`${dashLength} ${circumference - dashLength}`} 
                          strokeDashoffset={dashOffset}
                          transform="rotate(-90 50 50)"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
              
              {/* Category Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                {categoryStats.slice(0, 6).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{category.name}</span>
                    </div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {category.viewCount.toLocaleString()} views
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Category statistics are not available yet.</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Data will be collected from the main site.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 