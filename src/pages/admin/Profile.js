import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useForm } from 'react-hook-form';
import { 
  UserCircleIcon, 
  KeyIcon 
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { currentUser, logout, resetPassword } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Get admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminDoc.exists()) {
          setAdminData(adminDoc.data());
          setValue('displayName', adminDoc.data().displayName || '');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('An error occurred while fetching admin data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser, setValue]);

  // Update profile
  const handleUpdateProfile = async (data) => {
    setError('');
    setSuccess('');
    
    try {
      await updateDoc(doc(db, 'admins', currentUser.uid), {
        displayName: data.displayName
      });
      
      setSuccess('Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An error occurred while updating the profile.');
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
      setSuccess('Password reset link has been sent to your email.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setError('An error occurred while sending password reset email.');
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error during logout:', error);
      setError('An error occurred while logging out.');
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
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Profile</h1>
      
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
      
      <div className="bg-dark-700 rounded-lg overflow-hidden p-6">
        <div className="flex items-center mb-6">
          <UserCircleIcon className="w-16 h-16 text-gray-400 mr-4" />
          <div>
            <h2 className="text-xl font-semibold text-white">
              {adminData?.displayName || 'Admin'}
            </h2>
            <p className="text-gray-400">{currentUser.email}</p>
            <p className="text-primary-500 text-sm mt-1">
              {adminData?.role === 'admin' ? 'Full Access Admin' : 'Advertising Manager'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(handleUpdateProfile)}>
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-gray-300 mb-2">
              Admin Name
            </label>
            <input
              id="displayName"
              type="text"
              className="input"
              {...register('displayName', { 
                required: 'Admin name is required',
                minLength: {
                  value: 3,
                  message: 'Admin name must be at least 3 characters'
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
              className="btn btn-primary mb-4 md:mb-0"
            >
              Update Profile
            </button>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <button
                type="button"
                onClick={handleResetPassword}
                className="flex items-center justify-center btn btn-dark"
              >
                <KeyIcon className="w-5 h-5 mr-2" />
                Reset Password
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 