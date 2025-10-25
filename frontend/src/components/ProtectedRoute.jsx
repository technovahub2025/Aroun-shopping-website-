import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.user.user);

  if (!user) {
    toast.error('Please login to access this page');
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;