import React from 'react';
import { collection, getDocs, query, limit, orderBy, startAfter, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import VideoCard from '../../components/video/VideoCard';

const AllVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const videosPerPage = 16; // 4x4 grid
  const navigate = useNavigate();
  const { page } = useParams();
  const currentPage = parseInt(page) || 1;

  useEffect(() => {
    if (isNaN(currentPage) || currentPage < 1) {
      navigate('/videos/1', { replace: true });
      return;
    }
    fetchVideos();
  }, [currentPage, navigate]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const videosRef = collection(db, 'videos');
      
      // Get total count first
      const snapshot = await getCountFromServer(videosRef);
      const totalVideos = snapshot.data().count;
      const calculatedTotalPages = Math.ceil(totalVideos / videosPerPage);
      setTotalPages(calculatedTotalPages);

      // If current page is greater than total pages, redirect to last page
      if (currentPage > calculatedTotalPages) {
        navigate(`/videos/${calculatedTotalPages}`, { replace: true });
        return;
      }

      // Query for current page
      let q;
      if (currentPage === 1) {
        // First page query
        q = query(
          videosRef,
          orderBy('createdAt', 'desc'),
          limit(videosPerPage)
        );
      } else {
        // Get the documents for the previous pages first
        const prevPageQuery = query(
          videosRef,
          orderBy('createdAt', 'desc'),
          limit((currentPage - 1) * videosPerPage)
        );
        const prevPageDocs = await getDocs(prevPageQuery);
        const lastVisible = prevPageDocs.docs[prevPageDocs.docs.length - 1];

        // Then get the documents for the current page
        q = query(
          videosRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(videosPerPage)
        );
      }

      const currentPageSnapshot = await getDocs(q);
      const videosList = currentPageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setVideos(videosList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    navigate(`/videos/${newPage}`);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">All Videos</h1>
      
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {videos.map((video) => (
          <Link
            key={video.id}
            to={`/video/${video.id}`}
            state={{ from: `/videos/${currentPage}` }}
          >
            <VideoCard video={video} />
          </Link>
        ))}
        {/* Fill empty spaces with placeholder divs to maintain grid layout */}
        {videos.length < videosPerPage && 
          Array.from({ length: videosPerPage - videos.length }).map((_, index) => (
            <div 
              key={`empty-${index}`} 
              className="aspect-video bg-dark-800 rounded-lg opacity-30 border border-dark-700"
            />
          ))
        }
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

          {/* First Page */}
          {currentPage > 3 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white transition-all duration-200"
              >
                1
              </button>
              {currentPage > 4 && <span className="text-gray-400 px-2">...</span>}
            </>
          )}

          {/* Page Numbers */}
          {Array.from(
            { length: Math.min(3, totalPages) },
            (_, i) => {
              let pageNum;
              if (currentPage === 1) {
                pageNum = i + 1;
              } else if (currentPage === totalPages) {
                pageNum = totalPages - 2 + i;
              } else {
                pageNum = currentPage - 1 + i;
              }
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
          ).filter(Boolean)}

          {/* Last Page */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="text-gray-400 px-2">...</span>}
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
    </div>
  );
};

export default AllVideos; 