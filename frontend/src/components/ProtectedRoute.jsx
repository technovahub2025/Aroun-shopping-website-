import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import { setUser, setLoading } from '../redux/userSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch(setLoading(true));
        const { data } = await apiClient.get('/auth/me');
        dispatch(setUser(data.user));
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        dispatch(setLoading(false));
        setIsChecking(false);
      }
    };

    if (!user) {
      checkAuthStatus();
    } else {
      setIsChecking(false);
    }
  }, [dispatch, user]);

  // Show loading while checking auth status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Only show toast and redirect if we're sure user is not authenticated
  if (!user && !isChecking) {
    toast.error('Please login to access this page');
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;