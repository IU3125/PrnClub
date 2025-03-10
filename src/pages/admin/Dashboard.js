import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useTheme } from '../../context/ThemeContext';
import {
  UsersIcon,
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
  const [timeRange, setTimeRange] = useState('month');
  const [graphData, setGraphData] = useState({
    mobile: [],
    pc: []
  });
  
  // Use theme context instead of local dark mode state
  const { darkMode } = useTheme();
  
  // Admin kullanıcı bilgisi
  const [adminUser, setAdminUser] = useState(null);

  // Zaman aralığı değiştiğinde verileri güncelle
  useEffect(() => {
    fetchGraphData(timeRange);
  }, [timeRange]);
  
  // Sayfa yüklendiğinde mevcut kullanıcı bilgisini al
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setAdminUser(user);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Grafik verilerini zaman aralığına göre getir
  const fetchGraphData = async (selectedRange) => {
    try {
      // NOT: Bu fonksiyon, Firebase'den seçilen zaman aralığına göre
      // grafik verilerini getirecek. Şimdilik boş bırakılıyor.
      
      // Örnek veri yapısı:
      // setGraphData({
      //   mobile: [{date: '5', value: 30}, {date: '10', value: 40}, ...],
      //   pc: [{date: '5', value: 50}, {date: '10', value: 25}, ...]
      // });
      
      console.log(`Grafik verileri ${selectedRange} için getirilecek`);
      
      // Şimdilik, zaman aralığı değiştiğinde grafik verilerinin değiştiğini göstermek için
      // farklı örnek veriler kullanabiliriz (gerçek uygulamada bu kısım Firebase'den veri çekecek)
    } catch (error) {
      console.error(`${selectedRange} grafik verileri getirilirken hata oluştu:`, error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // İstatistikleri getir
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const videosSnapshot = await getDocs(collection(db, 'videos'));
        const commentsSnapshot = await getDocs(collection(db, 'comments'));
        
        // Toplam görüntülenme sayısını hesapla
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
        
        // En son eklenen videoları getir
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
        
        // En popüler videoları getir
        const popularVideosQuery = query(
          collection(db, 'videos'),
          orderBy('viewCount', 'desc'),
          limit(5)
        );
        
        const popularVideosSnapshot = await getDocs(popularVideosQuery);
        const popularVideosList = popularVideosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPopularVideos(popularVideosList);
        
        // NOT: İşletim sistemi, ülke ve kategori istatistikleri için
        // Firebase'den veri çekme işlemleri burada yapılacak
        // Şimdilik boş bırakılıyor
        
        // Başlangıçta seçili zaman aralığı için grafik verilerini getir
        fetchGraphData(timeRange);
        
      } catch (error) {
        console.error('Dashboard verileri getirilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // İzlenme sayısını biçimlendir
  const formatNumber = (num) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  // Video süresini biçimlendir (saniye cinsinden)
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Tarih biçimlendirme
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  return (
    <div className={`p-6 ${darkMode ? 'bg-dark-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Üst Kısım - Başlık ve Profil */}
      <div className="flex flex-col space-y-4 mb-6">
        {/* Başlık ve Profil */}
        <div className="flex justify-between items-center">
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
        
        {/* Zaman Aralığı Seçimi - Sağ Üst Köşede */}
        <div className="flex justify-end">
          <div className="relative inline-block">
            <button 
              className={`px-4 py-2 rounded-md text-sm flex items-center space-x-2 ${darkMode ? 'bg-dark-800 text-white' : 'bg-white text-gray-800 border border-gray-300 shadow-sm'}`}
              onClick={() => document.getElementById('timeRangeDropdown').classList.toggle('hidden')}
            >
              <span>{timeRange === 'month' ? months[new Date().getMonth()] : timeRange === 'week' ? 'This Week' : 'Today'}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            
            <div 
              id="timeRangeDropdown" 
              className={`absolute right-0 mt-2 w-40 rounded-md shadow-lg overflow-hidden z-10 hidden ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-300'}`}
            >
              <div className="py-1">
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-white hover:bg-dark-700' : 'text-gray-800 hover:bg-gray-100'}`}
                  onClick={() => {
                    setTimeRange('month');
                    document.getElementById('timeRangeDropdown').classList.add('hidden');
                  }}
                >
                  Month
                </button>
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-white hover:bg-dark-700' : 'text-gray-800 hover:bg-gray-100'}`}
                  onClick={() => {
                    setTimeRange('week');
                    document.getElementById('timeRangeDropdown').classList.add('hidden');
                  }}
                >
                  Week
                </button>
                <button 
                  className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-white hover:bg-dark-700' : 'text-gray-800 hover:bg-gray-100'}`}
                  onClick={() => {
                    setTimeRange('day');
                    document.getElementById('timeRangeDropdown').classList.add('hidden');
                  }}
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ana Grafik - Mobil ve PC Kullanımı */}
      <div className={`rounded-lg p-6 mb-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
        <div className="h-64 relative">
          {/* SVG Grafik */}
          <svg className="w-full h-full" viewBox="0 0 800 300">
            {/* Arka plan çizgileri */}
            <line x1="0" y1="0" x2="800" y2="0" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="1" />
            <line x1="0" y1="60" x2="800" y2="60" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="1" />
            <line x1="0" y1="120" x2="800" y2="120" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="1" />
            <line x1="0" y1="180" x2="800" y2="180" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="1" />
            <line x1="0" y1="240" x2="800" y2="240" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="1" />
            <line x1="0" y1="300" x2="800" y2="300" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="1" />
            
            {/* X ekseni etiketleri */}
            <text x="5" y="295" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">5</text>
            <text x="160" y="295" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">10</text>
            <text x="320" y="295" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">15</text>
            <text x="480" y="295" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">20</text>
            <text x="640" y="295" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">25</text>
            <text x="780" y="295" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">30</text>
            
            {/* Y ekseni etiketleri */}
            <text x="10" y="245" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">20</text>
            <text x="10" y="185" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">40</text>
            <text x="10" y="125" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">60</text>
            <text x="10" y="65" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">80</text>
            <text x="5" y="15" fill={darkMode ? "#A0AEC0" : "#4A5568"} fontSize="12">100</text>
            
            {/* Mobil veri çizgisi ve alanı */}
            <path 
              d="M0,240 C30,200 60,180 90,170 C120,160 150,150 180,140 C210,130 240,120 270,110 C300,100 330,90 360,80 C390,70 420,60 450,70 C480,80 510,90 540,80 C570,70 600,60 630,50 C660,40 690,30 720,40 C750,50 780,60 800,50" 
              fill="none" 
              stroke="#9F7AEA" 
              strokeWidth="3"
            />
            <path 
              d="M0,240 C30,200 60,180 90,170 C120,160 150,150 180,140 C210,130 240,120 270,110 C300,100 330,90 360,80 C390,70 420,60 450,70 C480,80 510,90 540,80 C570,70 600,60 630,50 C660,40 690,30 720,40 C750,50 780,60 800,50 L800,300 L0,300 Z" 
              fill="url(#purpleGradient)" 
              fillOpacity="0.5"
            />
            
            {/* PC veri çizgisi ve alanı */}
            <path 
              d="M0,180 C30,190 60,200 90,190 C120,180 150,170 180,180 C210,190 240,200 270,190 C300,180 330,170 360,160 C390,150 420,140 450,150 C480,160 510,170 540,160 C570,150 600,140 630,150 C660,160 690,170 720,160 C750,150 780,140 800,130" 
              fill="none" 
              stroke="#F56565" 
              strokeWidth="3"
            />
            <path 
              d="M0,180 C30,190 60,200 90,190 C120,180 150,170 180,180 C210,190 240,200 270,190 C300,180 330,170 360,160 C390,150 420,140 450,150 C480,160 510,170 540,160 C570,150 600,140 630,150 C660,160 690,170 720,160 C750,150 780,140 800,130 L800,300 L0,300 Z" 
              fill="url(#redGradient)" 
              fillOpacity="0.5"
            />
            
            {/* Gradyanlar */}
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
        </div>
        
        {/* Grafik Açıklaması */}
        <div className="flex justify-center mt-4 space-x-8">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mobile</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>PC</span>
          </div>
        </div>
      </div>
      
      {/* İşletim Sistemi İstatistikleri */}
      <div className={`rounded-lg p-6 mb-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>Operating System Stats</h2>
        {osStats.length > 0 ? (
          <div className="space-y-4">
            {osStats.map((os, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{os.name}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{os.value}</span>
                </div>
                <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-dark-700' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-yellow-600' : 
                      index === 2 ? 'bg-yellow-700' : 
                      index === 3 ? 'bg-yellow-800' : 
                      'bg-yellow-900'
                    }`} 
                    style={{ width: `${os.value * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>İşletim sistemi istatistikleri henüz mevcut değil.</p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Veriler ana siteden toplanacak.</p>
          </div>
        )}
      </div>
      
      {/* Ülke İstatistikleri ve Kategori Grafikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ülke İstatistikleri */}
        <div className={`rounded-lg p-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>Country Stats</h2>
          {countryStats.length > 0 ? (
            <div className="space-y-4">
              {countryStats.map((country, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{country.flag}</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{country.name}</span>
                  </div>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{country.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Ülke istatistikleri henüz mevcut değil.</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Veriler ana siteden toplanacak.</p>
            </div>
          )}
        </div>
        
        {/* En Popüler Kategoriler */}
        <div className={`rounded-lg p-6 shadow-lg ${darkMode ? 'bg-dark-800' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 uppercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>Most Popular Categories</h2>
          {categoryStats.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  {/* Dairesel Grafik */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke={darkMode ? "#2D3748" : "#E2E8F0"} strokeWidth="20" />
                    
                    {/* Kategori Dilimleri - Firebase'den gelen verilerle doldurulacak */}
                    {categoryStats.map((category, index) => {
                      // Örnek olarak, her kategorinin eşit paya sahip olduğunu varsayalım
                      const totalCategories = categoryStats.length;
                      const dashLength = (2 * Math.PI * 40) / totalCategories;
                      const dashOffset = -index * dashLength;
                      
                      return (
                        <circle 
                          key={index}
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent" 
                          stroke={category.color} 
                          strokeWidth="20" 
                          strokeDasharray={`${dashLength} ${2 * Math.PI * 40 - dashLength}`} 
                          strokeDashoffset={dashOffset}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
              
              {/* Kategori Açıklaması */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryStats.map((category, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{category.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Kategori istatistikleri henüz mevcut değil.</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Veriler ana siteden toplanacak.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 