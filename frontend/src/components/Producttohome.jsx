


import React, { useState } from "react";
import usePagedCatalog from "../hooks/usePagedCatalog";
import useCatalogFacets from "../hooks/useCatalogFacets";
import productApi from "../../api/productApi";
import CatalogLoadMore from "./CatalogLoadMore";
import { Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Title from "./Title";

const Producttohome = () => {
  const [filter, setFilter] = useState("");
  const page = usePagedCatalog(productApi.getCatalogBatch, { limit: 8, sort: 'newest', categories: JSON.stringify(filter ? [filter] : []) });
  const { items: visibleProducts, loading } = page;
  const facets = useCatalogFacets();
  const categories = facets.categories.map(category => category.name);

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

  // Main loading state
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-500 w-8 h-8 mr-2" />
        <p className="text-gray-500 text-lg">Loading products...</p>
      </div>
    );


  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 md:px-10 lg:px-16">
      <Title text="Explore Our Latest Products" />

      {facets.error && <button onClick={facets.reload} className="text-red-600">Retry loading categories</button>}
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex justify-end mb-6">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {visibleProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-2xl mt-4 md:p-[10px] p-2 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <Link to={`/products/${product._id}`}>
              <img
                src={product.images?.[0]?.url ||
                  product.images?.[0] ||
                  product.image ||
                  "/placeholder.jpg"}
                alt={product.title || product.name || "product image"}
                loading="lazy"
                decoding="async"
                className="w-full md:h-[50vh] object-cover rounded-xl"
              />
            </Link>

            <div className="flex-1 flex flex-col mt-4">
              <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
                {product.title || product.name}
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
                {/* Price Section */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                      ₹{product.price}
                    </span>
                    {product.mrp && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.mrp}
                      </span>
                    )}
                  </div>
                  {product.mrp && product.price && (
                    <span className="text-xs text-green-600 font-semibold">
                      {Math.round(
                        Math.abs((product.mrp - product.price) / product.mrp) * 100
                      )}
                      % OFF
                    </span>
                  )}
                </div>

                <Link
                  to={`/products/${product._id}`}
                  className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition cursor-pointer"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && !page.error && visibleProducts.length === 0 && <p className="py-8 text-center">No products found.</p>}
      <CatalogLoadMore {...page} shown={visibleProducts.length} />
    </div>
  );
};

export default Producttohome;
