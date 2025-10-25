import React from "react";
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
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
};

export default App;
