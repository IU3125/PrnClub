import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import VideoCard from '../../components/video/VideoCard';
import { 
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import AdDisplay from '../../components/advertisements/AdDisplay';

const Featured = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error occurred while fetching user data:', error);
        setError('An error occurred while fetching user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch featured videos
  useEffect(() => {
    const fetchFeaturedVideos = async () => {
      if (!userData || !userData.featured || userData.featured.length === 0) {
        setFeaturedVideos([]);
        return;
      }

      try {
        const featuredVideosData = [];
        
        for (const videoId of userData.featured) {
          const videoDoc = await getDoc(doc(db, 'videos', videoId));
          if (videoDoc.exists()) {
            featuredVideosData.push({
              id: videoDoc.id,
              ...videoDoc.data()
            });
          }
        }
        
        setFeaturedVideos(featuredVideosData);
      } catch (error) {
        console.error('Error occurred while fetching featured videos:', error);
      }
    };

    fetchFeaturedVideos();
  }, [userData]);

  // Remove video from favorites
  const handleRemoveFromFeatured = async (videoId) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        featured: arrayRemove(videoId)
      });
      
      // Update user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      // Remove video from list
      setFeaturedVideos(featuredVideos.filter(video => video.id !== videoId));
      
      setSuccess('Video removed from favorites.');
    } catch (error) {
      console.error('Error occurred while removing video from favorites:', error);
      setError('An error occurred while removing video from favorites.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Favorite Videos</h1>
        <p className="text-gray-400 mt-2">Your favorite videos collection</p>
      </div>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {/* Favorite Videos */}
      <div>
        {featuredVideos.length === 0 ? (
          <div className="bg-dark-700 rounded-lg p-8 text-center">
            <HeartIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Favorite Videos</h3>
            <p className="text-gray-400">
              You haven't added any videos to your favorites list yet.
              Browse videos and click the heart icon to add them to your favorites list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredVideos.map(video => (
              <div key={video.id} className="relative group">
                <VideoCard video={video} />
                <button
                  onClick={() => handleRemoveFromFeatured(video.id)}
                  className="absolute top-2 right-2 bg-black bg-opacity-70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from favorites"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Left Ad - Fixed Position */}
      <AdDisplay position="left" />
      
      {/* Right Ad - Fixed Position */}
      <AdDisplay position="right" />
    </div>
  );
};

export default Featured; 