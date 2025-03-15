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
          ...doc.data()
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
        updatedAt: serverTimestamp()
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

  // Modified filter function to handle both search and alphabet filtering
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
      
      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search pornstars..."
          className="w-full py-2 pl-10 pr-4 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Pornstar list */}
      {loading && pornstars.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredPornstars.length === 0 ? (
        <div className="bg-dark-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {searchQuery ? 'No pornstars found matching your search criteria.' : 'No pornstars found.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPornstars.map((pornstar) => (
            <div
              key={pornstar.id}
              className="bg-dark-700 rounded-lg p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                {editingPornstar === pornstar.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 py-1 px-2 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white text-sm"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-white font-medium">{pornstar.name}</h3>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-auto">
                {editingPornstar === pornstar.id ? (
                  <>
                    <button
                      onClick={() => handleEditSave(pornstar.id)}
                      className="p-2 text-green-500 hover:text-green-400 transition-colors"
                      disabled={loading}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="p-2 text-red-500 hover:text-red-400 transition-colors"
                      disabled={loading}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditStart(pornstar)}
                      className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
                      disabled={loading}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePornstar(pornstar.id)}
                      className="p-2 text-red-500 hover:text-red-400 transition-colors"
                      disabled={loading}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pornstars; 