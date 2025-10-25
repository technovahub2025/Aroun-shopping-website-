import React from "react";
import Navbar from "./Components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import Cartpages from "./pages/Cartpages";
import ProductDetails from "./pages/ProductDetails";
import AdminRoute from "./components/AdminRoute";
import Dashboard from "./pages/admin/Dashboard";
import DashboardHome from "./pages/admin/DashboardHome";
import Products from "./pages/admin/Products";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
      
         <Navbar />
         <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<ProductList />} />
           <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cartpages/>} />
          <Route
  path="/admin/*"
  element={
    <AdminRoute>
      <Dashboard />
    </AdminRoute>
  }
>
  <Route index element={<DashboardHome />} />
  <Route path="products" element={<Products />} />
</Route>
         </Routes>
      
      </BrowserRouter>
   
     
     
    </div>
  );
};

export default App;
