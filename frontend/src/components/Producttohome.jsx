import React, { useEffect, useState } from "react";
import productApi from "../../api/productApi";
import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import Title from "./Title";

const Producttohome = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productApi.getAll();
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Rating stars helper
  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FaStar key={i} className="text-yellow-400" />);
      else if (rating >= i - 0.5)
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      else stars.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
    return stars;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg animate-pulse">Loading products...</p>
      </div>
    );

  if (products.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg">No products available right now.</p>
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 md:px-10 lg:px-16">

        <Title text="Explore Our Latest Products" />
      
      {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
        Explore Our Latest Products
      </h1> */}

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4  lg:grid-cols-5">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-2xl mt-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col"
          >
            <Link to={`/products/${product._id}`}>
              <img
                src={
                  product.images?.[0]?.url || product.images?.[0] || product.image || "/placeholder.jpg"
                }
                alt={product.name || product.title || "product image"}
                loading="lazy"
                className="w-full h-48 object-cover rounded-xl"
              />
            </Link>

            <div className="flex-1 flex flex-col mt-4">
              <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
                {product.name}
              </h2>

              <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                {product.description || "No description available"}
              </p>

              <div className="flex items-center gap-1 mt-2">
                {renderStars(product.rating)}
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-red-600">
                  ₹{product.price}
                </span>
                <Link
                  to={`/products/${product._id}`}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Producttohome;
