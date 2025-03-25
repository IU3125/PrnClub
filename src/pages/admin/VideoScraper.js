import React, { useState } from 'react';
import { collection, addDoc, query, where, getDocs, increment, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import TagSuggester from '../../components/admin/TagSuggester';

const VideoScraper = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [isEditing, setIsEditing] = useState({ categories: true, actors: true });
  const [editedData, setEditedData] = useState({
    title: '',
    description: '',
    categories: [],
    actors: [],
    iframeCode: '',
    thumbnailUrl: '',
    tags: [],
    duration: 0
  });
  const [newCategory, setNewCategory] = useState('');
  const [newActor, setNewActor] = useState('');
  const [durationInput, setDurationInput] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [newTag, setNewTag] = useState('');

  const loadCategories = async () => {
    try {
      const categoryRef = collection(db, 'categories');
      const querySnapshot = await getDocs(categoryRef);
      const categories = querySnapshot.docs.map(doc => doc.data().name);
      return categories;
    } catch (err) {
      console.error('Error loading categories:', err);
      return [];
    }
  };

  const loadActors = async () => {
    try {
      const actorRef = collection(db, 'pornstars');
      const querySnapshot = await getDocs(actorRef);
      const actors = querySnapshot.docs.map(doc => doc.data().name);
      return actors;
    } catch (err) {
      console.error('Error loading actors:', err);
      return [];
    }
  };

  const scrapeVideo = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:3001/api/scrape?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape video');
      }

      const existingCategories = await loadCategories();
      const existingActors = await loadActors();

      const initialData = {
        ...data,
        categories: data.categories || [],
        actors: data.actors || [],
        tags: data.tags || [],
        duration: 0 // Başlangıçta 0 olarak ayarla
      };

      setScrapedData(initialData);
      setEditedData(initialData);
      // Süre giriş alanını sıfırla
      setDurationInput({
        hours: 0,
        minutes: 0,
        seconds: 0
      });
      setIsEditing({ categories: true, actors: true });
      setSuccess('Video information scraped successfully! You can now edit the information.');
    } catch (err) {
      setError(err.message || 'Failed to scrape video');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing({
      categories: true,
      actors: true
    });
  };

  const handleCancelEdit = () => {
    setIsEditing({
      categories: false,
      actors: false
    });
    setEditedData(scrapedData);
  };

  const handleSaveEdit = () => {
    setScrapedData(editedData);
    setIsEditing({
      categories: false,
      actors: false
    });
  };

  const handleInputChange = (field, value) => {
    const newData = {
      ...editedData,
      [field]: value
    };
    setEditedData(newData);
    setScrapedData(newData);  // Update scrapedData immediately
  };

  const handleEditToggle = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAddItem = async (field) => {
    const value = field === 'categories' ? newCategory.trim() : newActor.trim();
    if (!value) return;

    try {
      // Önce mevcut listeyi kontrol et
      const currentList = editedData[field] || [];
      if (currentList.includes(value)) {
        setError(`This ${field === 'categories' ? 'category' : 'actor'} already exists!`);
        return;
      }

      // Firebase'e ekle
      const collectionName = field === 'categories' ? 'categories' : 'pornstars';
      const itemRef = collection(db, collectionName);
      
      // Firebase'de var mı diye kontrol et
      const q = query(itemRef, where('name', '==', value));
      const querySnapshot = await getDocs(q);
      
      // Yoksa Firebase'e ekle
      let itemId;
      if (querySnapshot.empty) {
        const docRef = await addDoc(itemRef, {
          name: value,
          videoCount: 1, // Direkt 1 olarak başlat çünkü bu videoda kullanılacak
          createdAt: new Date(),
          updatedAt: new Date()
        });
        itemId = docRef.id;
      } else {
        itemId = querySnapshot.docs[0].id;
        // Mevcut öğenin videoCount'unu güncelle
        await updateDoc(doc(db, collectionName, itemId), {
          videoCount: increment(1),
          updatedAt: new Date()
        });
      }

      // State'i güncelle
    const newData = {
      ...editedData,
        [field]: [...currentList, value]
    };
    
    setEditedData(newData);
      setScrapedData(newData);

      // Input'u temizle
    if (field === 'categories') {
      setNewCategory('');
    } else {
      setNewActor('');
      }

      setSuccess(`${field === 'categories' ? 'Category' : 'Actor'} "${value}" added successfully and saved to database!`);
    } catch (err) {
      console.error(`Error adding ${field}:`, err);
      setError(`Failed to add ${field === 'categories' ? 'category' : 'actor'}: ${err.message}`);
    }
  };

  const handleRemoveItem = (field, index) => {
    const newData = {
      ...editedData,
      [field]: editedData[field].filter((_, i) => i !== index)
    };
    
    setEditedData(newData);
    setScrapedData(newData);  // Update scrapedData immediately
  };

  const addToDatabase = async () => {
    if (!editedData) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Önce tüm kategorileri ve aktörleri ekle/güncelle
      const promises = [];

      // Kategorileri işle
      for (const category of editedData.categories) {
        const categoryRef = collection(db, 'categories');
        const q = query(categoryRef, where('name', '==', category));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          promises.push(
            addDoc(categoryRef, {
            name: category,
              videoCount: 1,
            createdAt: new Date()
            })
          );
        } else {
          const categoryDoc = querySnapshot.docs[0];
          promises.push(
            updateDoc(doc(db, 'categories', categoryDoc.id), {
              videoCount: increment(1)
            })
          );
        }
      }

      // Aktörleri işle
      for (const actor of editedData.actors) {
        const pornstarRef = collection(db, 'pornstars');
        const q = query(pornstarRef, where('name', '==', actor));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          promises.push(
            addDoc(pornstarRef, {
            name: actor,
              videoCount: 1,
            createdAt: new Date()
            })
          );
        } else {
          const pornstarDoc = querySnapshot.docs[0];
          promises.push(
            updateDoc(doc(db, 'pornstars', pornstarDoc.id), {
              videoCount: increment(1)
            })
          );
        }
      }

      // Tüm kategori ve aktör işlemlerinin tamamlanmasını bekle
      await Promise.all(promises);

      // Videoyu veritabanına ekle
      const videoData = {
        ...editedData,
        createdAt: new Date(),
        featured: false,
        blockAds: true,
        tags: editedData.tags || [],
        duration: editedData.duration,
        views: 0,
        likes: 0,
        dislikes: 0,
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'videos'), videoData);
      setSuccess('Video and all categories/actors added to database successfully!');
      setScrapedData(null);
      setEditedData({
        title: '',
        description: '',
        categories: [],
        actors: [],
        iframeCode: '',
        thumbnailUrl: '',
        tags: [],
        duration: 0
      });
      setUrl('');
    } catch (err) {
      console.error('Error adding to database:', err);
      setError(err.message || 'Failed to add video to database');
    } finally {
      setLoading(false);
    }
  };

  // Yeni tag ekleme fonksiyonu
  const handleAddTag = async (tag) => {
    if (!tag.trim()) return;

    try {
      const currentTags = editedData.tags || [];
      if (currentTags.includes(tag)) {
        setError('This tag already exists!');
        return;
      }

      const newData = {
        ...editedData,
        tags: [...currentTags, tag.trim()]
      };

      setEditedData(newData);
      setScrapedData(newData);
      setSuccess(`Tag "${tag}" added successfully!`);
    } catch (err) {
      console.error('Error adding tag:', err);
      setError(`Failed to add tag: ${err.message}`);
    }
  };

  const handleDurationChange = (field, value) => {
    // Sayısal değer kontrolü ve sınırlandırma
    let numValue = parseInt(value) || 0;
    
    // Saniye ve dakika için 0-59 aralığı kontrolü
    if ((field === 'minutes' || field === 'seconds') && numValue > 59) {
      numValue = 59;
    }
    if (numValue < 0) {
      numValue = 0;
    }
    
    const newDuration = { ...durationInput, [field]: numValue };
    setDurationInput(newDuration);
    
    // Süreyi saniye olarak hesapla
    const totalSeconds = (newDuration.hours * 3600) + (newDuration.minutes * 60) + newDuration.seconds;
    
    // editedData state'ini güncelle
    handleInputChange('duration', totalSeconds);
  };
  
  // Format duration (saniyeden saat:dakika:saniye formatına dönüştürme)
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Video Scraper</h1>
      
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

      <div className="mb-6">
        <label className="block text-gray-400 mb-2">Video URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-grow py-2 px-3 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter video URL"
          />
          <button
            onClick={scrapeVideo}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <ArrowPathIcon className="h-5 w-5 mr-2" />
            )}
            Scrape
          </button>
        </div>
      </div>

      {editedData && (
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Video Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
                  value={editedData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Description</label>
                <textarea
                  className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
                  value={editedData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="3"
                />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Duration</label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    className="w-16 py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white text-center"
                    value={durationInput.hours}
                    onChange={(e) => handleDurationChange('hours', e.target.value)}
                  />
                  <span className="text-gray-400 mx-1">h</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="w-16 py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white text-center"
                    value={durationInput.minutes}
                    onChange={(e) => handleDurationChange('minutes', e.target.value)}
                  />
                  <span className="text-gray-400 mx-1">m</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="w-16 py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white text-center"
                    value={durationInput.seconds}
                    onChange={(e) => handleDurationChange('seconds', e.target.value)}
                  />
                  <span className="text-gray-400 mx-1">s</span>
                </div>
                <div className="flex items-center text-gray-400 ml-2">
                  <ClockIcon className="h-5 w-5 mr-1" />
                  <span className="text-white">{formatDuration(editedData.duration)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-400">Categories</label>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {editedData.categories.map((category, index) => (
                  <span key={index} className="bg-dark-600 text-white px-2 py-1 rounded flex items-center">
                    {category}
                      <button
                        onClick={() => handleRemoveItem('categories', index)}
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
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem('categories')}
                    />
                    <button
                      onClick={() => handleAddItem('categories')}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-400">Actors</label>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {editedData.actors.map((actor, index) => (
                  <span key={index} className="bg-dark-600 text-white px-2 py-1 rounded flex items-center">
                    {actor}
                      <button
                        onClick={() => handleRemoveItem('actors', index)}
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
                      value={newActor}
                      onChange={(e) => setNewActor(e.target.value)}
                      placeholder="New actor"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem('actors')}
                    />
                    <button
                      onClick={() => handleAddItem('actors')}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Tags
              </label>
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter a tag"
                  className="bg-dark-700 text-white w-full px-3 py-2 rounded-l-lg focus:outline-none"
                />
                <button
                  onClick={() => handleAddTag(newTag)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-lg"
                >
                  Add
                </button>
              </div>
              
              {/* Etiket Önerici */}
              <TagSuggester 
                title={editedData.title} 
                description={editedData.description}
                onSelectTag={handleAddTag}
              />
              
              <div className="mt-3 flex flex-wrap gap-2">
                {editedData.tags.map((tag, index) => (
                  <div key={index} className="bg-dark-600 text-gray-300 px-3 py-1 rounded-full flex items-center">
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveItem('tags', index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Iframe Code</label>
                <textarea
                  className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white font-mono text-sm"
                  value={editedData.iframeCode}
                  onChange={(e) => handleInputChange('iframeCode', e.target.value)}
                  rows="3"
                />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Thumbnail URL</label>
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-dark-600 border border-dark-500 rounded-md text-white"
                  value={editedData.thumbnailUrl}
                  onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
                />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={addToDatabase}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckIcon className="h-5 w-5 mr-2" />
              )}
              Save to Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoScraper; 