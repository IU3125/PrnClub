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
  XMarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import AdDisplay from '../../components/advertisements/AdDisplay';

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

  // Fetch user data
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
        console.error('Error occurred while fetching user data:', error);
        setError('An error occurred while fetching user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, setValue]);

  // Fetch featured videos
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
        console.error('Error occurred while fetching featured videos:', error);
      }
    };

    fetchFeaturedVideos();
  }, [userData]);

  // Update profile
  const handleUpdateProfile = async (data) => {
    setError('');
    setSuccess('');
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: data.displayName
      });
      
      setSuccess('Profile updated successfully.');
    } catch (error) {
      console.error('Error occurred while updating profile:', error);
      setError('An error occurred while updating profile.');
    }
  };

  // Update password
  const handleUpdatePassword = async (data) => {
    setError('');
    setSuccess('');
    
    try {
      // Update password with Firebase Authentication
      await currentUser.updatePassword(data.password);
      
      setSuccess('Your password has been updated successfully.');
      
      // Clear form fields
      setValue('password', '');
      setValue('confirmPassword', '');
    } catch (error) {
      console.error('Error occurred while updating password:', error);
      setError('An error occurred while updating password. Please make sure you have logged in recently.');
    }
  };

  // Send password reset email
  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    setResetSent(false);
    
    try {
      await resetPassword(currentUser.email);
      setResetSent(true);
      setSuccess('Password reset link has been sent to your email address.');
    } catch (error) {
      console.error('Error occurred while sending password reset email:', error);
      setError('An error occurred while sending password reset email.');
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    if (deleteConfirmText !== currentUser.email) {
      setError('You must enter your email address correctly to deactivate your account.');
      return;
    }
    
    try {
      // Update user status to inactive
      await updateDoc(doc(db, 'users', currentUser.uid), {
        status: 'inactive',
        deactivatedAt: new Date()
      });
      
      // Log out the user
      await logout();
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error occurred while deactivating account:', error);
      setError('An error occurred while deactivating your account.');
      setShowDeleteModal(false);
    }
  };

  // Log out
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error occurred during logout:', error);
      setError('An error occurred during logout.');
    }
  };

  // Remove video from favorites
  const handleRemoveFromFeatured = async (videoId) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        featured: arrayRemove(videoId)
      });
      
      // Update user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      // Remove video from list
      setFeaturedVideos(featuredVideos.filter(video => video.id !== videoId));
      
      setSuccess('Video removed from favorites.');
    } catch (error) {
      console.error('Error occurred while removing video from favorites:', error);
      setError('An error occurred while removing video from favorites.');
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-2">Manage your account settings</p>
      </div>
      
      {/* Error and Success Messages */}
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
      
      {/* Profile Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - User Info */}
        <div className="md:col-span-1">
          <div className="bg-dark-700 rounded-lg p-6">
            <div className="flex flex-col items-center">
              <div className="bg-dark-600 rounded-full p-4 mb-4">
                <UserCircleIcon className="w-16 h-16 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-white">{userData?.displayName || 'User'}</h2>
              <p className="text-gray-400 mt-1">{currentUser.email}</p>
              
              <div className="mt-4 flex items-center">
                <HeartIconSolid className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-white">{featuredVideos.length} Favorite Videos</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="mt-6 w-full py-2 px-4 bg-dark-600 hover:bg-dark-500 text-white rounded-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Settings Forms */}
        <div className="md:col-span-2">
          {/* Update Profile Form */}
          <div className="bg-dark-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Update Profile</h3>
            
            <form onSubmit={handleSubmit(handleUpdateProfile)}>
              <div className="mb-4">
                <label htmlFor="displayName" className="block text-gray-300 mb-2">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  placeholder="Your display name"
                  {...register('displayName', { required: 'Display name is required' })}
                />
                {errors.displayName && (
                  <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
              >
                Update Profile
              </button>
            </form>
          </div>
          
          {/* Update Password Form */}
          <div className="bg-dark-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Change Password</h3>
            
            <form onSubmit={handleSubmit(handleUpdatePassword)}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-300 mb-2">New Password</label>
                <input
                  id="password"
                  type="password"
                  className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  placeholder="New password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  placeholder="Confirm new password"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === watchPassword || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md mb-2 sm:mb-0 sm:mr-2"
                >
                  Update Password
                </button>
                
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="py-2 px-4 bg-dark-600 hover:bg-dark-500 text-white rounded-md"
                >
                  Send Reset Email
                </button>
              </div>
              
              {resetSent && (
                <p className="text-green-500 text-sm mt-2">
                  Password reset email sent. Please check your inbox.
                </p>
              )}
            </form>
          </div>
          
          {/* Deactivate Account */}
          <div className="bg-dark-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Deactivate Account</h3>
            <p className="text-gray-400 mb-4">
              Once you deactivate your account, all your data will be permanently removed.
              This action cannot be undone.
            </p>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Deactivate Account
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-700 rounded-lg max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="bg-red-500 bg-opacity-20 p-2 rounded-full mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Deactivate Account</h3>
                <p className="text-gray-400 mt-1">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">
                Please type your email address to confirm: <span className="text-white">{currentUser.email}</span>
              </label>
              <input
                type="text"
                className="w-full py-2 px-3 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="py-2 px-4 bg-dark-600 hover:bg-dark-500 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 