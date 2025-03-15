import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Tab } from '@headlessui/react';
import { ClockIcon, FireIcon, ChartBarIcon, StarIcon } from '@heroicons/react/24/outline';

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

  // Fetch categories and pornstars
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        console.log('Fetching filters...'); // Debug log
        
        // Get categories
        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), limit(9)));
        console.log('Categories snapshot size:', categoriesSnapshot.size); // Debug log
        const categoriesList = categoriesSnapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('Category data:', data); // Debug log
          return data;
        });
        setCategories(categoriesList);

        // Get pornstars
        const pornstarsSnapshot = await getDocs(query(collection(db, 'pornstars'), limit(9)));
        console.log('Pornstars snapshot size:', pornstarsSnapshot.size); // Debug log
        const pornstarsList = pornstarsSnapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('Pornstar data:', data); // Debug log
          return data;
        });
        setPornstars(pornstarsList);
      } catch (error) {
        console.error('Error occurred while fetching filters:', error);
      }
    };

    fetchFilters();
  }, []);

  // Change video filters
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Change category
  const handleCategoryChange = (category) => {
    if (category === 'all') {
      navigate('/category');
    } else {
      setActiveCategory(category);
      navigate(`/?category=${category}`);
    }
  };

  // Change pornstar
  const handlePornstarChange = (pornstar) => {
    if (pornstar === 'all') {
      navigate('/pornstar');
    } else {
      setActivePornstar(pornstar);
      navigate(`/?pornstar=${pornstar}`);
    }
  };

  const videoFilters = [
    { key: 'newest', label: 'Newest', icon: ClockIcon },
    { key: 'popular', label: 'Popular', icon: FireIcon },
    { key: 'trending', label: 'Trending', icon: ChartBarIcon },
    { key: 'top-rated', label: 'Top Rated', icon: StarIcon },
  ];

  return (
    <div className="py-2">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        {/* Main Navigation Tabs */}
        <Tab.List className="flex space-x-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-xl py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none',
                selected
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              )
            }
          >
            Videos
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-xl py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none',
                selected
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              )
            }
          >
            Category
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-xl py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none',
                selected
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              )
            }
          >
            Pornstar
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-2">
          {/* Video Filters Panel */}
          <Tab.Panel>
            <div className="flex flex-wrap gap-2">
              {videoFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key)}
                    className={classNames(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      'hover:bg-dark-700/50',
                      activeFilter === filter.key
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </Tab.Panel>

          {/* Category Panel */}
          <Tab.Panel>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={classNames(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  'hover:bg-dark-700/50',
                  activeCategory === 'all'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={classNames(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-dark-700/50',
                    activeCategory === category.id
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </Tab.Panel>

          {/* Pornstar Panel */}
          <Tab.Panel>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePornstarChange('all')}
                className={classNames(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  'hover:bg-dark-700/50',
                  activePornstar === 'all'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                All Pornstars
              </button>
              {pornstars.map((pornstar) => (
                <button
                  key={pornstar.id}
                  onClick={() => handlePornstarChange(pornstar.id)}
                  className={classNames(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-dark-700/50',
                    activePornstar === pornstar.id
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-gray-400 hover:text-white'
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