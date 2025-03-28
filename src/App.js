import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DeviceProvider } from './context/DeviceContext';
import { AdProvider } from './context/AdContext';
import { initializeAdStats } from './firebase/initStats';
import { HelmetProvider } from 'react-helmet-async';

// Main site pages
import Home from './pages/client/Home';
import VideoDetail from './pages/client/VideoDetail';
import Login from './pages/client/Login';
import Register from './pages/client/Register';
import Profile from './pages/client/Profile';
import Featured from './pages/client/Featured';
import NotFound from './pages/client/NotFound';
import Category from './pages/client/Category';
import AllCategories from './pages/client/AllCategories';
import AllPornstars from './pages/client/AllPornstars';
import AllVideos from './pages/client/AllVideos';
import CategoryVideos from './pages/client/CategoryVideos';

// Legal and Info pages
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import DMCA from './pages/DMCA';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookie from './pages/Cookie';
import Statement2257 from './pages/Statement2257';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Videos from './pages/admin/Videos';
import Comments from './pages/admin/Comments';
import Categories from './pages/admin/Categories';
import Pornstars from './pages/admin/Pornstars';
import Advertisement from './pages/admin/Advertisement';
import AddAdvertisement from './pages/admin/AddAdvertisement';
import AdminProfile from './pages/admin/Profile';
import VideoScraper from './pages/admin/VideoScraper';
import SeoAnalyzer from './pages/admin/SeoAnalyzer';

// Protective components
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import ClientLayout from './components/layout/ClientLayout';

function App() {
  useEffect(() => {
    // Initialize ad statistics if they don't exist
    initializeAdStats();
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <DeviceProvider>
            <AdProvider>
              <Routes>
                {/* Main site routes */}
                <Route path="/" element={<ClientLayout />}>
                  <Route index element={<Home />} />
                  <Route path="videos" element={<Navigate to="/videos/1" replace />} />
                  <Route path="videos/:page" element={<AllVideos />} />
                  <Route path="video/:id" element={<VideoDetail />} />
                  <Route path="categories" element={<AllCategories />} />
                  <Route path="category" element={<Category />} />
                  <Route path="category/:letter" element={<Category />} />
                  <Route path="category/videos/:categoryName" element={<CategoryVideos />} />
                  <Route path="pornstars" element={<AllPornstars />} />
                  <Route path="pornstar" element={<Category />} />
                  <Route path="pornstar/:letter" element={<Category />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="profile" element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } />
                  <Route path="favorites" element={
                    <PrivateRoute>
                      <Featured />
                    </PrivateRoute>
                  } />
                  
                  {/* Legal and Info pages */}
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="sss" element={<FAQ />} />
                  <Route path="dmca" element={<DMCA />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="cookie" element={<Cookie />} />
                  <Route path="2257" element={<Statement2257 />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="users" element={<Users />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="video-scraper" element={<VideoScraper />} />
                  <Route path="comments" element={<Comments />} />
                  <Route path="pornstars" element={<Pornstars />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="advertisements" element={<Advertisement />} />
                  <Route path="add-advertisement" element={<AddAdvertisement />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="seo-analyzer" element={<SeoAnalyzer />} />
                </Route>

                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AdProvider>
          </DeviceProvider>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App; 