import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  UserCircleIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterBy, setFilterBy] = useState('date');
  const [orderStatus, setOrderStatus] = useState('all');

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [orderStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let usersQuery;
      
      if (orderStatus !== 'all') {
        // Filter by specific status
        usersQuery = query(
          collection(db, 'users'),
          where('status', '==', orderStatus),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Get all users
        usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An error occurred while fetching users.');
    } finally {
      setLoading(false);
    }
  };

  // Update user status (deactivate instead of delete)
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }
    
    try {
      const userRef = doc(db, 'users', userId);
      
      // Update user status to inactive
      await updateDoc(userRef, {
        status: 'inactive',
        deactivatedAt: new Date()
      });
      
      // Update user list
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: 'inactive', deactivatedAt: new Date() } 
          : user
      ));
      
      setSuccess('User successfully deactivated.');
    } catch (error) {
      console.error('Error deactivating user:', error);
      setError('An error occurred while deactivating the user.');
    }
  };

  // Activate user
  const handleActivateUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Update user status to active
      await updateDoc(userRef, {
        status: 'active',
        deactivatedAt: null
      });
      
      // Update user list
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: 'active', deactivatedAt: null } 
          : user
      ));
      
      setSuccess('User successfully activated.');
    } catch (error) {
      console.error('Error activating user:', error);
      setError('An error occurred while activating the user.');
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Search filter
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  // Determine user status
  const getUserStatus = (user) => {
    // Use status from user data if available, otherwise assume active
    return user.status || 'active';
  };

  // Determine status color and text
  const getStatusDetails = (status) => {
    switch(status) {
      case 'active':
        return { 
          color: 'bg-emerald-500', 
          text: 'Active',
          textColor: 'text-white'
        };
      case 'inactive':
        return { 
          color: 'bg-indigo-500', 
          text: 'Inactive',
          textColor: 'text-white'
        };
      case 'pending':
        return { 
          color: 'bg-indigo-500', 
          text: 'Pending',
          textColor: 'text-white'
        };
      default:
        return { 
          color: 'bg-gray-500', 
          text: 'Unknown',
          textColor: 'text-white'
        };
    }
  };

  // Reset filters
  const resetFilter = () => {
    setFilterBy('date');
    setOrderStatus('all');
    setSearchQuery('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>
      
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
      
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-dark-700 p-4 rounded-lg">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-gray-400 mr-2">Filter By</span>
          <div className="relative">
            <select 
              className="bg-dark-800 text-white border border-dark-600 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-400 mr-2">User Status</span>
          <div className="relative">
            <select 
              className="bg-dark-800 text-white border border-dark-600 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={resetFilter}
          className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Reset Filter
        </button>
        
        <div className="flex-grow">
          <div className="relative">
            <input
              type="text"
              placeholder="Search user name..."
              className="w-full py-2 pl-10 pr-4 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* User list */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-dark-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-dark-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    NAME
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    EMAIL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    DATE
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {filteredUsers.map(user => {
                  const status = getUserStatus(user);
                  const statusDetails = getStatusDetails(status);
                  
                  return (
                    <tr key={user.id} className="hover:bg-dark-600">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.id.substring(0, 5)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-white">
                            {user.displayName || 'Unnamed User'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-4 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusDetails.color} ${statusDetails.textColor}`}>
                          {statusDetails.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => status === 'active' ? handleDeactivateUser(user.id) : handleActivateUser(user.id)}
                            className={`p-1 rounded-full ${status === 'active' ? 'text-red-500 hover:bg-red-100 hover:bg-opacity-10' : 'text-green-500 hover:bg-green-100 hover:bg-opacity-10'}`}
                            title={status === 'active' ? 'Deactivate User' : 'Activate User'}
                          >
                            {status === 'active' ? <TrashIcon className="h-5 w-5" /> : <ArrowPathIcon className="h-5 w-5" />}
                          </button>
                          <button
                            className="p-1 rounded-full text-blue-500 hover:bg-blue-100 hover:bg-opacity-10"
                            title="Edit User"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-600">
            <div className="text-sm text-gray-400">
              Showing <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-dark-700 text-gray-400 rounded-md hover:bg-dark-600">
                &lt;
              </button>
              <button className="px-3 py-1 bg-primary-600 text-white rounded-md">
                1
              </button>
              <button className="px-3 py-1 bg-dark-700 text-gray-400 rounded-md hover:bg-dark-600">
                &gt;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {searchQuery ? 'No users found matching your search criteria.' : 'No users found.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Users; 