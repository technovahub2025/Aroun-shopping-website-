import React from 'react';
import { Routes, Route } from 'react-router-dom';
// import DashboardHome from './DashboardHome';
import Products from './Products';
import DeletedProducts from './DeletedProducts';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<DashboardHome />} /> */}
      <Route path="/" element={<Products />} />
      <Route path="deleted-products" element={<DeletedProducts />} />
      {/* <Route path="users" element={<div>Users Management (Coming Soon)</div>} />
      <Route path="settings" element={<div>Settings (Coming Soon)</div>} /> */}
    </Routes>
  );
};

export default AdminRoutes;
