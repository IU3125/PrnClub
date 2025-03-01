import React, { useState, useEffect, useCallback } from 'react';
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
  increment 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import VideoCard from '../../components/video/VideoCard';
import CommentSection from '../../components/video/CommentSection';
import { 
  EyeIcon, 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  StarIcon,
  TagIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon, 
  HandThumbDownIcon as HandThumbDownSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';

const VideoDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    disliked: false,
    featured: false
  });

  // İlgili videoları getir
  const fetchRelatedVideos = useCallback(async (videoData) => {
    try {
      // Etiketlere göre ilgili videoları getir
      let relatedQuery;
      
      if (videoData.tags && videoData.tags.length > 0) {
        relatedQuery = query(
          collection(db, 'videos'),
          where('tags', 'array-contains-any', videoData.tags.slice(0, 10))
        );
      } else if (videoData.pornstars && videoData.pornstars.length > 0) {
        // Etiket yoksa oyunculara göre getir
        relatedQuery = query(
          collection(db, 'videos'),
          where('pornstars', 'array-contains-any', videoData.pornstars)
        );
      } else {
        // Hiçbiri yoksa kategorilere göre getir
        relatedQuery = query(
          collection(db, 'videos'),
          where('categories', 'array-contains-any', videoData.categories || [])
        );
      }
      
      const relatedSnapshot = await getDocs(relatedQuery);
      let relatedList = relatedSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(video => video.id !== id) // Mevcut videoyu hariç tut
        .slice(0, 8); // En fazla 8 video
      
      setRelatedVideos(relatedList);
    } catch (error) {
      console.error('İlgili videolar getirilirken hata oluştu:', error);
    }
  }, [id]);

  // Video detaylarını getir
  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const videoDoc = await getDoc(doc(db, 'videos', id));
        
        if (videoDoc.exists()) {
          const videoData = { id: videoDoc.id, ...videoDoc.data() };
          setVideo(videoData);
          
          // İzlenme sayısını artır
          await updateDoc(doc(db, 'videos', id), {
            viewCount: increment(1)
          });
          
          // Kullanıcı etkileşimlerini kontrol et
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
          
          // İlgili videoları getir
          fetchRelatedVideos(videoData);
        } else {
          setError('Video bulunamadı.');
        }
      } catch (error) {
        console.error('Video getirilirken hata oluştu:', error);
        setError('Video yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, currentUser, fetchRelatedVideos]);

  // Beğenme işlemi
  const handleLike = async () => {
    if (!currentUser) {
      alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
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
      console.error('Beğenme işlemi sırasında hata oluştu:', error);
    }
  };

  // Beğenmeme işlemi
  const handleDislike = async () => {
    if (!currentUser) {
      alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
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
      console.error('Beğenmeme işlemi sırasında hata oluştu:', error);
    }
  };

  // Favorilere ekleme/çıkarma işlemi
  const handleToggleFeatured = async () => {
    if (!currentUser) {
      alert('Bu işlemi gerçekleştirmek için giriş yapmalısınız.');
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
      } else {
        // Favorilere ekle
        await updateDoc(userRef, {
          featured: arrayUnion(id)
        });
        setUserInteraction({ ...userInteraction, featured: true });
      }
    } catch (error) {
      console.error('Favori işlemi sırasında hata oluştu:', error);
    }
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
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Video bulunamadı.</p>
        <Link to="/" className="mt-4 inline-block btn btn-primary">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video ve Bilgiler */}
      <div className="lg:col-span-2">
        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden aspect-video mb-4">
          <iframe
            src={video.videoUrl}
            title={video.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Video Başlığı ve Etkileşim */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
          
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center text-gray-400 space-x-4">
              <span className="flex items-center">
                <EyeIcon className="w-5 h-5 mr-1" />
                {video.viewCount} görüntülenme
              </span>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleLike}
                  className={`flex items-center ${userInteraction.liked ? 'text-primary-500' : 'text-gray-400 hover:text-white'}`}
                >
                  {userInteraction.liked ? (
                    <HandThumbUpSolidIcon className="w-5 h-5 mr-1" />
                  ) : (
                    <HandThumbUpIcon className="w-5 h-5 mr-1" />
                  )}
                  {video.likeCount || 0}
                </button>
                
                <button 
                  onClick={handleDislike}
                  className={`flex items-center ${userInteraction.disliked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                >
                  {userInteraction.disliked ? (
                    <HandThumbDownSolidIcon className="w-5 h-5 mr-1" />
                  ) : (
                    <HandThumbDownIcon className="w-5 h-5 mr-1" />
                  )}
                  {video.dislikeCount || 0}
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleToggleFeatured}
              className={`flex items-center px-3 py-1 rounded-md ${
                userInteraction.featured 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
              }`}
              disabled={!currentUser}
            >
              {userInteraction.featured ? (
                <StarSolidIcon className="w-5 h-5 mr-1" />
              ) : (
                <StarIcon className="w-5 h-5 mr-1" />
              )}
              {userInteraction.featured ? 'Favorilerde' : 'Favorilere Ekle'}
            </button>
          </div>
        </div>

        {/* Video Bilgileri */}
        <div className="bg-dark-700 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-300 mb-2">{video.description}</p>
              <p className="text-gray-400 text-sm">Yükleyen: {video.uploader}</p>
            </div>
          </div>
          
          {/* Etiketler */}
          {video.tags && video.tags.length > 0 && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <TagIcon className="w-5 h-5 mr-1" />
                Etiketler
              </h3>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <Link 
                    key={index} 
                    to={`/?search=${tag}`}
                    className="px-3 py-1 bg-dark-600 text-gray-300 rounded-md text-sm hover:bg-dark-500"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Oyuncular */}
          {video.pornstars && video.pornstars.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-2 flex items-center">
                <UserIcon className="w-5 h-5 mr-1" />
                Oyuncular
              </h3>
              <div className="flex flex-wrap gap-2">
                {video.pornstars.map((pornstar, index) => (
                  <Link 
                    key={index} 
                    to={`/?pornstar=${pornstar}`}
                    className="px-3 py-1 bg-dark-600 text-gray-300 rounded-md text-sm hover:bg-dark-500"
                  >
                    {pornstar}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Yorumlar */}
        <CommentSection videoId={id} />
      </div>

      {/* İlgili Videolar */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">İlgili Videolar</h2>
        <div className="space-y-4">
          {relatedVideos.length > 0 ? (
            relatedVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          ) : (
            <p className="text-gray-400">İlgili video bulunamadı.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail; 