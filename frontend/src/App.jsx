import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Components
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import Cartpages from "./pages/Cartpages";
import ProductDetails from "./pages/ProductDetails";
import LayoutDashboard from "./pages/admin/LayoutDashboard";

// Lazy-loaded pages
const Checkout = React.lazy(() => import('./pages/Checkout'));

// Small wrapper to control navbar visibility
const AppContent = () => {
  const location = useLocation();

  // Hide navbar on admin routes
  const hideNavbar = location.pathname.startsWith("/admin");

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetails />} />

        {/* Protected Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cartpages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div>Loading...</div>}>
                <Checkout />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard (with Sidebar Layout) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <LayoutDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

const App = () => {
  // Persist auth check on app load
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // This will trigger the auth check in ProtectedRoute
      // when the app first loads
      const checkAuth = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Initial auth check failed:', error);
          localStorage.removeItem('token');
        }
      };
      checkAuth();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
};

export default App;
