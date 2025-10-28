import React, { useEffect, useState } from "react";
import productApi from "../../api/productApi";
import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Title from "./Title";

const Producttohome = () => {
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(8); // initially show 8
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState(""); // category filter

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productApi.getAll();
        setProducts(response.data || []);
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

  // Unique category list (for dropdown)
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filtered products
  const filteredProducts = filter
    ? products.filter((p) => p.category === filter)
    : products;

  // Visible subset
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  // Load more handler
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 8);
      setLoadingMore(false);
    }, 1000);
  };

  // Main loading state
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-500 w-8 h-8 mr-2" />
        <p className="text-gray-500 text-lg">Loading products...</p>
      </div>
    );

  // No products case
  if (products.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg">No products available right now.</p>
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 md:px-10 lg:px-16">
      <Title text="Explore Our Latest Products" />

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex justify-end mb-6">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setVisibleCount(8);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visibleProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-2xl mt-4 md:p-[90px] p-2 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-3 flex flex-col"
          >
            <Link to={`/products/${product._id}`}>
              <img
                src={
                  product.images?.[0]?.url ||
                  product.images?.[0] ||
                  product.image ||
                  "/placeholder.jpg"
                }
                alt={product.name || "product image"}
                loading="lazy"
                className="w-full h-48 object-cover rounded-xl"
              />
            </Link>

            <div className="flex-1 flex flex-col mt-4">
              <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
                {product.name}
              </h2>

              {product.category && (
                <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded-md w-fit mt-1">
                  {product.category}
                </span>
              )}

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
                  className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredProducts.length && (
        <div className="flex justify-center mt-10">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" /> Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Producttohome;
