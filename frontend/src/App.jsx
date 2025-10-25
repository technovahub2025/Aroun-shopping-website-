import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Components
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import Cartpages from "./pages/Cartpages";
import ProductDetails from "./pages/ProductDetails";


const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        {/* Navigation */}
        <Navbar />
        
        {/* Routes Configuration */}
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
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
