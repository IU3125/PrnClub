import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp, addDoc, where, increment } from 'firebase/firestore';
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

  // Add state for suggestions
  const [allCategories, setAllCategories] = useState([]);
  const [allPornstars, setAllPornstars] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [pornstarSuggestions, setPornstarSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState({
    category: -1,
    actor: -1
  });

  // Add refs for suggestion dropdowns
  const categoryDropdownRef = useRef(null);
  const actorDropdownRef = useRef(null);

  // Handle click outside to close suggestion dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current && 
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowSuggestions(prev => ({ ...prev, category: -1 }));
      }
      
      if (
        actorDropdownRef.current && 
        !actorDropdownRef.current.contains(event.target)
      ) {
        setShowSuggestions(prev => ({ ...prev, actor: -1 }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch categories and pornstars for suggestions
  useEffect(() => {
    const fetchCategoriesAndPornstars = async () => {
      try {
        // Fetch categories
        const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesList = categoriesSnapshot.docs.map(doc => doc.data().name);
        setAllCategories(categoriesList);
        
        // Fetch pornstars
        const pornstarsQuery = query(collection(db, 'pornstars'), orderBy('name', 'asc'));
        const pornstarsSnapshot = await getDocs(pornstarsQuery);
        const pornstarsList = pornstarsSnapshot.docs.map(doc => doc.data().name);
        setAllPornstars(pornstarsList);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };
    
    fetchCategoriesAndPornstars();
  }, []);

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
        console.error('Error fetching videos:', error);
        setError('An error occurred while fetching videos.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Video sil
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      
      // Videoyu listeden kaldır
      setVideos(videos.filter(video => video.id !== videoId));
      
      setSuccess('Video deleted successfully.');
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('An error occurred while deleting the video.');
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

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Önce tüm kategorileri ve aktörleri ekle/güncelle
      const promises = [];

      // Kategorileri işle
      for (const category of editForm.categories) {
        const categoryRef = collection(db, 'categories');
        const q = query(categoryRef, where('name', '==', category));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          promises.push(
            addDoc(categoryRef, {
              name: category,
              videoCount: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          );
        } else {
          const categoryDoc = querySnapshot.docs[0];
          promises.push(
            updateDoc(doc(db, 'categories', categoryDoc.id), {
              videoCount: increment(1),
              updatedAt: new Date()
            })
          );
        }
      }

      // Aktörleri işle
      for (const actor of editForm.actors) {
        const pornstarRef = collection(db, 'pornstars');
        const q = query(pornstarRef, where('name', '==', actor));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          promises.push(
            addDoc(pornstarRef, {
              name: actor,
              videoCount: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          );
        } else {
          const pornstarDoc = querySnapshot.docs[0];
          promises.push(
            updateDoc(doc(db, 'pornstars', pornstarDoc.id), {
              videoCount: increment(1),
              updatedAt: new Date()
            })
          );
        }
      }

      // Tüm kategori ve aktör işlemlerinin tamamlanmasını bekle
      await Promise.all(promises);

      // Videoyu güncelle
      const videoRef = doc(db, 'videos', editForm.id);
      await updateDoc(videoRef, {
        ...editForm,
        updatedAt: serverTimestamp()
      });

      // Listeyi güncelle
      setVideos(videos.map(video => 
        video.id === editForm.id ? { ...video, ...editForm } : video
      ));

      setSuccess('Video updated successfully!');
      setEditingVideo(null);
      setEditForm(initialFormState);
    } catch (error) {
      console.error('Error updating video:', error);
      setError('An error occurred while updating the video.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: tr });
  };
  
  // Format duration
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
  
  // Search filter
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
  const handleAddArrayItem = async (type, value) => {
    if (!value || !value.trim()) return;

    try {
      // Firebase'e ekle
      const collectionName = type === 'categories' ? 'categories' : 'pornstars';
      const itemRef = collection(db, collectionName);
      
      // Firebase'de var mı diye kontrol et
      const q = query(itemRef, where('name', '==', value.trim()));
      const querySnapshot = await getDocs(q);
      
      // Yoksa Firebase'e ekle
      if (querySnapshot.empty) {
        await addDoc(itemRef, {
          name: value.trim(),
          videoCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        const itemDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, collectionName, itemDoc.id), {
          videoCount: increment(1),
          updatedAt: new Date()
        });
      }

      // State'i güncelle
      const newForm = { ...editForm };
      if (!newForm[type].includes(value.trim())) {
        newForm[type] = [...newForm[type].slice(0, -1), value.trim()];
        setEditForm(newForm);
      }

      setSuccess(`${type === 'categories' ? 'Category' : 'Actor'} "${value}" added successfully!`);
    } catch (err) {
      console.error(`Error adding ${type}:`, err);
      setError(`Failed to add ${type === 'categories' ? 'category' : 'actor'}: ${err.message}`);
    }
  };
  
  // Array'den item kaldır
  const handleRemoveArrayItem = (type, index) => {
    setEditForm({
      ...editForm,
      [type]: editForm[type].filter((_, i) => i !== index)
    });
  };

  // Kategori ve aktör input değişikliklerini yönet
  const handleCategoryInputChange = (index, value, isEdit) => {
    const formData = isEdit ? editForm : newVideo;
    const setFormData = isEdit ? setEditForm : setNewVideo;

    // Sadece input değerini güncelle, henüz kaydetme
    setFormData({
      ...formData,
      categories: formData.categories.map((item, i) => i === index ? value : item)
    });
    
    // Önerileri göster
    if (value.trim() !== '') {
      const filteredSuggestions = allCategories.filter(
        category => category.toLowerCase().includes(value.toLowerCase())
      );
      setCategorySuggestions(filteredSuggestions);
      setShowSuggestions(prev => ({ ...prev, category: index }));
    } else {
      setCategorySuggestions([]);
      setShowSuggestions(prev => ({ ...prev, category: -1 }));
    }
  };

  const handleActorInputChange = (index, value, isEdit) => {
    const formData = isEdit ? editForm : newVideo;
    const setFormData = isEdit ? setEditForm : setNewVideo;

    // Sadece input değerini güncelle, henüz kaydetme
    setFormData({
      ...formData,
      actors: formData.actors.map((item, i) => i === index ? value : item)
    });
    
    // Önerileri göster
    if (value.trim() !== '') {
      const filteredSuggestions = allPornstars.filter(
        actor => actor.toLowerCase().includes(value.toLowerCase())
      );
      setPornstarSuggestions(filteredSuggestions);
      setShowSuggestions(prev => ({ ...prev, actor: index }));
    } else {
      setPornstarSuggestions([]);
      setShowSuggestions(prev => ({ ...prev, actor: -1 }));
    }
  };

  // Öneri seçimini yönet
  const handleSelectSuggestion = (suggestion, type, index, isEdit) => {
    const formData = isEdit ? editForm : newVideo;
    const setFormData = isEdit ? setEditForm : setNewVideo;

    // Seçilen öneriyi ekle
    setFormData({
      ...formData,
      [type]: formData[type].map((item, i) => i === index ? suggestion : item)
    });

    // Önerileri temizle
    if (type === 'category') {
      setCategorySuggestions([]);
      setShowSuggestions(prev => ({ ...prev, category: -1 }));
    } else if (type === 'actor') {
      setPornstarSuggestions([]);
      setShowSuggestions(prev => ({ ...prev, actor: -1 }));
    }

    // Firebase'e ekle
    handleAddArrayItem(type === 'category' ? 'categories' : 'actors', suggestion);
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
    
    // Validate required fields
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

    // Filter out empty values from arrays
    const filteredCategories = newVideo.categories.filter(cat => cat.trim() !== '');
    const filteredActors = newVideo.actors.filter(actor => actor.trim() !== '');
    const filteredTags = newVideo.tags.filter(tag => tag.trim() !== '');

    // Validate required arrays
    if (filteredCategories.length === 0) {
      setError('At least one category is required.');
      return;
    }

    if (filteredActors.length === 0) {
      setError('At least one actor is required.');
      return;
    }

    if (filteredTags.length === 0) {
      setError('At least one tag is required.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Validate that all categories exist and increment their counts
      for (const category of filteredCategories) {
        const categoryRef = collection(db, 'categories');
        const q = query(categoryRef, where('name', '==', category));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError(`Category "${category}" does not exist. Please add it first.`);
          setIsUploading(false);
          return;
        } else {
          // Increment category video count
          const categoryDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'categories', categoryDoc.id), {
            videoCount: increment(1)
          });
        }
      }

      // Validate that all actors exist and increment their counts
      for (const actor of filteredActors) {
        // Check in the pornstars collection instead of actors
        const pornstarRef = collection(db, 'pornstars');
        const q = query(pornstarRef, where('name', '==', actor));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError(`Actor "${actor}" does not exist. Please add them first.`);
          setIsUploading(false);
          return;
        } else {
          // Increment pornstar video count
          const pornstarDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'pornstars', pornstarDoc.id), {
            videoCount: increment(1)
          });
        }
      }

      // For tags, we'll increment their counts if they exist, or create them if they don't
      for (const tag of filteredTags) {
        const tagRef = collection(db, 'tags');
        const q = query(tagRef, where('name', '==', tag));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Create new tag
          await addDoc(collection(db, 'tags'), {
            name: tag,
            videoCount: 1,
            createdAt: serverTimestamp()
          });
        } else {
          // Increment tag video count
          const tagDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'tags', tagDoc.id), {
            videoCount: increment(1)
          });
        }
      }
      
      // Video verisini oluştur
      const videoData = {
        title: newVideo.title,
        titleLower: newVideo.title.toLowerCase(),
        description: newVideo.description,
        categories: filteredCategories,
        categoriesLower: filteredCategories.map(cat => cat.toLowerCase()),
        actors: filteredActors,
        actorsLower: filteredActors.map(actor => actor.toLowerCase()),
        tags: filteredTags,
        tagsLower: filteredTags.map(tag => tag.toLowerCase()),
        featured: newVideo.featured,
        thumbnailUrl: newVideo.thumbnailUrl,
        iframeCode: newVideo.iframeCode,
        duration: Math.floor(Math.random() * 600) + 60,
        views: 0,
        likes: 0,
        dislikes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        publishedAt: serverTimestamp(),
        blockAds: newVideo.blockAds,
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
        blockAds: true,
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setShowAddForm(false);
      
      setSuccess('Video successfully added and published to the main site.');
    } catch (error) {
      console.error('Error adding video:', error);
      setError('An error occurred while adding the video.');
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  // Main video list view
  const renderVideoList = () => {
    return (
      <div className="bg-dark-800 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Video
          </button>
        </div>

        {/* Category and Actor Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-3">Categories</h2>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
                  placeholder="Search or add category"
                  onChange={(e) => {
                    const value = e.target.value;
                    const filtered = allCategories.filter(cat => 
                      cat.toLowerCase().includes(value.toLowerCase())
                    );
                    setCategorySuggestions(filtered);
                    setShowSuggestions(prev => ({ ...prev, category: 0 }));
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.target.value.trim();
                      if (value) handleAddArrayItem('categories', value);
                      e.target.value = '';
                    }
                  }}
                />
                {showSuggestions.category !== -1 && categorySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-dark-600 border border-dark-500 rounded-md shadow-lg max-h-60 overflow-auto">
                    {categorySuggestions.map((category, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-sm text-white hover:bg-dark-500 cursor-pointer"
                        onClick={() => handleAddArrayItem('categories', category)}
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-dark-700 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-3">Actors</h2>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
                  placeholder="Search or add actor"
                  onChange={(e) => {
                    const value = e.target.value;
                    const filtered = allPornstars.filter(actor => 
                      actor.toLowerCase().includes(value.toLowerCase())
                    );
                    setPornstarSuggestions(filtered);
                    setShowSuggestions(prev => ({ ...prev, actor: 0 }));
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.target.value.trim();
                      if (value) handleAddArrayItem('actors', value);
                      e.target.value = '';
                    }
                  }}
                />
                {showSuggestions.actor !== -1 && pornstarSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-dark-600 border border-dark-500 rounded-md shadow-lg max-h-60 overflow-auto">
                    {pornstarSuggestions.map((actor, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-sm text-white hover:bg-dark-500 cursor-pointer"
                        onClick={() => handleAddArrayItem('actors', actor)}
                      >
                        {actor}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-dark-600 sm:rounded-lg">
                <table className="min-w-full divide-y divide-dark-600">
                  <thead className="bg-dark-700">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Thumbnail
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Video Name
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Studio
                      </th>
                      <th scope="col" className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actors name
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tags
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-600">
                    {filteredVideos.map(video => (
                      <tr key={video.id} className="hover:bg-dark-700">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="h-12 sm:h-16 w-16 sm:w-24 relative">
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title} 
                              className="h-full w-full object-cover rounded"
                            />
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-white">{video.title}</div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-white">
                            {video.categories && video.categories.length > 0 
                              ? video.categories[0] 
                              : 'bla'}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-white">bla</div>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-white">
                            {video.actors && video.actors.length > 0 
                              ? video.actors[0] 
                              : 'bla'}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-white">
                            {video.tags && video.tags.length > 0 
                              ? video.tags[0] 
                              : 'bla'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
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
            </div>
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

    return (
      <div className="bg-dark-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 mb-1">Title *</label>
            <input
              type="text"
              className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Description</label>
            <textarea
              className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Categories *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.categories.map((category, index) => (
                <span key={index} className="bg-dark-600 text-white px-2 py-1 rounded flex items-center">
                  {category}
                  <button
                    onClick={() => handleRemoveArrayItem('categories', index)}
                    className="ml-1 text-red-500 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {formData.categories.length > 0 && formData.categories[formData.categories.length - 1] === '' && (
                <input
                  type="text"
                  className="w-full py-1 px-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                  placeholder="Type new category name and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.target.value.trim();
                      if (value) {
                        handleAddArrayItem('categories', value);
                        // Boş string'i kaldır
                        const newCategories = formData.categories.filter(cat => cat !== '');
                        setFormData({
                          ...formData,
                          categories: newCategories
                        });
                      }
                      e.target.value = '';
                    }
                  }}
                />
              )}
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    categories: [...formData.categories, '']
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center justify-center"
                title="Add New Category"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Actors *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.actors.map((actor, index) => (
                <span key={index} className="bg-dark-600 text-white px-2 py-1 rounded flex items-center">
                  {actor}
                  <button
                    onClick={() => handleRemoveArrayItem('actors', index)}
                    className="ml-1 text-red-500 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {formData.actors.length > 0 && formData.actors[formData.actors.length - 1] === '' && (
                <input
                  type="text"
                  className="w-full py-1 px-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                  placeholder="Type new actor name and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.target.value.trim();
                      if (value) {
                        handleAddArrayItem('actors', value);
                        // Boş string'i kaldır
                        const newActors = formData.actors.filter(actor => actor !== '');
                        setFormData({
                          ...formData,
                          actors: newActors
                        });
                      }
                      e.target.value = '';
                    }
                  }}
                />
              )}
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    actors: [...formData.actors, '']
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center justify-center"
                title="Add New Actor"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="bg-dark-600 text-white px-2 py-1 rounded flex items-center">
                  {tag}
                  <button
                    onClick={() => handleRemoveArrayItem('tags', index)}
                    className="ml-1 text-red-500 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                className="flex-grow py-1 px-2 bg-dark-600 border border-dark-500 rounded text-white text-sm"
                placeholder="Add tag and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.target.value.trim();
                    if (value && !formData.tags.includes(value)) {
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, value]
                      });
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Iframe Code *</label>
            <textarea
              className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white font-mono text-sm"
              value={formData.iframeCode}
              onChange={(e) => setFormData({ ...formData, iframeCode: e.target.value })}
              rows="3"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-400 mb-1">Thumbnail URL *</label>
            <input
              type="text"
              className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-2 text-gray-400">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4"
                checked={formData.blockAds}
                onChange={(e) => setFormData({ ...formData, blockAds: e.target.checked })}
              />
              <span>Block iframe ads (may cause issues with some video providers)</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => isEdit ? setEditingVideo(null) : setShowAddForm(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            Cancel
          </button>
          <button
            onClick={isEdit ? handleSubmitEdit : handleAddVideo}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckIcon className="h-5 w-5 mr-2" />
            )}
            {isEdit ? 'Update Video' : 'Add Video'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      {editingVideo ? renderVideoForm(true) : showAddForm ? renderVideoForm() : renderVideoList()}
    </div>
  );
};

export default Videos; 