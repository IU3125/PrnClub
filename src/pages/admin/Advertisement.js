import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link, useLocation } from 'react-router-dom';
import { 
  TrashIcon, 
  PencilIcon, 
  PlusIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const Advertisement = () => {
  const location = useLocation();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Editing state
  const [editingAd, setEditingAd] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    companyName: '',
    link: '',
    position: '',
    adType: '',
    active: true,
    imageUrl: '',
    imageType: '',
    imageName: '',
    skipAfter: 5 // Default to 5 seconds if not set
  });
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');

  // Check for success message from location state
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch advertisements
  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      try {
        const adsQuery = query(
          collection(db, 'advertisements'),
          orderBy('createdAt', 'desc')
        );
        
        const adsSnapshot = await getDocs(adsQuery);
        const adsList = adsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAds(adsList);
      } catch (error) {
        console.error('Error fetching advertisements:', error);
        setError('An error occurred while fetching advertisements.');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Preview image for editing
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open edit mode
  const handleEditMode = (ad) => {
    setEditingAd(ad.id);
    setEditForm({
      title: ad.title,
      companyName: ad.companyName || '',
      link: ad.link,
      position: ad.position,
      adType: ad.adType || 'image',
      active: ad.active,
      imageUrl: ad.imageUrl,
      imageType: ad.imageType || '',
      imageName: ad.imageName || '',
      skipAfter: ad.skipAfter || 5 // Default to 5 seconds if not set
    });
    setNewImagePreview('');
    setNewImage(null);
  };

  // Update advertisement
  const handleUpdateAd = async (e) => {
    e.preventDefault();
    
    if (!editForm.title.trim() || !editForm.companyName.trim() || !editForm.link.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    try {
      let imageUrl = editForm.imageUrl;
      let imageType = editForm.imageType || '';
      let imageName = editForm.imageName || '';
      
      // If a new image is uploaded
      if (newImage) {
        // Convert new image to Base64
        const reader = new FileReader();
        imageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(newImage);
        });
        
        imageType = newImage.type;
        imageName = newImage.name;
      }
      
      // Update advertisement data
      const adData = {
        title: editForm.title,
        companyName: editForm.companyName,
        link: editForm.link,
        position: editForm.position,
        adType: editForm.adType,
        active: editForm.active,
        imageUrl,
        imageType,
        imageName,
        updatedAt: new Date()
      };
      
      // Update in Firestore
      await updateDoc(doc(db, 'advertisements', editingAd), adData);
      
      // Update state
      setAds(ads.map(ad => 
        ad.id === editingAd 
          ? { ...ad, ...adData } 
          : ad
      ));
      
      // Close edit mode
      setEditingAd(null);
      setNewImage(null);
      setNewImagePreview('');
      
      setSuccess('Advertisement updated successfully.');
    } catch (error) {
      console.error('Error updating advertisement:', error);
      setError('An error occurred while updating the advertisement.');
    } finally {
      setLoading(false);
    }
  };

  // Delete advertisement
  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }
    
    setLoading(true);
    try {
      // Delete from Firestore only (no need to delete from Storage)
      await deleteDoc(doc(db, 'advertisements', adId));
      
      // Update state
      setAds(ads.filter(ad => ad.id !== adId));
      
      setSuccess('Advertisement deleted successfully.');
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      setError('An error occurred while deleting the advertisement.');
    } finally {
      setLoading(false);
    }
  };

  // Format position name
  const formatPosition = (position) => {
    switch (position) {
      case 'sidebar': return 'Sidebar';
      case 'header': return 'Header';
      case 'footer': return 'Footer';
      case 'left': return 'Left';
      case 'right': return 'Right';
      case 'video-before': return 'Before Video';
      case 'video-after': return 'After Video';
      default: return position;
    }
  };

  // Pagination
  const totalPages = Math.ceil(ads.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAds = ads.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Advertisement Management</h1>
        <Link to="/admin/add-advertisement" className="btn btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Advertisement
        </Link>
      </div>
      
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
      
      {/* Advertisement list */}
      {loading && !editingAd ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : ads.length > 0 ? (
        <div className="bg-dark-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-600">
              <thead className="bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Thumbnail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Video</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Gif</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {currentAds.map(ad => (
                  <tr key={ad.id} className="hover:bg-dark-600">
                    {editingAd === ad.id ? (
                      <td colSpan="6" className="px-6 py-4">
                        <form onSubmit={handleUpdateAd}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-gray-400 mb-2">Advertisement Title</label>
                              <input
                                type="text"
                                className="input w-full"
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Company Name</label>
                              <input
                                type="text"
                                className="input w-full"
                                value={editForm.companyName}
                                onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Advertisement Link</label>
                              <input
                                type="url"
                                className="input w-full"
                                value={editForm.link}
                                onChange={(e) => setEditForm({...editForm, link: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Advertisement Type</label>
                              <select
                                className="input w-full"
                                value={editForm.adType}
                                onChange={(e) => setEditForm({...editForm, adType: e.target.value})}
                              >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                                <option value="gif">GIF</option>
                              </select>
                            </div>
                            
                            {editForm.adType === 'video' && (
                              <div>
                                <label className="block text-gray-400 mb-2">Skip After (seconds)</label>
                                <select
                                  className="input w-full"
                                  value={editForm.skipAfter}
                                  onChange={(e) => setEditForm({...editForm, skipAfter: parseInt(e.target.value)})}
                                >
                                  <option value="0">Cannot Skip</option>
                                  <option value="5">5 seconds</option>
                                  <option value="10">10 seconds</option>
                                  <option value="15">15 seconds</option>
                                  <option value="30">30 seconds</option>
                                  <option value="-1">End of Ad</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                  {editForm.skipAfter === 0 
                                    ? "Users cannot skip this ad" 
                                    : editForm.skipAfter === -1 
                                      ? "Users can skip only after the ad ends" 
                                      : `Users can skip after ${editForm.skipAfter} seconds`}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Position</label>
                              <select
                                className="input w-full"
                                value={editForm.position}
                                onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                              >
                                <option value="sidebar">Sidebar</option>
                                <option value="header">Header</option>
                                <option value="footer">Footer</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                                <option value="video-before">Before Video</option>
                                <option value="video-after">After Video</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 mb-2">Status</label>
                              <select
                                className="input w-full"
                                value={editForm.active}
                                onChange={(e) => setEditForm({...editForm, active: e.target.value === 'true'})}
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-400 mb-2">Advertisement Image</label>
                            <div className="flex items-center">
                              <label className="cursor-pointer bg-dark-600 hover:bg-dark-500 text-white py-2 px-4 rounded flex items-center">
                                <PhotoIcon className="h-5 w-5 mr-2" />
                                Change Image
                                <input
                                  type="file"
                                  className="hidden"
                                  accept={editForm.adType === 'video' ? 'video/*' : editForm.adType === 'gif' ? 'image/gif' : 'image/*'}
                                  onChange={handleEditImageChange}
                                />
                              </label>
                              <div className="ml-4">
                                <img 
                                  src={newImagePreview || editForm.imageUrl} 
                                  alt="Preview" 
                                  className="h-16 rounded" 
                                />
                              </div>
                            </div>
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
                                <PencilIcon className="h-5 w-5 mr-2" />
                              )}
                              Update
                            </button>
                            
                            <button
                              type="button"
                              className="btn btn-secondary flex items-center"
                              onClick={() => setEditingAd(null)}
                            >
                              <XMarkIcon className="h-5 w-5 mr-2" />
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ad.adType === 'video' ? (
                            <video 
                              src={ad.imageUrl} 
                              className="h-12 w-16 object-cover rounded" 
                              controls
                            />
                          ) : (
                            <img 
                              src={ad.imageUrl} 
                              alt={ad.title} 
                              className="h-12 w-16 object-cover rounded" 
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{ad.companyName || 'N/A'}</div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <a 
                              href={ad.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary-500 flex items-center"
                            >
                              {ad.link.substring(0, 20)}...
                              <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {ad.adType === 'video' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500 bg-opacity-20 text-blue-500">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {ad.adType === 'image' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500 bg-opacity-20 text-green-500">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {ad.adType === 'gif' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500 bg-opacity-20 text-purple-500">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <button
                            onClick={() => handleEditMode(ad)}
                            className="text-primary-500 hover:text-primary-400 mr-3"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="text-red-500 hover:text-red-400"
                            title="Delete"
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
          
          {/* Pagination */}
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-600">
            <div className="text-sm text-gray-400">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, ads.length)} of {ads.length}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1 
                    ? 'bg-dark-600 text-gray-500 cursor-not-allowed' 
                    : 'bg-dark-600 text-white hover:bg-dark-500'
                }`}
              >
                &lt;
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages 
                    ? 'bg-dark-600 text-gray-500 cursor-not-allowed' 
                    : 'bg-dark-600 text-white hover:bg-dark-500'
                }`}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No advertisements found. Create your first advertisement!</p>
        </div>
      )}
    </div>
  );
};

export default Advertisement; 