import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Check if token is expired (basic check)
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (tokenData.exp < currentTime) {
      // Token is expired, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonationToken');
      localStorage.removeItem('impersonationData');
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    // Invalid token, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonationToken');
    localStorage.removeItem('impersonationData');
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  try {
    const userData = JSON.parse(user);
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    
    // Check role from token (more secure) or user data as fallback
    const userRole = tokenData.user?.role || userData.role;
    
    if (userRole !== 'admin') {
      // Redirect to dashboard if not admin
      return <Navigate to="/dashboard" replace />;
    }
  } catch (error) {
    // Invalid user data, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;