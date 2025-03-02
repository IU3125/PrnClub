import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { storage } from '../../firebase/config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdForm = ({ adData, adId, onAdSaved, editMode = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    position: 'sidebar',
    isActive: true,
    priority: 1,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (adData && editMode) {
      setFormData({
        ...adData,
        startDate: adData.startDate?.toDate ? adData.startDate.toDate() : new Date(adData.startDate),
        endDate: adData.endDate?.toDate ? adData.endDate.toDate() : new Date(adData.endDate)
      });
      
      if (adData.imageUrl) {
        setImagePreview(adData.imageUrl);
      }
    }
  }, [adData, editMode]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (date, name) => {
    setFormData({
      ...formData,
      [name]: date
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 5MB.');
      return;
    }
    
    // Dosya türü kontrolü
    if (!file.type.match('image.*')) {
      setError('Only image files are allowed.');
      return;
    }
    
    setImageFile(file);
    
    // Görsel önizleme
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    try {
      // Storage referansı oluştur
      const storageRef = ref(storage, `advertisements/${Date.now()}_${file.name}`);
      
      // Dosyayı yükle
      const snapshot = await uploadBytes(storageRef, file);
      
      // Yüklenen dosyanın URL'sini al
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = formData.imageUrl;
      
      // Yeni bir görsel yüklendiyse
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }
      
      const adDataToSave = {
        ...formData,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp()
      };
      
      // Eğer bu bir güncelleme ise
      if (editMode && adId) {
        await updateDoc(doc(db, 'advertisements', adId), adDataToSave);
        setStatusMessage({ type: 'success', text: 'Advertisement updated successfully!' });
      } else {
        // Yeni reklam oluştur
        await addDoc(collection(db, 'advertisements'), {
          ...adDataToSave,
          createdAt: serverTimestamp()
        });
        setStatusMessage({ type: 'success', text: 'Advertisement created successfully!' });
        
        // Formu sıfırla
        setFormData({
          title: '',
          description: '',
          imageUrl: '',
          targetUrl: '',
          position: 'sidebar',
          isActive: true,
          priority: 1,
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });
        setImageFile(null);
        setImagePreview(null);
      }
      
      if (onAdSaved) {
        onAdSaved();
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      setError(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const positionOptions = [
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'header', label: 'Header' },
    { value: 'footer', label: 'Footer' },
    { value: 'video-before', label: 'Before Video' },
    { value: 'video-after', label: 'After Video' },
    { value: 'left', label: 'Left Side' },
    { value: 'right', label: 'Right Side' }
  ];

  return (
    <div className="bg-dark-800 p-4 rounded-lg shadow-lg">
      {statusMessage && (
        <div className={`mb-4 p-3 rounded ${statusMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {statusMessage.text}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500 text-white">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full bg-dark-700 text-white p-2 rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-dark-700 text-white p-2 rounded"
            rows="3"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Image</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="bg-dark-700 text-white p-2 rounded"
            />
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-16 w-auto object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    setFormData({...formData, imageUrl: ''});
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">Maximum file size: 5MB</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Image URL (Alternative to file upload)</label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="w-full bg-dark-700 text-white p-2 rounded"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-gray-400 text-sm mt-1">If you provide both a file and URL, the file will be used.</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Target URL</label>
          <input
            type="url"
            name="targetUrl"
            value={formData.targetUrl}
            onChange={handleChange}
            className="w-full bg-dark-700 text-white p-2 rounded"
            required
            placeholder="https://example.com"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Position</label>
          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="w-full bg-dark-700 text-white p-2 rounded"
            required
          >
            {positionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Priority</label>
          <input
            type="number"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full bg-dark-700 text-white p-2 rounded"
            min="1"
            max="10"
            required
          />
          <p className="text-gray-400 text-sm mt-1">Higher priority ads will be shown more frequently.</p>
        </div>
        
        <div className="mb-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-gray-300 mb-2">Start Date</label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date) => handleDateChange(date, 'startDate')}
              className="bg-dark-700 text-white p-2 rounded"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">End Date</label>
            <DatePicker
              selected={formData.endDate}
              onChange={(date) => handleDateChange(date, 'endDate')}
              className="bg-dark-700 text-white p-2 rounded"
              dateFormat="yyyy-MM-dd"
              minDate={formData.startDate}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            Active
          </label>
        </div>
        
        <button
          type="submit"
          className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : editMode ? 'Update Advertisement' : 'Create Advertisement'}
        </button>
      </form>
    </div>
  );
};

export default AdForm; 