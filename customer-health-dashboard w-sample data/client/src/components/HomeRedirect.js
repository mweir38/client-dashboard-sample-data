import React from 'react';
import { Navigate } from 'react-router-dom';

const HomeRedirect = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = JSON.parse(user);
    if (userData.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userData.role === 'client') {
      return <Navigate to="/client-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (error) {
    // Invalid user data, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default HomeRedirect; 