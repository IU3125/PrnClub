import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import VideoCard from '../../components/video/VideoCard';
import SEO from '../../components/seo/SEO';

const Category = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState('all');
  const { letter } = useParams();
  const location = useLocation();
  const type = location.pathname.includes('pornstar') ? 'pornstar' : 'category';

  const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  useEffect(() => {
    // If we have a letter parameter, fetch items for that letter
    if (letter) {
      setSelectedLetter(letter.toUpperCase());
      fetchItems(letter.toUpperCase());
    } else {
      // Otherwise fetch all items
      setSelectedLetter('all');
      fetchAllItems();
    }
  }, [letter, type]); // Re-run when type or letter changes

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    if (letter === 'all') {
      fetchAllItems();
    } else {
      fetchItems(letter);
    }
  };

  const fetchAllItems = async () => {
    try {
      setLoading(true);
      const collectionRef = collection(db, type === 'pornstar' ? 'pornstars' : 'categories');
      const q = query(collectionRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const itemData = [];
      
      for (const doc of querySnapshot.docs) {
        const data = { id: doc.id, ...doc.data() };
        // Only include items with videos
        if (data.videoCount && data.videoCount > 0) {
          // For categories and pornstars with videos, fetch the first video
          const firstVideoId = await fetchFirstVideo(type === 'pornstar' ? 'pornstars' : 'categories', data.name);
          data.firstVideoId = firstVideoId;
          itemData.push(data);
        }
      }
      
      setItems(itemData);
    } catch (error) {
      console.error('Error fetching all items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (selectedLetter) => {
    try {
      setLoading(true);
      const collectionRef = collection(db, type === 'pornstar' ? 'pornstars' : 'categories');
      let q;

      if (selectedLetter === '#') {
        // Query for items starting with numbers
        q = query(
          collectionRef, 
          where('name', '>=', '0'), 
          where('name', '<=', '9'),
          limit(50) // Increased limit to get more results
        );
      } else {
        // Query for items starting with selected letter
        q = query(
          collectionRef,
          where('name', '>=', selectedLetter),
          where('name', '<', String.fromCharCode(selectedLetter.charCodeAt(0) + 1)),
          limit(50) // Increased limit to get more results
        );
      }

      const querySnapshot = await getDocs(q);
      const itemData = [];
      
      // Filter items that have videos and fetch first video for each
      for (const doc of querySnapshot.docs) {
        const data = { id: doc.id, ...doc.data() };
        // Only include items with videos
        if (data.videoCount && data.videoCount > 0) {
          const firstVideoId = await fetchFirstVideo(type === 'pornstar' ? 'pornstars' : 'categories', data.name);
          data.firstVideoId = firstVideoId;
          itemData.push(data);
        }
      }
      
      setItems(itemData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch first video for a category or pornstar
  const fetchFirstVideo = async (itemType, itemName) => {
    try {
      const videosRef = collection(db, 'videos');
      let q;
      
      if (itemType === 'categories') {
        q = query(
          videosRef,
          where('categories', 'array-contains', itemName),
          limit(1)
        );
      } else { // pornstars
        q = query(
          videosRef,
          where('pornstars', 'array-contains', itemName),
          limit(1)
        );
      }
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching first video:', error);
      return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={`${type === 'pornstar' ? 'Pornstars' : 'Categories'} - Browse By Letter`}
        description={`Browse all ${type === 'pornstar' ? 'pornstars' : 'categories'} by alphabetical order.`}
      />
    
      <h1 className="text-3xl font-bold text-white mb-8">
        {type === 'pornstar' ? 'Pornstars' : 'Categories'}
      </h1>
      
      {/* Alphabet Navigation */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleLetterClick('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              selectedLetter === 'all'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'bg-dark-600 text-gray-400 hover:bg-dark-500 hover:text-white'
            }`}
          >
            All
          </button>
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedLetter === letter
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-600 text-gray-400 hover:bg-dark-500 hover:text-white'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-dark-800 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            const hasVideos = item.videoCount && item.videoCount > 0;
            return (
              <Link 
                key={item.id} 
                to={hasVideos 
                  ? (type === 'pornstar' 
                    ? `/?pornstar=${item.id}` 
                    : `/?category=${item.id}`)
                  : '#'}
                className={`group bg-dark-700 rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 ${
                  hasVideos ? 'hover:bg-primary-600/20' : 'hover:bg-dark-600'
                }`}
              >
                <h3 className="text-white text-sm font-medium truncate group-hover:text-primary-400 transition-colors duration-300">
                  {item.name}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-400">
                    {item.videoCount || 0} videos
                  </span>
                  {hasVideos && (
                    <span className="ml-auto text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Watch →
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No Results Message */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-dark-700 rounded-xl">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Results Found</h3>
          <p className="text-gray-400">
            No {type === 'pornstar' ? 'pornstars' : 'categories'} found for the selected letter.
          </p>
        </div>
      )}
    </div>
  );
};

export default Category; 