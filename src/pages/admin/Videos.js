import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  FilmIcon, 
  TrashIcon, 
  PencilIcon, 
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  EyeIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Düzenleme için state
  const [editingVideo, setEditingVideo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    categories: [],
    pornstars: [],
    tags: [],
    featured: false
  });

  // Videoları getir
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const videosQuery = query(
          collection(db, 'videos'),
          orderBy('createdAt', 'desc')
        );
        
        const videosSnapshot = await getDocs(videosQuery);
        const videosList = videosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setVideos(videosList);
      } catch (error) {
        console.error('Videolar getirilirken hata oluştu:', error);
        setError('Videolar getirilirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Video sil
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Bu videoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      
      // Videoyu listeden kaldır
      setVideos(videos.filter(video => video.id !== videoId));
      
      setSuccess('Video başarıyla silindi.');
    } catch (error) {
      console.error('Video silinirken hata oluştu:', error);
      setError('Video silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme modunu aç
  const handleEditVideo = (video) => {
    setEditingVideo(video.id);
    setEditForm({
      title: video.title || '',
      description: video.description || '',
      categories: video.categories || [],
      pornstars: video.pornstars || [],
      tags: video.tags || [],
      featured: video.featured || false
    });
  };

  // Video güncelle
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!editForm.title.trim()) {
      setError('Video başlığı boş olamaz.');
      return;
    }
    
    setLoading(true);
    try {
      const videoRef = doc(db, 'videos', editingVideo);
      const updatedData = {
        ...editForm,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(videoRef, updatedData);
      
      // Videoları listesini güncelle
      setVideos(videos.map(video => 
        video.id === editingVideo 
          ? { ...video, ...updatedData } 
          : video
      ));
      
      setEditingVideo(null);
      setSuccess('Video başarıyla güncellendi.');
    } catch (error) {
      console.error('Video güncellenirken hata oluştu:', error);
      setError('Video güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Tarih biçimlendirme
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Belirtilmemiş';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: tr });
  };

  // Süre biçimlendirme
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Arama filtresi
  const filteredVideos = videos.filter(video => {
    const searchLower = searchQuery.toLowerCase();
    return (
      video.title?.toLowerCase().includes(searchLower) ||
      video.description?.toLowerCase().includes(searchLower) ||
      video.categories?.some(category => category.toLowerCase().includes(searchLower)) ||
      video.pornstars?.some(pornstar => pornstar.toLowerCase().includes(searchLower)) ||
      video.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Kategori, pornstar veya tag listesini düzenle
  const handleArrayItemChange = (type, index, value) => {
    const newArray = [...editForm[type]];
    newArray[index] = value;
    setEditForm({...editForm, [type]: newArray});
  };

  // Kategori, pornstar veya tag ekle
  const handleAddArrayItem = (type) => {
    setEditForm({...editForm, [type]: [...editForm[type], '']});
  };

  // Kategori, pornstar veya tag sil
  const handleRemoveArrayItem = (type, index) => {
    const newArray = [...editForm[type]];
    newArray.splice(index, 1);
    setEditForm({...editForm, [type]: newArray});
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Video Yönetimi</h1>
      
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
      
      {/* Arama çubuğu */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Video ara... (başlık, açıklama, kategori, pornstar, tag)"
            className="w-full py-2 pl-10 pr-4 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Video listesi */}
      {loading && !editingVideo ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="bg-dark-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-600">
              <thead className="bg-dark-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Video
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Kategoriler
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Pornstarlar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    İstatistikler
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-700 divide-y divide-dark-600">
                {filteredVideos.map(video => (
                  <tr key={video.id} className="hover:bg-dark-600">
                    {editingVideo === video.id ? (
                      <td colSpan="7" className="px-6 py-4">
                        <form onSubmit={handleSubmitEdit}>
                          <div className="mb-4">
                            <label className="block text-gray-400 mb-2">Video Başlığı</label>
                            <input
                              type="text"
                              className="input w-full"
                              value={editForm.title}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              required
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-400 mb-2">Açıklama</label>
                            <textarea
                              className="input w-full h-24"
                              value={editForm.description}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            ></textarea>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-gray-400">Kategoriler</label>
                              <button
                                type="button"
                                className="text-primary-500 hover:text-primary-400 text-sm"
                                onClick={() => handleAddArrayItem('categories')}
                              >
                                + Kategori Ekle
                              </button>
                            </div>
                            {editForm.categories.map((category, index) => (
                              <div key={index} className="flex mb-2">
                                <input
                                  type="text"
                                  className="input flex-grow"
                                  value={category}
                                  onChange={(e) => handleArrayItemChange('categories', index, e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="ml-2 text-red-500 hover:text-red-400"
                                  onClick={() => handleRemoveArrayItem('categories', index)}
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-gray-400">Pornstarlar</label>
                              <button
                                type="button"
                                className="text-primary-500 hover:text-primary-400 text-sm"
                                onClick={() => handleAddArrayItem('pornstars')}
                              >
                                + Pornstar Ekle
                              </button>
                            </div>
                            {editForm.pornstars.map((pornstar, index) => (
                              <div key={index} className="flex mb-2">
                                <input
                                  type="text"
                                  className="input flex-grow"
                                  value={pornstar}
                                  onChange={(e) => handleArrayItemChange('pornstars', index, e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="ml-2 text-red-500 hover:text-red-400"
                                  onClick={() => handleRemoveArrayItem('pornstars', index)}
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-gray-400">Etiketler</label>
                              <button
                                type="button"
                                className="text-primary-500 hover:text-primary-400 text-sm"
                                onClick={() => handleAddArrayItem('tags')}
                              >
                                + Etiket Ekle
                              </button>
                            </div>
                            {editForm.tags.map((tag, index) => (
                              <div key={index} className="flex mb-2">
                                <input
                                  type="text"
                                  className="input flex-grow"
                                  value={tag}
                                  onChange={(e) => handleArrayItemChange('tags', index, e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="ml-2 text-red-500 hover:text-red-400"
                                  onClick={() => handleRemoveArrayItem('tags', index)}
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mb-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-primary-500"
                                checked={editForm.featured}
                                onChange={(e) => setEditForm({...editForm, featured: e.target.checked})}
                              />
                              <span className="ml-2 text-gray-400">Öne Çıkan Video</span>
                            </label>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              className="btn btn-primary flex items-center"
                              disabled={loading}
                            >
                              {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                              ) : (
                                <CheckIcon className="h-5 w-5 mr-2" />
                              )}
                              Kaydet
                            </button>
                            
                            <button
                              type="button"
                              className="btn btn-secondary flex items-center"
                              onClick={() => setEditingVideo(null)}
                            >
                              <XMarkIcon className="h-5 w-5 mr-2" />
                              İptal
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-24 relative">
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title} 
                                className="h-full w-full object-cover rounded"
                              />
                              {video.duration && (
                                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                  {formatDuration(video.duration)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {video.title}
                              </div>
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {video.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {video.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDate(video.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {video.categories?.map((category, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 text-xs rounded-full bg-dark-600 text-gray-300"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {video.pornstars?.map((pornstar, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 text-xs rounded-full bg-primary-500 bg-opacity-20 text-primary-500"
                              >
                                {pornstar}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-gray-400">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              <span>{video.views || 0}</span>
                            </div>
                            <div className="flex items-center text-gray-400">
                              <HandThumbUpIcon className="h-4 w-4 mr-1" />
                              <span>{video.likes || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditVideo(video)}
                            className="text-primary-500 hover:text-primary-400 mr-3"
                            title="Düzenle"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-500 hover:text-red-400"
                            title="Sil"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {searchQuery ? 'Arama kriterlerine uygun video bulunamadı.' : 'Henüz hiç video bulunmamaktadır.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Videos; 