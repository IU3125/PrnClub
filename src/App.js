import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Main site pages
import Home from './pages/client/Home';
import VideoDetail from './pages/client/VideoDetail';
import Login from './pages/client/Login';
import Register from './pages/client/Register';
import Profile from './pages/client/Profile';
import Featured from './pages/client/Featured';
import NotFound from './pages/client/NotFound';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Videos from './pages/admin/Videos';
import Comments from './pages/admin/Comments';
import Categories from './pages/admin/Categories';
import Advertisement from './pages/admin/Advertisement';
import AddAdvertisement from './pages/admin/AddAdvertisement';
import AdminProfile from './pages/admin/Profile';

// Protective components
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import ClientLayout from './components/layout/ClientLayout';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          {/* Main site routes */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<Home />} />
            <Route path="video/:id" element={<VideoDetail />} />
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
            <Route path="comments" element={<Comments />} />
            <Route path="categories" element={<Categories />} />
            <Route path="advertisements" element={<Advertisement />} />
            <Route path="add-advertisement" element={<AddAdvertisement />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 