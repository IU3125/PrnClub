import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AllCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoriesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Categories</h1>
        <Link 
          to="/videos" 
          state={{ from: location.pathname }}
          className="text-blue-500 hover:text-blue-600"
        >
          View All Videos →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={category.videoCount && category.videoCount > 0 
              ? `/category/videos/${category.name}` 
              : `/category/${category.name.toLowerCase()}`}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              <p className="text-gray-400 text-sm mt-2">{category.videoCount || 0} videos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AllCategories; 