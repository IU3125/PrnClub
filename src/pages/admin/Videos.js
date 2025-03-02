import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp, addDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { 
  FilmIcon, 
  TrashIcon, 
  PencilIcon, 
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  EyeIcon,
  HandThumbUpIcon,
  PlusIcon,
  ArrowUpTrayIcon
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
  const initialFormState = {
    title: '',
    description: '',
    thumbnailUrl: '',
    iframeCode: '',
    categories: [],
    tags: [],
    actors: [],
    blockAds: true, // Reklam engelleme seçeneği
  };
  const [editForm, setEditForm] = useState(initialFormState);

  // Video ekleme için state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    categories: [],
    actors: [],
    tags: [],
    featured: false,
    thumbnailUrl: '',
    iframeCode: '',
    blockAds: true, // Reklam engelleme seçeneği
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
      id: video.id,
      title: video.title || '',
      description: video.description || '',
      thumbnailUrl: video.thumbnailUrl || '',
      iframeCode: video.iframeCode || '',
      categories: video.categories || [],
      tags: video.tags || [],
      actors: video.actors || [],
      blockAds: video.blockAds !== undefined ? video.blockAds : true, // Reklam engelleme seçeneği
    });
  };

  // Video güncelle
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!editForm.title.trim()) {
      setError('Video title cannot be empty.');
      return;
    }
    
    if (!editForm.thumbnailUrl.trim()) {
      setError('Thumbnail URL cannot be empty.');
      return;
    }
    
    if (!editForm.iframeCode.trim()) {
      setError('Video iframe code cannot be empty.');
      return;
    }
    
    setLoading(true);
    try {
      // Filter out empty values from arrays
      const filteredCategories = editForm.categories.filter(cat => cat.trim() !== '');
      const filteredActors = editForm.actors.filter(actor => actor.trim() !== '');
      const filteredTags = editForm.tags.filter(tag => tag.trim() !== '');
      
      // Save categories, actors and tags to their respective collections for reuse
      await Promise.all([
        ...filteredCategories.map(async (category) => {
          const categoryRef = collection(db, 'categories');
          const q = query(categoryRef, where('name', '==', category));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(categoryRef, { 
              name: category,
              createdAt: serverTimestamp() 
            });
          }
        }),
        ...filteredActors.map(async (actor) => {
          const actorRef = collection(db, 'actors');
          const q = query(actorRef, where('name', '==', actor));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(actorRef, { 
              name: actor,
              createdAt: serverTimestamp() 
            });
          }
        }),
        ...filteredTags.map(async (tag) => {
          const tagRef = collection(db, 'tags');
          const q = query(tagRef, where('name', '==', tag));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(tagRef, { 
              name: tag,
              createdAt: serverTimestamp() 
            });
          }
        })
      ]);
      
      const videoRef = doc(db, 'videos', editingVideo);
      const updatedData = {
        ...editForm,
        categories: filteredCategories,
        actors: filteredActors,
        tags: filteredTags,
        updatedAt: serverTimestamp(),
        isActive: true, // Ensure the video is active on the main site
      };
      
      await updateDoc(videoRef, updatedData);
      
      // Videoları listesini güncelle
      setVideos(videos.map(video => 
        video.id === editingVideo 
          ? { ...video, ...updatedData } 
          : video
      ));
      
      setEditingVideo(null);
      setSuccess('Video successfully updated and published to the main site.');
    } catch (error) {
      console.error('Error updating video:', error);
      setError('An error occurred while updating the video.');
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatla
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Belirtilmemiş';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: tr });
  };
  
  // Süre formatla
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Arama filtresi
  const filteredVideos = videos.filter(video => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (video.title && video.title.toLowerCase().includes(searchLower)) ||
      (video.description && video.description.toLowerCase().includes(searchLower)) ||
      (video.categories && video.categories.some(cat => cat.toLowerCase().includes(searchLower))) ||
      (video.actors && video.actors.some(actor => actor.toLowerCase().includes(searchLower))) ||
      (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });
  
  // Array item değişikliği (kategoriler, pornstarlar, etiketler)
  const handleArrayItemChange = (type, index, value) => {
    setEditForm({
      ...editForm,
      [type]: editForm[type].map((item, i) => i === index ? value : item)
    });
  };
  
  // Array'e yeni item ekle
  const handleAddArrayItem = (type) => {
    setEditForm({
      ...editForm,
      [type]: [...editForm[type], '']
    });
  };
  
  // Array'den item kaldır
  const handleRemoveArrayItem = (type, index) => {
    setEditForm({
      ...editForm,
      [type]: editForm[type].filter((_, i) => i !== index)
    });
  };

  // Yeni video için array item değişikliği
  const handleNewVideoArrayItemChange = (type, index, value) => {
    setNewVideo({
      ...newVideo,
      [type]: newVideo[type].map((item, i) => i === index ? value : item)
    });
  };
  
  // Yeni video için array'e item ekle
  const handleAddNewVideoArrayItem = (type) => {
    setNewVideo({
      ...newVideo,
      [type]: [...newVideo[type], '']
    });
  };
  
  // Yeni video için array'den item kaldır
  const handleRemoveNewVideoArrayItem = (type, index) => {
    setNewVideo({
      ...newVideo,
      [type]: newVideo[type].filter((_, i) => i !== index)
    });
  };

  // Thumbnail dosyası seçildiğinde
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      
      // Önizleme için
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Video dosyası seçildiğinde
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
    }
  };

  // Yeni video ekle
  const handleAddVideo = async (e) => {
    e.preventDefault();
    
    if (!newVideo.title.trim()) {
      setError('Video title cannot be empty.');
      return;
    }
    
    if (!newVideo.thumbnailUrl.trim()) {
      setError('Thumbnail URL cannot be empty.');
      return;
    }
    
    if (!newVideo.iframeCode.trim()) {
      setError('Video iframe code cannot be empty.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Filter out empty values from arrays
      const filteredCategories = newVideo.categories.filter(cat => cat.trim() !== '');
      const filteredActors = newVideo.actors.filter(actor => actor.trim() !== '');
      const filteredTags = newVideo.tags.filter(tag => tag.trim() !== '');
      
      // Save categories, actors and tags to their respective collections for reuse
      await Promise.all([
        ...filteredCategories.map(async (category) => {
          const categoryRef = collection(db, 'categories');
          const q = query(categoryRef, where('name', '==', category));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(categoryRef, { 
              name: category,
              createdAt: serverTimestamp() 
            });
          }
        }),
        ...filteredActors.map(async (actor) => {
          const actorRef = collection(db, 'actors');
          const q = query(actorRef, where('name', '==', actor));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(actorRef, { 
              name: actor,
              createdAt: serverTimestamp() 
            });
          }
        }),
        ...filteredTags.map(async (tag) => {
          const tagRef = collection(db, 'tags');
          const q = query(tagRef, where('name', '==', tag));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            await addDoc(tagRef, { 
              name: tag,
              createdAt: serverTimestamp() 
            });
          }
        })
      ]);
      
      // Video verisini oluştur
      const videoData = {
        title: newVideo.title,
        description: newVideo.description,
        categories: filteredCategories,
        actors: filteredActors,
        tags: filteredTags,
        featured: newVideo.featured,
        thumbnailUrl: newVideo.thumbnailUrl,
        iframeCode: newVideo.iframeCode,
        duration: Math.floor(Math.random() * 600) + 60, // 1-10 dakika arası (örnek)
        views: 0,
        likes: 0,
        dislikes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true, // Make sure video is active and visible on the main site
        publishedAt: serverTimestamp(), // Add publish date for the main site
        blockAds: newVideo.blockAds, // Reklam engelleme seçeneği
      };
      
      // Firestore'a ekle
      const docRef = await addDoc(collection(db, 'videos'), videoData);
      
      // State'i güncelle
      setVideos([
        {
          id: docRef.id,
          ...videoData,
          createdAt: new Date() // Geçici olarak şu anki tarihi kullan
        },
        ...videos
      ]);
      
      // Formu temizle
      setNewVideo({
        title: '',
        description: '',
        categories: [],
        actors: [],
        tags: [],
        featured: false,
        thumbnailUrl: '',
        iframeCode: '',
        blockAds: true, // Reklam engelleme seçeneği
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setShowAddForm(false);
      
      setSuccess('Video successfully added and published to the main site.');
    } catch (error) {
      console.error('Error adding video:', error);
      setError('An error occurred while adding the video.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Main video list view
  const renderVideoList = () => {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Video
          </button>
        </div>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full py-2 pl-10 pr-4 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Video grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-600">
              <thead className="bg-dark-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Thumbnail
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Video Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Studio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actors name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tags
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-800 divide-y divide-dark-600">
                {filteredVideos.map(video => (
                  <tr key={video.id} className="hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-24 relative">
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title} 
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{video.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {video.categories && video.categories.length > 0 
                          ? video.categories[0] 
                          : 'bla'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">bla</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {video.actors && video.actors.length > 0 
                          ? video.actors[0] 
                          : 'bla'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {video.tags && video.tags.length > 0 
                          ? video.tags[0] 
                          : 'bla'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEditVideo(video)}
                        className="text-blue-500 hover:text-blue-400 mx-2"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-red-500 hover:text-red-400 mx-2"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-dark-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">
              {searchQuery ? 'No videos match your search criteria.' : 'No videos have been added yet.'}
            </p>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-400">
          Showing 1-{filteredVideos.length} of {filteredVideos.length}
        </div>
      </div>
    );
  };

  // Add/Edit video form
  const renderVideoForm = (isEdit = false) => {
    const formData = isEdit ? editForm : newVideo;
    const setFormData = isEdit ? setEditForm : setNewVideo;
    const handleSubmit = isEdit ? handleSubmitEdit : handleAddVideo;
    const handleItemChange = isEdit ? handleArrayItemChange : handleNewVideoArrayItemChange;
    const handleAddItem = isEdit ? handleAddArrayItem : handleAddNewVideoArrayItem;
    const handleRemoveItem = isEdit ? handleRemoveArrayItem : handleRemoveNewVideoArrayItem;
    
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Video' : 'Add New Video'}
          </h1>
          
          <button
            onClick={() => isEdit ? setEditingVideo(null) : setShowAddForm(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            Cancel
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Video Title *</label>
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Description</label>
                <textarea
                  className="w-full py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Thumbnail URL *</label>
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                  placeholder="https://example.com/thumbnail.jpg"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Video Iframe Code *</label>
                <textarea
                  className="w-full py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white h-24"
                  value={formData.iframeCode}
                  onChange={(e) => setFormData({...formData, iframeCode: e.target.value})}
                  placeholder="<iframe src='https://example.com/embed/video' ...></iframe>"
                  required
                ></textarea>
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id={`blockAds-${isEdit ? 'edit' : 'new'}`}
                    className="mr-2"
                    checked={formData.blockAds}
                    onChange={(e) => setFormData({...formData, blockAds: e.target.checked})}
                  />
                  <label htmlFor={`blockAds-${isEdit ? 'edit' : 'new'}`} className="text-sm text-gray-400">
                    İframe reklamlarını engelle (bazı video sağlayıcılarında sorunlara neden olabilir)
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-400">Categories</label>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-400 text-sm"
                    onClick={() => handleAddItem('categories')}
                  >
                    + Add Category
                  </button>
                </div>
                {formData.categories.map((category, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="flex-grow py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      value={category}
                      onChange={(e) => handleItemChange('categories', index, e.target.value)}
                    />
                    <button
                      type="button"
                      className="ml-2 text-red-500 hover:text-red-400"
                      onClick={() => handleRemoveItem('categories', index)}
                      disabled={formData.categories.length === 1}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-400">Actors</label>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-400 text-sm"
                    onClick={() => handleAddItem('actors')}
                  >
                    + Add Actor
                  </button>
                </div>
                {formData.actors.map((actor, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="flex-grow py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      value={actor}
                      onChange={(e) => handleItemChange('actors', index, e.target.value)}
                    />
                    <button
                      type="button"
                      className="ml-2 text-red-500 hover:text-red-400"
                      onClick={() => handleRemoveItem('actors', index)}
                      disabled={formData.actors.length === 1}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-400">Tags</label>
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-400 text-sm"
                    onClick={() => handleAddItem('tags')}
                  >
                    + Add Tag
                  </button>
                </div>
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="flex-grow py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      value={tag}
                      onChange={(e) => handleItemChange('tags', index, e.target.value)}
                    />
                    <button
                      type="button"
                      className="ml-2 text-red-500 hover:text-red-400"
                      onClick={() => handleRemoveItem('tags', index)}
                      disabled={formData.tags.length === 1}
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
                    className="form-checkbox h-5 w-5 text-blue-500"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  />
                  <span className="ml-2 text-gray-400">Featured Video</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckIcon className="h-5 w-5 mr-2" />
              )}
              {isEdit ? 'Update Video' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="p-6">
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
      
      {editingVideo ? renderVideoForm(true) : 
       showAddForm ? renderVideoForm(false) : 
       renderVideoList()}
    </div>
  );
};

export default Videos; 