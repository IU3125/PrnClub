import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  PhotoIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const AddAdvertisement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New advertisement state
  const [newAd, setNewAd] = useState({
    title: '',
    companyName: '',
    link: '',
    position: 'sidebar', // sidebar, header, footer, video-before, video-after, left, right
    adType: 'image', // image, video, gif
    active: true,
    skipAfter: 5 // Default: 5 seconds to skip
  });
  const [adImage, setAdImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [recommendedSize, setRecommendedSize] = useState('300x600px');

  // Define standard ad sizes based on position
  const adSizes = {
    sidebar: '300x600px',
    header: '728x90px',
    footer: '728x90px',
    left: '160x600px',
    right: '160x600px',
    'video-before': '728x90px',
    'video-after': '728x90px'
  };

  // Update recommended size when position changes
  useEffect(() => {
    setRecommendedSize(adSizes[newAd.position] || '300x600px');
  }, [newAd.position]);

  // Image preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new advertisement
  const handleAddAd = async (e) => {
    e.preventDefault();
    
    if (!newAd.title.trim() || !newAd.companyName.trim() || !newAd.link.trim() || !adImage) {
      setError('Please fill in all required fields and select an image.');
      return;
    }
    
    setLoading(true);
    try {
      console.log("Processing image...");
      
      // Convert image to Base64 instead of uploading to Firebase Storage
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader async operation
      const imageBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(adImage);
      });
      
      console.log("Image converted to Base64");
      
      // Create advertisement data with Base64 image
      const adData = {
        ...newAd,
        imageUrl: imageBase64, // Store the Base64 string instead of a Storage URL
        imageType: adImage.type,
        imageName: adImage.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log("Adding document to Firestore with Base64 image");
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'advertisements'), adData);
      console.log("Document added with ID:", docRef.id);
      
      // Navigate back to advertisement list
      navigate('/admin/advertisements', { 
        state: { 
          success: 'Advertisement created successfully.' 
        } 
      });
    } catch (error) {
      console.error('Error creating advertisement:', error);
      setError(`An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/admin/advertisements')}
          className="mr-4 text-gray-400 hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Create New Advertisement</h1>
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-dark-700 rounded-lg p-6">
        <form onSubmit={handleAddAd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Advertisement Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Advertisement Title*</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newAd.title}
                    onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                    required
                    placeholder="Enter advertisement title"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Company Name*</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newAd.companyName}
                    onChange={(e) => setNewAd({...newAd, companyName: e.target.value})}
                    required
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Advertisement Link*</label>
                  <input
                    type="url"
                    className="input w-full"
                    value={newAd.link}
                    onChange={(e) => setNewAd({...newAd, link: e.target.value})}
                    required
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Media & Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Advertisement Type</label>
                  <select
                    className="input w-full"
                    value={newAd.adType}
                    onChange={(e) => setNewAd({...newAd, adType: e.target.value})}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Position</label>
                  <select
                    className="input w-full"
                    value={newAd.position}
                    onChange={(e) => setNewAd({...newAd, position: e.target.value})}
                  >
                    <option value="sidebar">Sidebar (300x600px)</option>
                    <option value="header">Header (728x90px)</option>
                    <option value="footer">Footer (728x90px)</option>
                    <option value="left">Left (160x600px)</option>
                    <option value="right">Right (160x600px)</option>
                    <option value="video-before">Before Video (728x90px)</option>
                    <option value="video-after">After Video (728x90px)</option>
                  </select>
                </div>
                
                {newAd.adType === 'video' && (
                  <div>
                    <label className="block text-gray-400 mb-2">Skip After (seconds)</label>
                    <select
                      className="input w-full"
                      value={newAd.skipAfter}
                      onChange={(e) => setNewAd({...newAd, skipAfter: parseInt(e.target.value)})}
                    >
                      <option value="0">Cannot Skip</option>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="15">15 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="-1">End of Ad</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {newAd.skipAfter === 0 
                        ? "Users cannot skip this ad" 
                        : newAd.skipAfter === -1 
                          ? "Users can skip only after the ad ends" 
                          : `Users can skip after ${newAd.skipAfter} seconds`}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-gray-400 mb-2">Status</label>
                  <select
                    className="input w-full"
                    value={newAd.active}
                    onChange={(e) => setNewAd({...newAd, active: e.target.value === 'true'})}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Advertisement Media*</label>
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <label className="cursor-pointer bg-dark-600 hover:bg-dark-500 text-white py-2 px-4 rounded flex items-center mb-4 md:mb-0">
                <PhotoIcon className="h-5 w-5 mr-2" />
                {newAd.adType === 'video' ? 'Select Video' : newAd.adType === 'gif' ? 'Select GIF' : 'Select Image'}
                <input
                  type="file"
                  className="hidden"
                  accept={newAd.adType === 'video' ? 'video/*' : newAd.adType === 'gif' ? 'image/gif' : 'image/*'}
                  onChange={handleImageChange}
                  required
                />
              </label>
              
              {imagePreview && (
                <div className="ml-0 md:ml-4 mt-4 md:mt-0">
                  {newAd.adType === 'video' ? (
                    <video src={imagePreview} className="h-32 rounded" controls />
                  ) : (
                    <img src={imagePreview} alt="Preview" className="h-32 rounded" />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended size for {newAd.position}: <strong>{recommendedSize}</strong>
              {newAd.adType === 'video' ? ', Max duration: 30 seconds, Max size: 10MB' :
               newAd.adType === 'gif' ? ', Max size: 5MB' : ', Max size: 2MB'}
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-secondary mr-3"
              onClick={() => navigate('/admin/advertisements')}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <PlusIcon className="h-5 w-5 mr-2" />
              )}
              Create Advertisement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdvertisement; 