import React from "react";
import Navbar from "./Components/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/cart";
import ProductList from "./pages/ProductList";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
      
         <Navbar />
         <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<ProductList />} />

      
          <Route path="/cart" element={<Cart/>} />
         </Routes>
      
      </BrowserRouter>
   
     
     
    </div>
  );
};

export default App;
