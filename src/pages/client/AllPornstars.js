import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AllPornstars = () => {
  const [pornstars, setPornstars] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchPornstars = async () => {
      try {
        const pornstarsRef = collection(db, 'pornstars');
        const snapshot = await getDocs(pornstarsRef);
        const pornstarsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPornstars(pornstarsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pornstars:', error);
        setLoading(false);
      }
    };

    fetchPornstars();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Pornstars</h1>
        <Link 
          to="/videos" 
          state={{ from: location.pathname }}
          className="text-blue-500 hover:text-blue-600"
        >
          View All Videos →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {pornstars.map((pornstar) => (
          <Link
            key={pornstar.id}
            to={`/pornstar/${pornstar.name.toLowerCase()}`}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300"
          >
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden">
                <img
                  src={pornstar.imageUrl || '/default-avatar.png'}
                  alt={pornstar.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold text-white">{pornstar.name}</h3>
              <p className="text-gray-400 text-sm mt-2">{pornstar.videoCount || 0} videos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AllPornstars; 