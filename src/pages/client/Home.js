import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import VideoCard from '../../components/video/VideoCard';
import FilterBar from '../../components/ui/FilterBar';
import AdDisplay from '../../components/advertisements/AdDisplay';
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

  // Get search parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  const categoryParam = searchParams.get('category');
  const pornstarParam = searchParams.get('pornstar');

  // Set filters according to URL parameters
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
    if (pornstarParam) {
      setActivePornstar(pornstarParam);
    }
  }, [categoryParam, pornstarParam]);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      let videosQuery = collection(db, 'videos');
      let constraints = [];

      // If there's a search query
      if (searchQuery) {
        constraints.push(where('title', '>=', searchQuery));
        constraints.push(where('title', '<=', searchQuery + '\uf8ff'));
      }

      // Category filter
      if (activeCategory !== 'all') {
        constraints.push(where('categories', 'array-contains', activeCategory));
      }

      // Pornstar filter
      if (activePornstar !== 'all') {
        constraints.push(where('pornstars', 'array-contains', activePornstar));
      }

      // Sorting
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

      // Create query
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
      console.error('Error occurred while fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, activeCategory, activePornstar, searchQuery]);

  // Fetch featured videos (for logged-in users)
  const fetchFeaturedVideos = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Get user's featured videos
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userData = userDocSnapshot.data();
      
      if (userData && userData.featured && userData.featured.length > 0) {
        const featuredIds = userData.featured;
        
        // Get featured videos
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
      console.error('Error occurred while fetching featured videos:', error);
    }
  }, [currentUser]);

  // Fetch videos
  useEffect(() => {
    fetchVideos();
    if (currentUser) {
      fetchFeaturedVideos();
    }
  }, [fetchVideos, fetchFeaturedVideos, currentUser]);

  // Refresh videos
  const handleRefresh = () => {
    fetchVideos();
    if (currentUser) {
      fetchFeaturedVideos();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Ad */}
      <div className="mb-6">
        <AdDisplay position="header" />
      </div>
      
      {/* Filter Bar */}
      <FilterBar 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activePornstar={activePornstar}
        setActivePornstar={setActivePornstar}
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Featured Videos */}
          {featuredVideos.length > 0 && !searchQuery && activeCategory === 'all' && activePornstar === 'all' && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Featured Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredVideos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Video Grid */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-4">
                {searchQuery 
                  ? `Search Results for "${searchQuery}"` 
                  : activeCategory !== 'all' 
                    ? `${activeCategory} Videos` 
                    : activePornstar !== 'all'
                      ? `${activePornstar} Videos`
                      : 'All Videos'}
              </h2>
              
              {videos.length === 0 ? (
                <div className="bg-dark-700 rounded-lg p-8 text-center">
                  <p className="text-gray-400 mb-4">No videos found.</p>
                  <button 
                    onClick={() => {
                      setActiveCategory('all');
                      setActivePornstar('all');
                      setActiveFilter('newest');
                      handleRefresh();
                    }}
                    className="btn btn-primary flex items-center mx-auto"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
              
              {/* Video Before Ad */}
              <div className="my-8">
                <AdDisplay position="video-before" />
              </div>
            </div>
            
            {/* Sidebar Ad */}
            <div className="hidden md:block md:w-64">
              <div className="sticky top-4">
                <AdDisplay position="sidebar" />
              </div>
            </div>
          </div>
          
          {/* Footer Ad */}
          <div className="mt-8">
            <AdDisplay position="footer" />
          </div>
        </>
      )}
      
      {/* Left Ad - Fixed Position */}
      <AdDisplay position="left" />
      
      {/* Right Ad - Fixed Position */}
      <AdDisplay position="right" />
    </div>
  );
};

export default Home; 