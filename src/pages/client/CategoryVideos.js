import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import VideoCard from '../../components/video/VideoCard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CategoryVideos = () => {
  const { categoryName } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const videosPerPage = 16; // 4x4 grid

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      try {
        // Get category information
        const categoryRef = collection(db, 'categories');
        const categoryQuery = query(
          categoryRef,
          where('name', '==', categoryName)
        );
        const categorySnapshot = await getDocs(categoryQuery);
        
        if (categorySnapshot.empty) {
          setError('Category not found');
          setLoading(false);
          return;
        }
        
        const categoryData = {
          id: categorySnapshot.docs[0].id,
          ...categorySnapshot.docs[0].data()
        };
        setCategory(categoryData);
        
        // Fetch videos for this category
        fetchCategoryVideos(1);
      } catch (error) {
        console.error('Error fetching category:', error);
        setError('Failed to load category');
        setLoading(false);
      }
    };
    
    fetchCategoryInfo();
  }, [categoryName]);

  const fetchCategoryVideos = async (pageNum) => {
    try {
      setLoading(true);
      
      const videosRef = collection(db, 'videos');
      const videosQuery = query(
        videosRef,
        where('categories', 'array-contains', categoryName),
        orderBy('createdAt', 'desc'),
        limit(videosPerPage * pageNum)
      );
      
      const videosSnapshot = await getDocs(videosQuery);
      
      if (videosSnapshot.empty && pageNum === 1) {
        setVideos([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      const videosList = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setVideos(videosList);
      setHasMore(videosList.length === videosPerPage * pageNum);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos');
      setLoading(false);
    }
  };

  const loadMoreVideos = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCategoryVideos(nextPage);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-dark-800 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={handleBackClick}
          className="flex items-center text-primary-500 hover:text-primary-400"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={handleBackClick}
          className="mr-4 p-2 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {categoryName}
          </h1>
          {category && (
            <p className="text-gray-400 text-sm mt-1">
              {category.videoCount || 0} videos
            </p>
          )}
        </div>
      </div>

      {/* Videos Grid - 4x4 layout */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-dark-700 rounded-xl">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Videos Found</h3>
          <p className="text-gray-400">
            There are no videos in this category yet.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && videos.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMoreVideos}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-lg shadow-primary-500/20 transition-all duration-300"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Loading...
              </div>
            ) : (
              'Load More Videos'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryVideos; 