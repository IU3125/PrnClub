import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import VideoCard from '../../components/video/VideoCard';
import FilterBar from '../../components/ui/FilterBar';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('newest');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePornstar, setActivePornstar] = useState('all');
  const { currentUser } = useAuth();
  const location = useLocation();

  // URL'den arama parametrelerini al
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  const categoryParam = searchParams.get('category');
  const pornstarParam = searchParams.get('pornstar');

  // URL parametrelerine göre filtreleri ayarla
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
    if (pornstarParam) {
      setActivePornstar(pornstarParam);
    }
  }, [categoryParam, pornstarParam]);

  // Videoları getir
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      let videosQuery = collection(db, 'videos');
      let constraints = [];

      // Arama sorgusu varsa
      if (searchQuery) {
        constraints.push(where('title', '>=', searchQuery));
        constraints.push(where('title', '<=', searchQuery + '\uf8ff'));
      }

      // Kategori filtresi
      if (activeCategory !== 'all') {
        constraints.push(where('categories', 'array-contains', activeCategory));
      }

      // Pornstar filtresi
      if (activePornstar !== 'all') {
        constraints.push(where('pornstars', 'array-contains', activePornstar));
      }

      // Sıralama
      let orderByField;
      switch (activeFilter) {
        case 'popular':
          orderByField = 'viewCount';
          break;
        case 'trending':
          orderByField = 'trendingScore';
          break;
        case 'top-rated':
          orderByField = 'likeCount';
          break;
        case 'newest':
        default:
          orderByField = 'createdAt';
          break;
      }

      // Sorguyu oluştur
      if (constraints.length > 0) {
        videosQuery = query(
          videosQuery,
          ...constraints,
          orderBy(orderByField, 'desc'),
          limit(24)
        );
      } else {
        videosQuery = query(
          videosQuery,
          orderBy(orderByField, 'desc'),
          limit(24)
        );
      }

      const videosSnapshot = await getDocs(videosQuery);
      const videosList = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setVideos(videosList);
    } catch (error) {
      console.error('Videolar getirilirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, activeCategory, activePornstar, searchQuery]);

  // Öne çıkan videoları getir (giriş yapmış kullanıcılar için)
  const fetchFeaturedVideos = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Kullanıcının öne çıkan videolarını getir
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userData = userDocSnapshot.data();
      
      if (userData && userData.featured && userData.featured.length > 0) {
        const featuredIds = userData.featured;
        
        // Öne çıkan videoları getir
        const featuredVideosData = [];
        
        for (const videoId of featuredIds) {
          const videoDocRef = doc(db, 'videos', videoId);
          const videoDocSnapshot = await getDoc(videoDocRef);
          if (videoDocSnapshot.exists()) {
            featuredVideosData.push({
              id: videoDocSnapshot.id,
              ...videoDocSnapshot.data()
            });
          }
        }
        
        setFeaturedVideos(featuredVideosData);
      }
    } catch (error) {
      console.error('Öne çıkan videolar getirilirken hata oluştu:', error);
    }
  }, [currentUser]);

  // Videoları getir
  useEffect(() => {
    fetchVideos();
    if (currentUser) {
      fetchFeaturedVideos();
    }
  }, [fetchVideos, fetchFeaturedVideos, currentUser]);

  // Videoları yenile
  const handleRefresh = () => {
    fetchVideos();
    if (currentUser) {
      fetchFeaturedVideos();
    }
  };

  return (
    <div>
      {/* Filtre çubuğu */}
      <FilterBar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activePornstar={activePornstar}
        setActivePornstar={setActivePornstar}
      />

      {/* Arama sonuçları */}
      {searchQuery && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            "{searchQuery}" için arama sonuçları
          </h2>
        </div>
      )}

      {/* Öne çıkan videolar */}
      {currentUser && featuredVideos.length > 0 && !searchQuery && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Öne Çıkanlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}

      {/* Video listesi */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          {searchQuery ? 'Sonuçlar' : 'Videolar'}
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center text-gray-400 hover:text-white"
          title="Yenile"
        >
          <ArrowPathIcon className="w-5 h-5 mr-1" />
          <span className="text-sm">Yenile</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">Hiç video bulunamadı.</p>
          {(activeCategory !== 'all' || activePornstar !== 'all' || searchQuery) && (
            <p className="text-gray-500">
              Farklı filtreler deneyebilir veya aramanızı değiştirebilirsiniz.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Home; 