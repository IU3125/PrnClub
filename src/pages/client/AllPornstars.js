import React from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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
        // Daha gelişmiş bir sorgu ile pornstarları getir
        const pornstarsQuery = query(
          collection(db, 'pornstars'),
          orderBy('name', 'asc')
        );
        
        const snapshot = await getDocs(pornstarsQuery);
        
        // Sonuç bulunamadıysa konsola bilgi yazdır
        console.log(`Found ${snapshot.size} pornstars in database`);
        
        if (snapshot.empty) {
          console.log('No pornstars found in database');
          setLoading(false);
          return;
        }
        
        const pornstarsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          suggested: doc.data().suggested || false,
          videoCount: doc.data().videoCount || 0
        }));
        
        // Önerilen pornstarları önce göster
        pornstarsList.sort((a, b) => {
          // Önce suggested olanlara göre sırala
          if (a.suggested && !b.suggested) return -1;
          if (!a.suggested && b.suggested) return 1;
          
          // Sonra video sayısına göre sırala
          return (b.videoCount || 0) - (a.videoCount || 0);
        });
        
        console.log('Sorted pornstars list:', pornstarsList);
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

  if (pornstars.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Pornstars</h1>
        </div>
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h3 className="text-xl text-gray-300 mb-4">No pornstars found</h3>
          <p className="text-gray-400">
            There are no pornstars in the database yet. Try adding some from the admin panel.
          </p>
        </div>
      </div>
    );
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
            className={`bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-300 ${
              pornstar.suggested ? 'border-2 border-yellow-500/30' : ''
            }`}
          >
            <div className="text-center relative">
              {pornstar.suggested && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              )}
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