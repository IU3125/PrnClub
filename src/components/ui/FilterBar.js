import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Tab } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const FilterBar = ({ 
  activeFilter, 
  setActiveFilter, 
  activeCategory, 
  setActiveCategory, 
  activePornstar, 
  setActivePornstar 
}) => {
  const [categories, setCategories] = useState([]);
  const [pornstars, setPornstars] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  // Kategorileri ve pornstarları getir
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Kategorileri getir
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesList);

        // Pornstarları getir
        const pornstarsSnapshot = await getDocs(collection(db, 'pornstars'));
        const pornstarsList = pornstarsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPornstars(pornstarsList);
      } catch (error) {
        console.error('Filtreler getirilirken hata oluştu:', error);
      }
    };

    fetchFilters();
  }, []);

  // Video filtrelerini değiştir
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Kategori değiştir
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    navigate(category === 'all' ? '/' : `/?category=${category}`);
  };

  // Pornstar değiştir
  const handlePornstarChange = (pornstar) => {
    setActivePornstar(pornstar);
    navigate(pornstar === 'all' ? '/' : `/?pornstar=${pornstar}`);
  };

  const videoFilters = [
    { key: 'newest', label: 'En Yeni' },
    { key: 'popular', label: 'Popüler' },
    { key: 'trending', label: 'Trend' },
    { key: 'top-rated', label: 'En Çok Beğenilen' },
  ];

  return (
    <div className="mb-8">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-dark-700 p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none',
                selected
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-400 hover:bg-dark-600 hover:text-white'
              )
            }
          >
            Videos
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none',
                selected
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-400 hover:bg-dark-600 hover:text-white'
              )
            }
          >
            Category
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'focus:outline-none',
                selected
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-400 hover:bg-dark-600 hover:text-white'
              )
            }
          >
            Pornstar
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          {/* Video Filtreleri */}
          <Tab.Panel className="rounded-xl bg-dark-700 p-3">
            <div className="flex flex-wrap gap-2">
              {videoFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterChange(filter.key)}
                  className={classNames(
                    'px-4 py-2 rounded-md text-sm font-medium',
                    activeFilter === filter.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </Tab.Panel>

          {/* Kategori Filtreleri */}
          <Tab.Panel className="rounded-xl bg-dark-700 p-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={classNames(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  activeCategory === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                )}
              >
                Tümü
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={classNames(
                    'px-4 py-2 rounded-md text-sm font-medium',
                    activeCategory === category.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </Tab.Panel>

          {/* Pornstar Filtreleri */}
          <Tab.Panel className="rounded-xl bg-dark-700 p-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePornstarChange('all')}
                className={classNames(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  activePornstar === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                )}
              >
                Tümü
              </button>
              {pornstars.map((pornstar) => (
                <button
                  key={pornstar.id}
                  onClick={() => handlePornstarChange(pornstar.id)}
                  className={classNames(
                    'px-4 py-2 rounded-md text-sm font-medium',
                    activePornstar === pornstar.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                  )}
                >
                  {pornstar.name}
                </button>
              ))}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default FilterBar; 