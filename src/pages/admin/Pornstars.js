import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const Pornstars = () => {
  const [pornstars, setPornstars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPornstar, setNewPornstar] = useState('');
  const [editingPornstar, setEditingPornstar] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('all');

  const alphabet = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // Fetch pornstars
  useEffect(() => {
    const fetchPornstars = async () => {
      setLoading(true);
      try {
        const pornstarsQuery = query(
          collection(db, 'pornstars'),
          orderBy('name', 'asc')
        );
        
        const pornstarsSnapshot = await getDocs(pornstarsQuery);
        const pornstarsList = pornstarsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          suggested: doc.data().suggested || false // Ensure suggested field exists
        }));
        
        setPornstars(pornstarsList);
      } catch (error) {
        console.error('Error fetching pornstars:', error);
        setError('Error fetching pornstars.');
      } finally {
        setLoading(false);
      }
    };

    fetchPornstars();
  }, []);

  // Add new pornstar
  const handleAddPornstar = async (e) => {
    e.preventDefault();
    
    if (!newPornstar.trim()) {
      setError('Pornstar name cannot be empty.');
      return;
    }
    
    // Check if pornstar with same name exists
    const pornstarExists = pornstars.some(
      pornstar => pornstar.name.toLowerCase() === newPornstar.toLowerCase()
    );
    
    if (pornstarExists) {
      setError('A pornstar with this name already exists.');
      return;
    }
    
    setLoading(true);
    try {
      const pornstarData = {
        name: newPornstar.trim(),
        slug: newPornstar.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        videoCount: 0 // Initialize with zero videos
      };
      
      const docRef = await addDoc(collection(db, 'pornstars'), pornstarData);
      
      setPornstars([...pornstars, { id: docRef.id, ...pornstarData }]);
      setNewPornstar('');
      setSuccess('Pornstar added successfully.');
      setError('');
    } catch (error) {
      console.error('Error adding pornstar:', error);
      setError('An error occurred while adding the pornstar.');
    } finally {
      setLoading(false);
    }
  };

  // Start editing pornstar
  const handleEditStart = (pornstar) => {
    setEditingPornstar(pornstar.id);
    setEditValue(pornstar.name);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingPornstar(null);
    setEditValue('');
  };

  // Save edited pornstar
  const handleEditSave = async (pornstarId) => {
    if (!editValue.trim()) {
      setError('Pornstar name cannot be empty.');
      return;
    }
    
    // Check if another pornstar with same name exists
    const pornstarExists = pornstars.some(
      pornstar => pornstar.id !== pornstarId && 
      pornstar.name.toLowerCase() === editValue.toLowerCase()
    );
    
    if (pornstarExists) {
      setError('A pornstar with this name already exists.');
      return;
    }
    
    setLoading(true);
    try {
      const pornstarRef = doc(db, 'pornstars', pornstarId);
      const updatedData = {
        name: editValue.trim(),
        slug: editValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(pornstarRef, updatedData);
      
      // Update pornstars list
      setPornstars(pornstars.map(pornstar => 
        pornstar.id === pornstarId 
          ? { ...pornstar, ...updatedData } 
          : pornstar
      ));
      
      setEditingPornstar(null);
      setEditValue('');
      setSuccess('Pornstar updated successfully.');
      setError('');
    } catch (error) {
      console.error('Error updating pornstar:', error);
      setError('An error occurred while updating the pornstar.');
    } finally {
      setLoading(false);
    }
  };

  // Delete pornstar
  const handleDeletePornstar = async (pornstarId) => {
    if (!window.confirm('Are you sure you want to delete this pornstar?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'pornstars', pornstarId));
      
      // Remove pornstar from list
      setPornstars(pornstars.filter(pornstar => pornstar.id !== pornstarId));
      
      setSuccess('Pornstar deleted successfully.');
      setError('');
    } catch (error) {
      console.error('Error deleting pornstar:', error);
      setError('An error occurred while deleting the pornstar.');
    } finally {
      setLoading(false);
    }
  };

  // Modified filter function to handle both search, alphabet filtering, and view mode
  const filteredPornstars = pornstars.filter(pornstar => {
    const searchLower = searchQuery.toLowerCase();
    const name = pornstar.name || '';
    const matchesSearch = name.toLowerCase().includes(searchLower);
    
    if (selectedLetter === 'all') {
      return matchesSearch;
    } else if (selectedLetter === '#') {
      return matchesSearch && /^[0-9]/.test(name);
    } else {
      return matchesSearch && name.charAt(0).toUpperCase() === selectedLetter;
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Pornstar Management</h1>
      
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
      
      {/* Add new pornstar form */}
      <div className="bg-dark-700 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Add New Pornstar</h2>
        <form onSubmit={handleAddPornstar} className="flex gap-2">
          <input
            type="text"
            placeholder="Pornstar name"
            className="flex-1 py-2 px-4 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            value={newPornstar}
            onChange={(e) => setNewPornstar(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md flex items-center"
            disabled={loading}
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add
          </button>
        </form>
      </div>

      {/* Alphabet filter */}
      <div className="flex flex-wrap gap-2 mb-4 bg-dark-700 p-4 rounded-lg">
        <button
          onClick={() => setSelectedLetter('all')}
          className={`px-3 py-1 rounded ${
            selectedLetter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
          }`}
        >
          All
        </button>
        {alphabet.map((letter) => (
          <button
            key={letter}
            onClick={() => setSelectedLetter(letter)}
            className={`px-3 py-1 rounded ${
              selectedLetter === letter
                ? 'bg-primary-500 text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
      
      {/* Search field */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search pornstars..."
          className="w-full py-2 pl-10 pr-4 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      {/* Pornstars list */}
      <div className="bg-dark-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-dark-600">
          <thead className="bg-dark-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Pornstar Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Videos
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-dark-700 divide-y divide-dark-600">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-white">
                  Loading...
                </td>
              </tr>
            ) : filteredPornstars.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-white">
                  No pornstars found.
                </td>
              </tr>
            ) : (
              filteredPornstars.map((pornstar) => (
                <tr key={pornstar.id} className="hover:bg-dark-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingPornstar === pornstar.id ? (
                      <input
                        type="text"
                        className="py-1 px-2 bg-dark-800 border border-dark-600 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="text-white">{pornstar.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-400">{pornstar.videoCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingPornstar === pornstar.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditSave(pornstar.id)}
                          className="text-green-500 hover:text-green-400"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-red-500 hover:text-red-400"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditStart(pornstar)}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePornstar(pornstar.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pornstars; 