import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useForm } from 'react-hook-form';
import VideoCard from '../../components/video/VideoCard';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  KeyIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { currentUser, logout, resetPassword } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const watchPassword = watch("password", "");

  // Kullanıcı verilerini getir
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setValue('displayName', userDoc.data().displayName || '');
        }
      } catch (error) {
        console.error('Kullanıcı verileri getirilirken hata oluştu:', error);
        setError('Kullanıcı verileri getirilirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, setValue]);

  // Öne çıkan videoları getir
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
        console.error('Öne çıkan videolar getirilirken hata oluştu:', error);
      }
    };

    fetchFeaturedVideos();
  }, [userData]);

  // Profil güncelleme
  const handleUpdateProfile = async (data) => {
    setError('');
    setSuccess('');
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: data.displayName
      });
      
      setSuccess('Profil başarıyla güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken hata oluştu:', error);
      setError('Profil güncellenirken bir hata oluştu.');
    }
  };

  // Şifre güncelleme
  const handleUpdatePassword = async (data) => {
    setError('');
    setSuccess('');
    
    try {
      // Firebase Authentication ile şifre güncelleme
      await currentUser.updatePassword(data.password);
      
      setSuccess('Şifreniz başarıyla güncellendi.');
      
      // Form alanlarını temizle
      setValue('password', '');
      setValue('confirmPassword', '');
    } catch (error) {
      console.error('Şifre güncellenirken hata oluştu:', error);
      setError('Şifre güncellenirken bir hata oluştu. Lütfen yakın zamanda giriş yaptığınızdan emin olun.');
    }
  };

  // Şifre sıfırlama e-postası gönder
  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    setResetSent(false);
    
    try {
      await resetPassword(currentUser.email);
      setResetSent(true);
      setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (error) {
      console.error('Şifre sıfırlama e-postası gönderilirken hata oluştu:', error);
      setError('Şifre sıfırlama e-postası gönderilirken bir hata oluştu.');
    }
  };

  // Hesabı devre dışı bırak
  const handleDeactivateAccount = async () => {
    if (deleteConfirmText !== currentUser.email) {
      setError('Hesabınızı devre dışı bırakmak için e-posta adresinizi doğru girmelisiniz.');
      return;
    }
    
    try {
      // Kullanıcı durumunu inactive olarak güncelle
      await updateDoc(doc(db, 'users', currentUser.uid), {
        status: 'inactive',
        deactivatedAt: new Date()
      });
      
      // Kullanıcıyı çıkış yaptır
      await logout();
      
      // Ana sayfaya yönlendir
      navigate('/');
    } catch (error) {
      console.error('Hesap devre dışı bırakılırken hata oluştu:', error);
      setError('Hesabınız devre dışı bırakılırken bir hata oluştu.');
      setShowDeleteModal(false);
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      setError('Çıkış yapılırken bir hata oluştu.');
    }
  };

  // Videoyu favorilerden kaldır
  const handleRemoveFromFeatured = async (videoId) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        featured: arrayRemove(videoId)
      });
      
      // Kullanıcı verilerini güncelle
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      // Videoyu listeden kaldır
      setFeaturedVideos(featuredVideos.filter(video => video.id !== videoId));
      
      setSuccess('Video favorilerden kaldırıldı.');
    } catch (error) {
      console.error('Video favorilerden kaldırılırken hata oluştu:', error);
      setError('Video favorilerden kaldırılırken bir hata oluştu.');
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profil</h1>
      
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
      
      <div className="bg-dark-700 rounded-lg overflow-hidden">
        {/* Sekmeler */}
        <div className="flex border-b border-dark-600">
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === 'profile'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === 'security'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('security')}
          >
            Güvenlik
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === 'featured'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('featured')}
          >
            Favoriler
          </button>
        </div>
        
        {/* Profil Sekmesi */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex items-center mb-6">
              <UserCircleIcon className="w-16 h-16 text-gray-400 mr-4" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {userData?.displayName || 'Kullanıcı'}
                </h2>
                <p className="text-gray-400">{currentUser.email}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(handleUpdateProfile)}>
              <div className="mb-4">
                <label htmlFor="displayName" className="block text-gray-300 mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  id="displayName"
                  type="text"
                  className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  {...register('displayName', { 
                    required: 'Kullanıcı adı gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Kullanıcı adı en az 3 karakter olmalıdır'
                    }
                  })}
                />
                {errors.displayName && (
                  <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md mb-4 md:mb-0"
                >
                  Profili Güncelle
                </button>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-dark-600 hover:bg-dark-500 text-white px-4 py-2 rounded-md"
                >
                  Çıkış Yap
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Güvenlik Sekmesi */}
        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Şifre Değiştir</h2>
            
            <form onSubmit={handleSubmit(handleUpdatePassword)} className="mb-8">
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-300 mb-2">
                  Yeni Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  {...register('password', { 
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır'
                    }
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">
                  Şifreyi Onayla
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  {...register('confirmPassword', { 
                    required: 'Şifre onayı gereklidir',
                    validate: value => value === watchPassword || 'Şifreler eşleşmiyor'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
                >
                  Şifreyi Güncelle
                </button>
                
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-primary-500 hover:text-primary-400"
                >
                  Şifremi Unuttum
                </button>
              </div>
            </form>
            
            <div className="border-t border-dark-600 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Hesabı Devre Dışı Bırak</h2>
              <p className="text-gray-400 mb-4">
                Hesabınızı devre dışı bıraktığınızda, tüm verileriniz korunacak ancak hesabınıza erişiminiz olmayacaktır. 
                Daha sonra tekrar giriş yapmak isterseniz, yönetici ile iletişime geçmeniz gerekecektir.
              </p>
              
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Hesabımı Devre Dışı Bırak
              </button>
            </div>
          </div>
        )}
        
        {/* Favoriler Sekmesi */}
        {activeTab === 'featured' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Favori Videolarım</h2>
            
            {featuredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredVideos.map(video => (
                  <div key={video.id} className="relative">
                    <VideoCard video={video} />
                    <button
                      onClick={() => handleRemoveFromFeatured(video.id)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                      title="Favorilerden Kaldır"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Henüz favori videonuz bulunmamaktadır.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Hesap Silme Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-700 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Hesabı Devre Dışı Bırak</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center bg-red-500 bg-opacity-20 text-red-500 p-3 rounded-md mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
                <p>Bu işlem geri alınamaz. Hesabınız devre dışı bırakıldıktan sonra, tekrar erişim için yönetici ile iletişime geçmeniz gerekecektir.</p>
              </div>
              
              <p className="text-gray-300 mb-4">
                Hesabınızı devre dışı bırakmak istediğinizi onaylamak için, lütfen e-posta adresinizi aşağıya yazın:
              </p>
              
              <input
                type="email"
                className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white mb-4"
                placeholder={currentUser.email}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-dark-600 hover:bg-dark-500 text-white px-4 py-2 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                disabled={deleteConfirmText !== currentUser.email}
              >
                Hesabımı Devre Dışı Bırak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 