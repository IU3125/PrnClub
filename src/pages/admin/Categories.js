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
  MagnifyingGlassIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'suggested', 'regular'

  const alphabet = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // Kategorileri getir
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('name', 'asc')
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          suggested: doc.data().suggested || false // Ensure suggested field exists
        }));
        
        setCategories(categoriesList);
      } catch (error) {
        console.error('Kategoriler getirilirken hata oluştu:', error);
        setError('Kategoriler getirilirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Yeni kategori ekle
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    
    // Check if category with same name exists
    const categoryExists = categories.some(
      category => category.name.toLowerCase() === newCategory.toLowerCase()
    );
    
    if (categoryExists) {
      setError('A category with this name already exists.');
      return;
    }
    
    setLoading(true);
    try {
      const categoryData = {
        name: newCategory.trim(),
        slug: newCategory.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        suggested: false, // Default to not suggested
        videoCount: 0 // Initialize with zero videos
      };
      
      const docRef = await addDoc(collection(db, 'categories'), categoryData);
      
      setCategories([...categories, { id: docRef.id, ...categoryData }]);
      setNewCategory('');
      setSuccess('Category added successfully.');
      setError('');
    } catch (error) {
      console.error('Error adding category:', error);
      setError('An error occurred while adding the category.');
    } finally {
      setLoading(false);
    }
  };

  // Kategori düzenleme modunu aç
  const handleEditStart = (category) => {
    setEditingCategory(category.id);
    setEditValue(category.name);
  };

  // Kategori düzenlemeyi iptal et
  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  // Kategori düzenlemeyi kaydet
  const handleEditSave = async (categoryId) => {
    if (!editValue.trim()) {
      setError('Kategori adı boş olamaz.');
      return;
    }
    
    // Aynı isimde başka bir kategori var mı kontrol et
    const categoryExists = categories.some(
      category => category.id !== categoryId && 
      category.name.toLowerCase() === editValue.toLowerCase()
    );
    
    if (categoryExists) {
      setError('Bu isimde bir kategori zaten mevcut.');
      return;
    }
    
    setLoading(true);
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      const updatedData = {
        name: editValue.trim(),
        slug: editValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(categoryRef, updatedData);
      
      // Kategoriler listesini güncelle
      setCategories(categories.map(category => 
        category.id === categoryId 
          ? { ...category, ...updatedData } 
          : category
      ));
      
      setEditingCategory(null);
      setEditValue('');
      setSuccess('Kategori başarıyla güncellendi.');
      setError('');
    } catch (error) {
      console.error('Kategori güncellenirken hata oluştu:', error);
      setError('Kategori güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle suggested status for a category
  const handleToggleSuggested = async (categoryId, currentStatus) => {
    setLoading(true);
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      // Toggle the suggested status
      const newSuggestedStatus = !currentStatus;
      
      // Update both in Firestore and local state
      await updateDoc(categoryRef, {
        suggested: newSuggestedStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Category ${categoryId} suggested status updated to: ${newSuggestedStatus}`);
      
      // Update categories list
      setCategories(categories.map(category => 
        category.id === categoryId 
          ? { ...category, suggested: newSuggestedStatus } 
          : category
      ));
      
      setSuccess(`Category is now ${newSuggestedStatus ? 'suggested' : 'not suggested'}.`);
      setError('');
    } catch (error) {
      console.error('Error updating suggested status:', error);
      setError('An error occurred while updating suggested status.');
    } finally {
      setLoading(false);
    }
  };

  // Kategori sil
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      
      // Kategoriyi listeden kaldır
      setCategories(categories.filter(category => category.id !== categoryId));
      
      setSuccess('Kategori başarıyla silindi.');
      setError('');
    } catch (error) {
      console.error('Kategori silinirken hata oluştu:', error);
      setError('Kategori silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Modified filter function to handle both search, alphabet filtering, and view mode
  const filteredCategories = categories.filter(category => {
    const searchLower = searchQuery.toLowerCase();
    const name = category.name || '';
    const matchesSearch = name.toLowerCase().includes(searchLower);
    const matchesViewMode = 
      viewMode === 'all' || 
      (viewMode === 'suggested' && category.suggested) || 
      (viewMode === 'regular' && !category.suggested);
    
    if (selectedLetter === 'all') {
      return matchesSearch && matchesViewMode;
    } else if (selectedLetter === '#') {
      return matchesSearch && matchesViewMode && /^[0-9]/.test(name);
    } else {
      return matchesSearch && matchesViewMode && name.charAt(0).toUpperCase() === selectedLetter;
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Category Management</h1>
      
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
      
      {/* Add new category form */}
      <div className="bg-dark-700 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Add New Category</h2>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            placeholder="Category name"
            className="flex-1 py-2 px-4 bg-dark-800 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
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

      {/* View Mode Selector */}
      <div className="flex flex-wrap gap-2 mb-4 bg-dark-700 p-4 rounded-lg">
        <div className="flex-1 text-gray-300 font-semibold">View:</div>
        <button
          onClick={() => setViewMode('all')}
          className={`px-3 py-1 rounded ${
            viewMode === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setViewMode('suggested')}
          className={`px-3 py-1 rounded flex items-center ${
            viewMode === 'suggested'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
          }`}
        >
          <StarIconSolid className="h-4 w-4 mr-1 text-yellow-400" />
          Suggested
        </button>
        <button
          onClick={() => setViewMode('regular')}
          className={`px-3 py-1 rounded ${
            viewMode === 'regular'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
          }`}
        >
          Regular
        </button>
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
          placeholder="Search categories..."
          className="w-full py-2 pl-10 pr-4 bg-dark-700 border border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      {/* Categories list */}
      <div className="bg-dark-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-dark-600">
          <thead className="bg-dark-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Category Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Videos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Suggested
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
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-white">
                  No categories found.
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-dark-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory === category.id ? (
                      <input
                        type="text"
                        className="py-1 px-2 bg-dark-800 border border-dark-600 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="text-white">{category.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-400">{category.videoCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleSuggested(category.id, category.suggested)}
                      className="p-1 rounded-full hover:bg-dark-600 transition-colors"
                      title={category.suggested ? "Remove from suggested" : "Add to suggested"}
                    >
                      {category.suggested ? (
                        <StarIconSolid className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingCategory === category.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditSave(category.id)}
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
                          onClick={() => handleEditStart(category)}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
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

export default Categories; 