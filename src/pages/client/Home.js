import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where, startAfter } from 'firebase/firestore';
import { db } from '../../firebase/config';
import VideoCard from '../../components/video/VideoCard';
import AdDisplay from '../../components/advertisements/AdDisplay';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const videosPerPage = 16; // 4x4 grid
  const location = useLocation();
  const navigate = useNavigate();

  // Get page and search parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const videosRef = collection(db, 'videos');

      if (searchQuery) {
        // Paralel sorgular oluştur
        const titleQuery = query(
          videosRef,
          where('titleLower', '>=', searchQuery),
          where('titleLower', '<=', searchQuery + '\uf8ff'),
          limit(50)
        );

        const categoryQuery = query(
          videosRef,
          where('categoryLower', '>=', searchQuery),
          where('categoryLower', '<=', searchQuery + '\uf8ff'),
          limit(50)
        );

        const pornstarQuery = query(
          videosRef,
          where('pornstarLower', '>=', searchQuery),
          where('pornstarLower', '<=', searchQuery + '\uf8ff'),
          limit(50)
        );

        const tagQuery = query(
          videosRef,
          where('tagsLower', 'array-contains', searchQuery),
          limit(50)
        );

        // Tüm sorguları paralel olarak çalıştır
        const [titleDocs, categoryDocs, pornstarDocs, tagDocs] = await Promise.all([
          getDocs(titleQuery),
          getDocs(categoryQuery),
          getDocs(pornstarQuery),
          getDocs(tagQuery)
        ]);

        // Sonuçları birleştir ve tekrar eden videoları kaldır
        const allResults = [...titleDocs.docs, ...categoryDocs.docs, ...pornstarDocs.docs, ...tagDocs.docs];
        const uniqueResults = Array.from(new Set(allResults.map(doc => doc.id)))
          .map(id => allResults.find(doc => doc.id === id));

        // Filtrelenmiş sonuçları sayfalandır
        const totalVideos = uniqueResults.length;
        setTotalPages(Math.ceil(totalVideos / videosPerPage));

        const startIndex = (currentPage - 1) * videosPerPage;
        const currentPageDocs = uniqueResults.slice(startIndex, startIndex + videosPerPage);
        
        const videosList = currentPageDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setVideos(videosList);
      } else {
        // Normal sayfalama
        const totalSnapshot = await getDocs(collection(db, 'videos'));
        const totalVideos = totalSnapshot.size;
        setTotalPages(Math.ceil(totalVideos / videosPerPage));

        const startIndex = (currentPage - 1) * videosPerPage;
        const querySnapshot = await getDocs(
          query(
            videosRef,
            orderBy('createdAt', 'desc'),
            limit(startIndex + videosPerPage)
          )
        );

        const allDocs = querySnapshot.docs;
        const currentPageDocs = allDocs.slice(startIndex, startIndex + videosPerPage);
        
        const videosList = currentPageDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setVideos(videosList);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('An error occurred while fetching videos.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, videosPerPage]);

  // Fetch videos on mount and when page changes
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handlePageChange = (page) => {
    // Update URL with new page number
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page);
    navigate({ search: newSearchParams.toString() });
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Ad */}
      <div className="mb-6">
        <AdDisplay position="header" />
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-4">All Videos</h2>
          
          {videos.length === 0 ? (
            <div className="bg-dark-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No videos found.</p>
              <button 
                onClick={fetchVideos}
                className="btn btn-primary flex items-center mx-auto"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  {/* Previous Page Button */}
                  {currentPage > 1 && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white transition-all duration-200"
                    >
                      ←
                    </button>
                  )}

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        currentPage === i + 1
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-400 px-2">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white transition-all duration-200"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  {/* Next Page Button */}
                  {currentPage < totalPages && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white transition-all duration-200"
                    >
                      →
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Video Before Ad */}
      <div className="my-8">
        <AdDisplay position="video-before" />
      </div>
    </div>
  );
};

export default Home; 