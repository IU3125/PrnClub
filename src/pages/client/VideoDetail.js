import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon, 
  HandThumbDownIcon as HandThumbDownSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';

const VideoDetail = () => {
  const { id } = useParams();
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
      } else if (videoData.pornstars && videoData.pornstars.length > 0) {
        // If no tags, get by pornstars
        relatedQuery = query(
          collection(db, 'videos'),
          where('pornstars', 'array-contains-any', videoData.pornstars)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{error}</p>
        <Link to="/" className="mt-4 inline-block btn btn-primary">
          Return to Home Page
        </Link>
      </div>
    );
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
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-screen-xl">
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
        <div className="w-full">
          {/* Video Before Ad */}
          <div className="mb-4">
            <AdDisplay position="video-before" />
          </div>
          
          {/* Video Player and Info */}
          <div className="bg-dark-700 rounded-lg overflow-hidden mb-6 w-full">
            {/* Video Player */}
            <div className="relative w-full">
              {video.iframeCode ? (
                <div 
                  className="w-full aspect-video relative overflow-hidden" 
                  dangerouslySetInnerHTML={{ 
                    __html: video.iframeCode
                      .replace('<iframe', '<iframe id="videoIframe" ref={iframeRef}')
                      .replace('<iframe', '<iframe style="width:100%;height:100%;position:absolute;top:0;left:0;border:0;"')
                      .replace('</iframe>', `<script>
                        // Video oynatıcı olaylarını dinle ve ana pencereye ilet
                        document.addEventListener('DOMContentLoaded', function() {
                          // YouTube API'sini yükle
                          var tag = document.createElement('script');
                          tag.src = "https://www.youtube.com/iframe_api";
                          var firstScriptTag = document.getElementsByTagName('script')[0];
                          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                          
                          // Doğrudan video elementi varsa
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
                          
                          // YouTube iframe API için
                          window.onYouTubeIframeAPIReady = function() {
                            var iframes = document.getElementsByTagName('iframe');
                            for (var i = 0; i < iframes.length; i++) {
                              if (iframes[i].src.indexOf('youtube.com') > -1) {
                                var player = new YT.Player(iframes[i], {
                                  events: {
                                    'onStateChange': function(event) {
                                      if (event.data == YT.PlayerState.PLAYING) {
                                        window.parent.postMessage(JSON.stringify({event: 'play'}), '*');
                                      } else if (event.data == YT.PlayerState.PAUSED) {
                                        window.parent.postMessage(JSON.stringify({event: 'pause'}), '*');
                                      } else if (event.data == YT.PlayerState.ENDED) {
                                        window.parent.postMessage(JSON.stringify({event: 'end'}), '*');
                                      }
                                    }
                                  }
                                });
                              }
                            }
                          };
                        });
                      </script></iframe>`) 
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  className="w-full aspect-video object-contain"
                  controls
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  onTimeUpdate={handleTimeUpdate}
                  preload="auto"
                />
              )}
            </div>
            
            {/* Video After Ad - Moved inside video container for better positioning */}
            <div className="w-full">
              <AdDisplay position="video-after" />
            </div>
            
            {/* Video Info */}
            <div className="p-4">
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              
              <div className="flex flex-wrap items-center justify-between mb-4">
                <div className="flex items-center text-gray-400 text-sm">
                  <span>{formatViewCount(video.views || video.viewCount)} views</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <button
                    onClick={handleLike}
                    className={`flex items-center ${userInteraction.liked ? 'text-primary-500' : 'text-gray-400 hover:text-white'}`}
                  >
                    {userInteraction.liked ? (
                      <HandThumbUpSolidIcon className="h-5 w-5 mr-1" />
                    ) : (
                      <HandThumbUpIcon className="h-5 w-5 mr-1" />
                    )}
                    <span>{formatCount(video.likeCount || 0)}</span>
                  </button>
                  
                  <button
                    onClick={handleDislike}
                    className={`flex items-center ${userInteraction.disliked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                  >
                    {userInteraction.disliked ? (
                      <HandThumbDownSolidIcon className="h-5 w-5 mr-1" />
                    ) : (
                      <HandThumbDownIcon className="h-5 w-5 mr-1" />
                    )}
                    <span>{formatCount(video.dislikeCount || 0)}</span>
                  </button>
                  
                  <button
                    onClick={handleSaveVideo}
                    className="flex items-center justify-center p-1 rounded-full hover:bg-gray-800"
                    title={userInteraction.featured ? "Remove from favorites" : "Add to favorites"}
                  >
                    {userInteraction.featured ? (
                      <HeartSolidIcon className="h-7 w-7 text-red-500" />
                    ) : (
                      <HeartIcon className="h-7 w-7 text-gray-300 hover:text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Description */}
          <div className="mt-4 border-t border-dark-600 pt-4">
            <div className="mt-4">
              <div className={`text-gray-300 ${showFullDescription ? '' : 'line-clamp-2'}`}>
                {video.description || 'No description provided.'}
              </div>
              
              {video.description && video.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary-500 text-sm mt-1 hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
            
            {/* Categories and Pornstars */}
            <div className="mt-4 flex flex-wrap gap-2">
              {video.categories && video.categories.map(category => (
                <Link
                  key={category}
                  to={`/?category=${category}`}
                  className="bg-dark-600 hover:bg-dark-500 text-sm text-gray-300 px-2 py-1 rounded"
                >
                  {category}
                </Link>
              ))}
              
              {video.pornstars && video.pornstars.map(pornstar => (
                <Link
                  key={pornstar}
                  to={`/?pornstar=${pornstar}`}
                  className="bg-primary-900 hover:bg-primary-800 text-sm text-primary-300 px-2 py-1 rounded"
                >
                  {pornstar}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Comments Section */}
      <div className="bg-dark-700 rounded-lg p-4 mb-6">
        <CommentSection videoId={id} />
      </div>
      
      {/* Related Videos */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Related Videos</h2>
        {relatedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {relatedVideos.map(relatedVideo => (
              <VideoCard key={relatedVideo.id} video={relatedVideo} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No related videos found.</p>
        )}
      </div>
      
      {/* Footer Ad */}
      <div className="mt-8">
        <AdDisplay position="footer" />
      </div>
      
      {/* Left Ad - Fixed Position */}
      <AdDisplay position="left" />
      
      {/* Right Ad - Fixed Position */}
      <AdDisplay position="right" />
    </div>
  );
};

export default VideoDetail; 