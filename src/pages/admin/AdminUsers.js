import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  UserCircleIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { userRole } = useAuth();
  const [filterBy, setFilterBy] = useState('date');
  const [orderStatus, setOrderStatus] = useState('all');

  // Fetch admin users
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const adminsQuery = query(
          collection(db, 'admins'),
          orderBy('createdAt', 'desc')
        );
        
        const adminsSnapshot = await getDocs(adminsQuery);
        const adminsList = adminsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAdmins(adminsList);
      } catch (error) {
        console.error('Error fetching admin users:', error);
        setError('An error occurred while fetching admin users.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  // Delete admin user
  const handleDeleteAdmin = async (adminId) => {
    // Only users with ad_admin role can delete admins
    if (userRole !== 'ad_admin') {
      setError('You do not have sufficient permissions to perform this action.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this admin user?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'admins', adminId));
      
      // Remove admin user from the list
      setAdmins(admins.filter(admin => admin.id !== adminId));
      
      setSuccess('Admin user successfully deleted.');
    } catch (error) {
      console.error('Error deleting admin user:', error);
      setError('An error occurred while deleting the admin user.');
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
  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchQuery.toLowerCase();
    return (
      admin.displayName?.toLowerCase().includes(searchLower) ||
      admin.email?.toLowerCase().includes(searchLower)
    );
  });

  // Reset filters
  const resetFilter = () => {
    setFilterBy('date');
    setOrderStatus('all');
    setSearchQuery('');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Users</h1>
      
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
      
      <div className="mb-6">
        <p className="text-gray-400 mb-4">
          Admin kullanıcıları oluşturmak için <code>node src/scripts/createAdmin.js</code> komutunu kullanın.
        </p>
        
        <div className="bg-dark-800 p-4 rounded-lg mb-4">
          <h3 className="text-white font-medium mb-2">Örnek Kullanım:</h3>
          <pre className="bg-dark-900 p-3 rounded text-gray-300 overflow-x-auto">
            node src/scripts/createAdmin.js admin@example.com password123 "Admin User" admin
          </pre>
        </div>
      </div>
      
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
          <span className="text-gray-400 mr-2">Role</span>
          <div className="relative">
            <select 
              className="bg-dark-800 text-white border border-dark-600 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="ad_admin">Super Admin</option>
              <option value="admin">Admin</option>
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
              placeholder="Search admin name..."
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
      
      {/* Admin list */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredAdmins.length > 0 ? (
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
                    ROLE
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    DATE
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {filteredAdmins.map(admin => (
                  <tr key={admin.id} className="hover:bg-dark-600">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {admin.id.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-white">
                          {admin.displayName || 'Unnamed Admin'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShieldCheckIcon className={`h-5 w-5 mr-2 ${admin.role === 'ad_admin' ? 'text-purple-500' : 'text-blue-500'}`} />
                        <span className="text-sm text-gray-300">
                          {admin.role === 'ad_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {userRole === 'ad_admin' && admin.role !== 'ad_admin' && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-1 rounded-full text-red-500 hover:bg-red-100 hover:bg-opacity-10"
                          title="Delete Admin"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-dark-600">
            <div className="text-sm text-gray-400">
              Showing <span className="font-medium">{filteredAdmins.length}</span> of <span className="font-medium">{admins.length}</span> admins
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
            {searchQuery ? 'No admin users found matching your search criteria.' : 'No admin users found.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 