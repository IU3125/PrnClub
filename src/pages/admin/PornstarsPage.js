import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';

const PornstarsPage = () => {
  const [pornstars, setPornstars] = useState([]);
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPornstars();
  }, []);

  const fetchPornstars = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pornstars'));
      const pornstarsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPornstars(pornstarsList);
    } catch (error) {
      console.error('Error fetching pornstars:', error);
      alert('Error fetching pornstars');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      if (image) {
        const storageRef = ref(storage, `pornstars/${image.name}-${Date.now()}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (editingId) {
        const pornstarRef = doc(db, 'pornstars', editingId);
        await updateDoc(pornstarRef, {
          name,
          ...(imageUrl && { imageUrl })
        });
      } else {
        await addDoc(collection(db, 'pornstars'), {
          name,
          imageUrl,
          createdAt: new Date().toISOString()
        });
      }

      setName('');
      setImage(null);
      setEditingId(null);
      fetchPornstars();
    } catch (error) {
      console.error('Error saving pornstar:', error);
      alert('Error saving pornstar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this pornstar?')) return;

    try {
      await deleteDoc(doc(db, 'pornstars', id));
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
      fetchPornstars();
    } catch (error) {
      console.error('Error deleting pornstar:', error);
      alert('Error deleting pornstar');
    }
  };

  const handleEdit = (pornstar) => {
    setEditingId(pornstar.id);
    setName(pornstar.name);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Pornstars</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Image
          </label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            accept="image/*"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')} Pornstar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pornstars.map((pornstar) => (
          <div key={pornstar.id} className="bg-white p-4 rounded-lg shadow">
            {pornstar.imageUrl && (
              <img
                src={pornstar.imageUrl}
                alt={pornstar.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}
            <h3 className="text-lg font-semibold">{pornstar.name}</h3>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleEdit(pornstar)}
                className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(pornstar.id, pornstar.imageUrl)}
                className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PornstarsPage; 