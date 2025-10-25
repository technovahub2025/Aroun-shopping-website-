import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import Products from './Products';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="products" element={<Products />} />
      <Route path="users" element={<div>Users Management (Coming Soon)</div>} />
      <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
    </Routes>
  );
};

export default AdminRoutes;