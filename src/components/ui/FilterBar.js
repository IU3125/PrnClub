import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, limit, where, orderBy } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine selected tab based on URL
  useEffect(() => {
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    if (pathname.includes('/category') || searchParams.has('category')) {
      setSelectedTab(1);
    } else if (pathname.includes('/pornstar') || searchParams.has('pornstar')) {
      setSelectedTab(2);
    } else {
      setSelectedTab(0);
    }

    // Reset selected pornstar when on all pornstars page
    if (pathname === '/pornstar' || pathname.startsWith('/pornstar/')) {
      setActivePornstar('all');
    }

    // Reset selected category when on all categories page
    if (pathname === '/category' || pathname.startsWith('/category/')) {
      setActiveCategory('all');
    }
  }, [location, setActivePornstar, setActiveCategory]);

  // Fetch categories and pornstars with videos, prioritizing suggested ones
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);
        console.log("Fetching suggested categories and pornstars...");
        
        // CATEGORIES - Fetch in two separate queries
        // 1. First get suggested categories - Removing videoCount filter
        const suggestedCategoriesQuery = query(
          collection(db, 'categories'),
          where('suggested', '==', true),
          orderBy('name', 'asc'),
          limit(10)
        );
        
        const suggestedCategoriesSnapshot = await getDocs(suggestedCategoriesQuery);
        console.log(`Found ${suggestedCategoriesSnapshot.size} suggested categories`);
        
        let suggestedCategories = suggestedCategoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          videoCount: doc.data().videoCount || 0,
          suggested: true
        }));
        
        // 2. Then get additional non-suggested categories if needed
        if (suggestedCategories.length < 9) {
          // Removing videoCount filter, get any categories
          const additionalCategoriesQuery = query(
            collection(db, 'categories'),
            orderBy('name', 'asc'),
            limit(9 - suggestedCategories.length)
          );
          
          const additionalCategoriesSnapshot = await getDocs(additionalCategoriesQuery);
          console.log(`Found ${additionalCategoriesSnapshot.size} additional categories`);
          
          const additionalCategories = additionalCategoriesSnapshot.docs
            .filter(doc => !suggestedCategories.some(c => c.id === doc.id)) // Avoid duplicates
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              videoCount: doc.data().videoCount || 0,
              suggested: doc.data().suggested || false
            }));
          
          suggestedCategories = [...suggestedCategories, ...additionalCategories];
        }
        
        setCategories(suggestedCategories);
        console.log("Final categories list:", suggestedCategories);

        // PORNSTARS - Fetch in two separate queries using same approach
        // 1. First get suggested pornstars - No videoCount filter
        const suggestedPornstarsQuery = query(
          collection(db, 'pornstars'),
          where('suggested', '==', true),
          orderBy('name', 'asc'),
          limit(10)
        );
        
        const suggestedPornstarsSnapshot = await getDocs(suggestedPornstarsQuery);
        console.log(`Found ${suggestedPornstarsSnapshot.size} suggested pornstars`);
        
        let suggestedPornstars = suggestedPornstarsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          videoCount: doc.data().videoCount || 0,
          suggested: true
        }));
        
        // 2. Then get additional non-suggested pornstars if needed
        if (suggestedPornstars.length < 9) {
          // No videoCount filter to get all pornstars if needed
          const additionalPornstarsQuery = query(
            collection(db, 'pornstars'),
            orderBy('name', 'asc'),
            limit(9 - suggestedPornstars.length)
          );
          
          const additionalPornstarsSnapshot = await getDocs(additionalPornstarsQuery);
          console.log(`Found ${additionalPornstarsSnapshot.size} additional pornstars`);
          
          const additionalPornstars = additionalPornstarsSnapshot.docs
            .filter(doc => !suggestedPornstars.some(p => p.id === doc.id)) // Avoid duplicates
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              videoCount: doc.data().videoCount || 0,
              suggested: doc.data().suggested || false
            }));
          
          suggestedPornstars = [...suggestedPornstars, ...additionalPornstars];
        }
        
        setPornstars(suggestedPornstars);
        console.log("Final pornstars list:", suggestedPornstars);
        
      } catch (error) {
        console.error('Error occurred while fetching filters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // Change video filters
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    
    // Navigate to appropriate URL based on filter
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('filter', filter);
    
    // Preserve other parameters
    const currentCategoryParam = searchParams.get('category');
    const currentPornstarParam = searchParams.get('pornstar');
    const currentSearchParam = searchParams.get('search');
    
    let baseUrl = '/';
    if (currentCategoryParam) {
      baseUrl = `/?category=${currentCategoryParam}`;
    } else if (currentPornstarParam) {
      baseUrl = `/?pornstar=${currentPornstarParam}`;
    } else if (currentSearchParam) {
      baseUrl = `/?search=${currentSearchParam}`;
    }
    
    // Add filter parameter if it's not already included in the base URL
    if (!baseUrl.includes('filter=')) {
      baseUrl += baseUrl.includes('?') ? '&' : '?';
      baseUrl += `filter=${filter}`;
    }
    
    navigate(baseUrl);
  };

  // Change category
  const handleCategoryChange = (category) => {
    if (category === 'all') {
      setActiveCategory('all');
      navigate('/category');
    } else {
      setActiveCategory(category);
      navigate(`/?category=${category}`);
    }
  };

  // Change pornstar
  const handlePornstarChange = (pornstar) => {
    if (pornstar === 'all') {
      setActivePornstar('all');
      navigate('/pornstar');
    } else {
      setActivePornstar(pornstar);
      navigate(`/?pornstar=${pornstar}`);
    }
  };

  // Determine if on all pornstars page
  const isAllPornstarsPage = location.pathname === '/pornstar' || location.pathname.startsWith('/pornstar/');
  
  // Determine if on all categories page  
  const isAllCategoriesPage = location.pathname === '/category' || location.pathname.startsWith('/category/');

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
            onClick={() => {
              // If current URL has category or pornstar params, remove them
              if (location.search.includes('category=') || location.search.includes('pornstar=')) {
                navigate('/');
              }
            }}
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
            onClick={() => {
              setActiveCategory('all');
              navigate('/category');
            }}
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
            onClick={() => {
              setActivePornstar('all');
              navigate('/pornstar');
            }}
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
                  isAllCategoriesPage || activeCategory === 'all'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                All Categories
              </button>
              {loading ? (
                <div className="text-gray-400 text-sm p-2">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-gray-400 text-sm p-2">No categories found</div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={classNames(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      'hover:bg-dark-700/50',
                      activeCategory === category.id && !isAllCategoriesPage
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-gray-400 hover:text-white',
                      category.suggested ? 'border border-yellow-500/30' : ''
                    )}
                  >
                    {category.name}
                    {category.videoCount > 0 && (
                      <span className="ml-1 text-xs text-gray-500">({category.videoCount})</span>
                    )}
                  </button>
                ))
              )}
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
                  isAllPornstarsPage || activePornstar === 'all'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                All Pornstars
              </button>
              {loading ? (
                <div className="text-gray-400 text-sm p-2">Loading...</div>
              ) : pornstars.length === 0 ? (
                <div className="text-gray-400 text-sm p-2">No pornstars found</div>
              ) : (
                pornstars.map((pornstar) => (
                  <button
                    key={pornstar.id}
                    onClick={() => handlePornstarChange(pornstar.id)}
                    className={classNames(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      'hover:bg-dark-700/50',
                      activePornstar === pornstar.id && !isAllPornstarsPage
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-gray-400 hover:text-white',
                      pornstar.suggested ? 'border border-yellow-500/30' : ''
                    )}
                  >
                    {pornstar.name}
                    {pornstar.videoCount > 0 && (
                      <span className="ml-1 text-xs text-gray-500">({pornstar.videoCount})</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default FilterBar; 