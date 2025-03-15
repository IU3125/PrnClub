import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment,
  setDoc,
  addDoc,
  serverTimestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import VideoCard from '../../components/video/VideoCard';
import CommentSection from '../../components/video/CommentSection';
import AdDisplay from '../../components/advertisements/AdDisplay';
import { 
  EyeIcon, 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  HeartIcon,
  TagIcon,
  UserIcon,
  ShareIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon, 
  HandThumbDownIcon as HandThumbDownSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';

const VideoDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, updateUserData } = useAuth();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    disliked: false,
    featured: false
  });
  const [showFullDescription, setShowFullDescription] = useState(false);
  const videoRef = useRef(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const iframeRef = useRef(null);
  const [comments, setComments] = useState([]);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // İlgili videoları getir
  const fetchRelatedVideos = useCallback(async (videoData) => {
    try {
      // Get related videos based on tags
      let relatedQuery;
      
      if (videoData.tags && videoData.tags.length > 0) {
        relatedQuery = query(
          collection(db, 'videos'),
          where('tags', 'array-contains-any', videoData.tags.slice(0, 10))
        );
      } else if (videoData.actors && videoData.actors.length > 0) {
        // If no tags, get by actors
        relatedQuery = query(
          collection(db, 'videos'),
          where('actors', 'array-contains-any', videoData.actors)
        );
      } else {
        // If neither, get by categories
        relatedQuery = query(
          collection(db, 'videos'),
          where('categories', 'array-contains-any', videoData.categories || [])
        );
      }
      
      const relatedSnapshot = await getDocs(relatedQuery);
      let relatedList = relatedSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(video => video.id !== id) // Exclude current video
        .slice(0, 8); // Maximum 8 videos
      
      setRelatedVideos(relatedList);
    } catch (error) {
      console.error('Error fetching related videos:', error);
    }
  }, [id]);

  // Get video details
  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const videoDoc = await getDoc(doc(db, 'videos', id));
        
        if (videoDoc.exists()) {
          const videoData = { id: videoDoc.id, ...videoDoc.data() };
          setVideo(videoData);
          
          // Increment view count
          await updateDoc(doc(db, 'videos', id), {
            viewCount: increment(1)
          });
          
          // Update category view counts
          if (videoData.categories && videoData.categories.length > 0) {
            for (const categoryName of videoData.categories) {
              // Get category reference
              const categoryQuery = query(
                collection(db, 'categories'),
                where('name', '==', categoryName)
              );
              
              const categorySnapshot = await getDocs(categoryQuery);
              
              if (!categorySnapshot.empty) {
                // Category exists, update view count
                const categoryDoc = categorySnapshot.docs[0];
                await updateDoc(doc(db, 'categories', categoryDoc.id), {
                  viewCount: increment(1)
                });
              } else {
                // Category doesn't exist in the categories collection, create it
                await addDoc(collection(db, 'categories'), {
                  name: categoryName,
                  viewCount: 1,
                  createdAt: serverTimestamp()
                });
              }
            }
          }
          
          // Check user interactions
          if (currentUser) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserInteraction({
                liked: userData.likedVideos?.includes(id) || false,
                disliked: userData.dislikedVideos?.includes(id) || false,
                featured: userData.featured?.includes(id) || false
              });
            }
          }
          
          // Get related videos
          fetchRelatedVideos(videoData);
        } else {
          setError('Video not found.');
        }
      } catch (error) {
        console.error('Error fetching video:', error);
        setError('An error occurred while loading the video.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, currentUser, fetchRelatedVideos]);

  // İframe reklamlarını temizle
  useEffect(() => {
    // Video oynatıldığında reklam gösterme işlemi
    const handleVideoPlay = () => {
      // Video-before ve video-after reklamlarını göster
      const videoBeforeAds = document.querySelectorAll('.ad-video-before');
      const videoAfterAds = document.querySelectorAll('.ad-video-after');
      
      videoBeforeAds.forEach(ad => {
        ad.style.display = 'block';
      });
      
      // Video bittiğinde video-after reklamlarını göster
      if (videoRef.current) {
        videoRef.current.addEventListener('ended', () => {
          videoAfterAds.forEach(ad => {
            ad.style.display = 'block';
          });
        });
      }
    };

    // İframe için mesaj dinleyicisi ekle
    const handleIframeMessage = (event) => {
      // İframe'den gelen mesajları dinle (play, pause, end gibi)
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'play') {
            handleVideoPlay();
          } else if (data.event === 'end') {
            // Video bittiğinde video-after reklamlarını göster
            const videoAfterAds = document.querySelectorAll('.ad-video-after');
            videoAfterAds.forEach(ad => {
              ad.style.display = 'block';
            });
          }
        } catch (e) {
          // JSON parse hatası, mesaj bizim için değil
        }
      }
    };

    // Mesaj dinleyicisini ekle
    window.addEventListener('message', handleIframeMessage);

    // Video oynatıcısı için event listener ekle
    if (videoRef.current) {
      videoRef.current.addEventListener('play', handleVideoPlay);
    }

    // Temizleme fonksiyonu
    return () => {
      window.removeEventListener('message', handleIframeMessage);
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
        videoRef.current.removeEventListener('ended', () => {});
      }
    };
  }, [video]);

  // Fix for videoRef warning in useEffect
  useEffect(() => {
    const currentVideoRef = videoRef.current;
    
    if (currentVideoRef) {
      currentVideoRef.addEventListener('play', handlePlay);
      currentVideoRef.addEventListener('pause', handlePause);
      currentVideoRef.addEventListener('ended', handleEnded);
      currentVideoRef.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        if (currentVideoRef) {
          currentVideoRef.removeEventListener('play', handlePlay);
          currentVideoRef.removeEventListener('pause', handlePause);
          currentVideoRef.removeEventListener('ended', handleEnded);
          currentVideoRef.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, []);

  // Beğenme işlemi
  const handleLike = async () => {
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'You need to login to perform this action.' });
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const videoRef = doc(db, 'videos', id);
      
      if (userInteraction.liked) {
        // Beğeniyi kaldır
        await updateDoc(userRef, {
          likedVideos: arrayRemove(id)
        });
        await updateDoc(videoRef, {
          likeCount: increment(-1)
        });
        setUserInteraction({ ...userInteraction, liked: false });
      } else {
        // Beğen
        if (userInteraction.disliked) {
          // Önce beğenmemeyi kaldır
          await updateDoc(userRef, {
            dislikedVideos: arrayRemove(id)
          });
          await updateDoc(videoRef, {
            dislikeCount: increment(-1)
          });
          setUserInteraction({ ...userInteraction, disliked: false });
        }
        
        // Beğeni ekle
        await updateDoc(userRef, {
          likedVideos: arrayUnion(id)
        });
        await updateDoc(videoRef, {
          likeCount: increment(1)
        });
        setUserInteraction({ ...userInteraction, liked: true });
      }
      
      // Video bilgilerini güncelle
      const updatedVideoDoc = await getDoc(videoRef);
      setVideo({ ...video, ...updatedVideoDoc.data() });
    } catch (error) {
      console.error('Error during like operation:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while updating like status' });
    }
  };

  // Beğenmeme işlemi
  const handleDislike = async () => {
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'You need to login to perform this action.' });
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const videoRef = doc(db, 'videos', id);
      
      if (userInteraction.disliked) {
        // Beğenmemeyi kaldır
        await updateDoc(userRef, {
          dislikedVideos: arrayRemove(id)
        });
        await updateDoc(videoRef, {
          dislikeCount: increment(-1)
        });
        setUserInteraction({ ...userInteraction, disliked: false });
      } else {
        // Beğenme
        if (userInteraction.liked) {
          // Önce beğeniyi kaldır
          await updateDoc(userRef, {
            likedVideos: arrayRemove(id)
          });
          await updateDoc(videoRef, {
            likeCount: increment(-1)
          });
          setUserInteraction({ ...userInteraction, liked: false });
        }
        
        // Beğenmeme ekle
        await updateDoc(userRef, {
          dislikedVideos: arrayUnion(id)
        });
        await updateDoc(videoRef, {
          dislikeCount: increment(1)
        });
        setUserInteraction({ ...userInteraction, disliked: true });
      }
      
      // Video bilgilerini güncelle
      const updatedVideoDoc = await getDoc(videoRef);
      setVideo({ ...video, ...updatedVideoDoc.data() });
    } catch (error) {
      console.error('Error during dislike operation:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while updating dislike status' });
    }
  };

  // Favorilere ekleme/çıkarma işlemi
  const handleSaveVideo = async () => {
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'You need to login to perform this action.' });
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (userInteraction.featured) {
        // Favorilerden çıkar
        await updateDoc(userRef, {
          featured: arrayRemove(id)
        });
        setUserInteraction({ ...userInteraction, featured: false });
        setStatusMessage({ type: 'success', text: 'Video removed from favorites' });
      } else {
        // Favorilere ekle
        await updateDoc(userRef, {
          featured: arrayUnion(id)
        });
        setUserInteraction({ ...userInteraction, featured: true });
        setStatusMessage({ type: 'success', text: 'Video added to favorites' });
        
        // Kategori izlenme sayılarını güncelle
        if (video.categories && video.categories.length > 0) {
          try {
            const categoryRef = doc(db, 'statistics', 'categories');
            const categoryDoc = await getDoc(categoryRef);
            
            if (categoryDoc.exists()) {
              const categoryStats = categoryDoc.data();
              
              for (const category of video.categories) {
                const currentCount = categoryStats[category] || 0;
                await updateDoc(categoryRef, {
                  [category]: currentCount + 1
                });
              }
            } else {
              // İlk kez oluştur
              const categoryStats = {};
              for (const category of video.categories) {
                categoryStats[category] = 1;
              }
              await setDoc(doc(db, 'statistics', 'categories'), categoryStats);
            }
          } catch (categoryError) {
            console.error('Error updating category stats:', categoryError);
            // Continue execution even if category update fails
          }
        }
      }
      
      // Kullanıcı verilerini güncelle
      await updateUserData();
    } catch (error) {
      console.error('Error during favorite operation:', error);
      setStatusMessage({ type: 'error', text: 'An error occurred while updating favorites' });
    }
  };

  // Video playback operations
  const handlePlay = () => {
    console.log('Video playing');
  };

  const handlePause = () => {
    console.log('Video paused');
  };

  const handleEnded = () => {
    console.log('Video ended');
  };

  const handleTimeUpdate = () => {
    // Tracking watch time can be implemented here
  };

  // Subscribe operation
  const handleSubscribe = async () => {
    if (!currentUser) {
      alert('You need to login to perform this action.');
      return;
    }

    try {
      // Subscribe/unsubscribe operations will be implemented here
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Error during subscription operation:', error);
    }
  };

  // Yardımcı fonksiyonlar
  const formatViewCount = (count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatCount = (count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleBackClick = () => {
    if (location.state?.from === '/categories' || location.state?.from === '/pornstars') {
      navigate('/videos');
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Video not found.</p>
        <Link to="/" className="mt-4 inline-block btn btn-primary">
          Return to Home Page
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {(location.state?.from === '/categories' || location.state?.from === '/pornstars') && (
        <button
          onClick={handleBackClick}
          className="mb-4 flex items-center text-blue-500 hover:text-blue-600"
        >
          <span className="mr-2">←</span> Back
        </button>
      )}
      {/* Status Message */}
      {statusMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          statusMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {statusMessage.text}
        </div>
      )}
      
      {/* Header Ad */}
      <div className="mb-4">
        <AdDisplay position="header" />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Video and Info */}
          <div className="flex-1 max-w-[1280px]">
            {/* Video Before Ad */}
            <div className="mb-4">
              <AdDisplay position="video-before" />
            </div>
            
            {/* Video Player */}
            <div className="w-full rounded-xl overflow-hidden bg-dark-900">
              {video.iframeCode ? (
                <div 
                  className="w-full aspect-video relative overflow-hidden" 
                  dangerouslySetInnerHTML={{ 
                    __html: video.iframeCode
                      .replace('<iframe', '<iframe id="videoIframe" ref={iframeRef}')
                      .replace('<iframe', '<iframe style="width:100%;height:100%;position:absolute;top:0;left:0;border:0;"')
                      .replace('http://', 'https://')
                      .replace('<iframe', '<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen')
                      .replace('</iframe>', `<script>
                        try {
                          document.addEventListener('DOMContentLoaded', function() {
                            var video = document.querySelector('video');
                            if (video) {
                              video.addEventListener('play', function() {
                                window.parent.postMessage(JSON.stringify({event: 'play'}), '*');
                              });
                              video.addEventListener('pause', function() {
                                window.parent.postMessage(JSON.stringify({event: 'pause'}), '*');
                              });
                              video.addEventListener('ended', function() {
                                window.parent.postMessage(JSON.stringify({event: 'end'}), '*');
                              });
                            }
                          });
                        } catch (e) {
                          console.error('Video player error:', e);
                        }
                      </script></iframe>`) 
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  className="w-full aspect-video object-contain"
                  controls
                  crossOrigin="anonymous"
                  playsInline
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  onTimeUpdate={handleTimeUpdate}
                  preload="auto"
                />
              )}
            </div>
            
            {/* Video After Ad */}
            <div className="w-full mt-4">
              <AdDisplay position="video-after" />
            </div>
            
            {/* Video Info */}
            <div className="mt-3">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight hover:text-primary-400 transition-colors cursor-pointer">{video.title}</h1>
              
              {/* Channel Info and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-b border-dark-700/50">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <EyeIcon className="h-5 w-5" />
                    <span>{formatViewCount(video.views || video.viewCount)} views</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-dark-800 rounded-full p-1 shadow-lg hover:shadow-primary-500/10 transition-all duration-300">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
                        userInteraction.liked 
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                          : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                      }`}
                    >
                      {userInteraction.liked ? (
                        <HandThumbUpSolidIcon className="h-5 w-5" />
                      ) : (
                        <HandThumbUpIcon className="h-5 w-5" />
                      )}
                      <span className="font-medium">{formatCount(video.likeCount || 0)}</span>
                    </button>
                    
                    <div className="h-8 w-px bg-dark-600 mx-1"></div>
                    
                    <button
                      onClick={handleDislike}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
                        userInteraction.disliked 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                          : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                      }`}
                    >
                      {userInteraction.disliked ? (
                        <HandThumbDownSolidIcon className="h-5 w-5" />
                      ) : (
                        <HandThumbDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSaveVideo}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
                      userInteraction.featured 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white shadow-lg hover:shadow-primary-500/10'
                    }`}
                  >
                    {userInteraction.featured ? (
                      <HeartSolidIcon className="h-5 w-5" />
                    ) : (
                      <HeartIcon className="h-5 w-5" />
                    )}
                    <span className="font-medium">Save</span>
                  </button>
                </div>
              </div>
              
              {/* Description and Tags */}
              <div className="mt-6 p-4 bg-dark-800 rounded-2xl hover:bg-dark-700/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-primary-500/5"
                   onClick={() => setShowFullDescription(!showFullDescription)}>
                <div className={`text-gray-300 ${showFullDescription ? '' : 'line-clamp-2'} border-b border-dark-600 pb-4 mb-4`}>
                  {video.description || 'No description provided.'}
                </div>
                
                {video.description && video.description.length > 100 && (
                  <button
                    className="text-primary-400 text-sm mt-3 mb-4 font-medium hover:text-primary-300 transition-colors flex items-center gap-2"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
                
                {/* Categories and Tags */}
                <div className="flex flex-wrap gap-2">
                  {/* Categories */}
                  {video.categories && video.categories.map(category => (
                    <Link
                      key={category}
                      to={`/?category=${category}`}
                      className="bg-dark-700/50 hover:bg-dark-600 text-xs text-gray-300 px-4 py-2 rounded-full transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-primary-500/10 font-medium flex items-center gap-1"
                    >
                      <span className="text-primary-400">#</span>
                      {category}
                    </Link>
                  ))}
                  
                  {/* Tags */}
                  {video.tags && video.tags.map(tag => (
                    <Link
                      key={tag}
                      to={`/?tag=${tag}`}
                      className="bg-dark-800/50 hover:bg-dark-700 text-xs text-gray-400 px-4 py-2 rounded-full transition-all duration-300 hover:text-white hover:shadow-lg hover:shadow-primary-500/10 font-medium flex items-center gap-1"
                    >
                      <span className="text-primary-400">#</span>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Actors Section */}
              {video.actors && video.actors.length > 0 && (
                <div className="mt-4 p-4 bg-dark-800/50 rounded-2xl">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Actors</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.actors.map(actor => (
                      <Link
                        key={actor}
                        to={`/?actor=${actor}`}
                        className="bg-primary-900/30 hover:bg-primary-900/50 text-xs text-primary-300 px-4 py-2 rounded-full transition-all duration-300 hover:text-primary-200 hover:shadow-lg hover:shadow-primary-500/10 font-medium flex items-center gap-1"
                      >
                        <span className="text-primary-400">@</span>
                        {actor}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Comments Section */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-medium text-white">Comments</h3>
                {video.commentCount > 0 && (
                  <span className="text-sm text-gray-400">{formatCount(video.commentCount)}</span>
                )}
              </div>

              {/* Comment Input */}
              <div className="flex gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      placeholder="Add a comment..."
                      rows="1"
                      className="w-full bg-transparent border-b border-dark-600 focus:border-white text-gray-200 placeholder-gray-500 py-1 resize-none focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments && comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{comment.userName || 'Anonymous'}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-300 mt-1">{comment.text}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex items-center gap-1 text-gray-400 hover:text-white">
                            <HandThumbUpIcon className="h-4 w-4" />
                            <span className="text-xs">{formatCount(comment.likes || 0)}</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-400 hover:text-white">
                            <HandThumbDownIcon className="h-4 w-4" />
                          </button>
                          <button className="text-xs font-medium text-gray-400 hover:text-white">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar - Related Videos */}
          <div className="lg:w-[400px] xl:w-[426px]">
            <div className="grid gap-3">
              {relatedVideos.length > 0 ? (
                relatedVideos.map(relatedVideo => (
                  <VideoCard key={relatedVideo.id} video={relatedVideo} />
                ))
              ) : (
                <p className="text-gray-400">No related videos found.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer Ad */}
      <div className="mt-8">
        <AdDisplay position="footer" />
      </div>
    </div>
  );
};

export default VideoDetail; 