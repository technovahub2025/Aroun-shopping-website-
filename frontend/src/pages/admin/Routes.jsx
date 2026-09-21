import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
// import DashboardHome from './DashboardHome';
const Products = lazy(() => import('./Products'));
const DeletedProducts = lazy(() => import('./DeletedProducts'));

const AdminRoutes = () => {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-gray-500">Loading admin page...</p>}>
    <Routes>
      {/* <Route path="/" element={<DashboardHome />} /> */}
      <Route path="/" element={<Products />} />
      <Route path="deleted-products" element={<DeletedProducts />} />
      {/* <Route path="users" element={<div>Users Management (Coming Soon)</div>} />
      <Route path="settings" element={<div>Settings (Coming Soon)</div>} /> */}
    </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
