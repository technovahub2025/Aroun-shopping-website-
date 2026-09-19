import { resolveImageUrl } from "../utils/imageUrl.js";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import productApi from "../../api/productApi";
import useCatalogPagination from "../hooks/useCatalogPagination";
import useCatalogFacets from "../hooks/useCatalogFacets";
import { LoaderCircle } from "lucide-react";
import NumberedPagination from "../components/NumberedPagination";
import apiClient from "../../api/apiClient";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaFilter,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/userSlice";

const ProductList = () => {
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const user = useSelector((state) => state.user.user);
  const [searchParams] = useSearchParams();
  const [categoryFilters, setCategoryFilters] = useState(() => searchParams.get("category") ? [searchParams.get("category")] : []);
  const [typeFilters, setTypeFilters] = useState([]);
  const [sortBy, setSortBy] = useState("Relevant");
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const sortOptions = [
    "Relevant",
    "Price: Low to High",
    "Price: High to Low",
    "Newest",
  ];

  const selectedCategory = searchParams.get("category");
  const search = searchParams.get("search")?.trim() || "";
  const isAdmin = user?.role === "admin";
  const sortNames = { Relevant: 'relevant', 'Price: Low to High': 'price-asc', 'Price: High to Low': 'price-desc', Newest: 'newest' };
  const page = useCatalogPagination(productApi.getCatalogBatch, {
    limit: 60, search, sort: sortNames[sortBy], categories: JSON.stringify(categoryFilters), types: JSON.stringify(typeFilters),
  });
  const { items: currentProducts, loading, setError, reload } = page;
  const facets = useCatalogFacets();
  const availableCategories = facets.categories.map(category => category.name);
  const availableTypes = facets.types;
  const categoryCounts = new Map(facets.categories.map(category => [category.name, category.count]));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get("/auth/me");
        dispatch(setUser(data.user));
      } catch {
        // Ignore auth errors here. Non-admin users should still access product listing.
      }
    };

    if (!user && localStorage.getItem("token")) {
      fetchUser();
    }
  }, [dispatch, user]);

  useEffect(() => {
    setCategoryFilters(selectedCategory ? [selectedCategory] : []);
  }, [selectedCategory]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCategoryChange = (cat) => {
    setCategoryFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleTypeChange = (type) => {
    setTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCategoryDelete = async (category) => {
    if (!category) return;
    if (!window.confirm(`Delete all products in "${category}" category?`)) {
      return;
    }

    try {
      await productApi.deleteCategory(category);

      reload();
      facets.reload();
      setCategoryFilters((prev) => prev.filter((cat) => cat !== category));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          {selectedCategory ? `${selectedCategory} Products` : "All Products"}
        </h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg shadow hover:bg-red-600 transition"
            onClick={() => setShowFilters(true)}
          >
            <FaFilter /> Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm shadow-sm focus:ring-1 focus:ring-red-400 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <AnimatePresence>
          {showFilters && !isDesktop && (
            <Motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowFilters(false)}
            />
          )}

          {(showFilters || isDesktop) && (
            <Motion.aside
              key="filters"
              initial={{ x: isDesktop ? 0 : -300, opacity: isDesktop ? 1 : 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isDesktop ? 0 : -300, opacity: isDesktop ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className={`${
                isDesktop
                  ? "md:col-span-3 bg-white shadow-lg p-6 rounded-2xl h-fit sticky top-24"
                  : "fixed top-0 left-0 w-72 h-full bg-white shadow-2xl p-6 z-50 overflow-y-auto"
              }`}
            >
              {!isDesktop && (
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FaFilter className="text-red-500" /> Filters
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              )}

              {isDesktop && (
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <FaFilter className="text-red-500" /> Filters
                </h2>
              )}

              {facets.error && <button onClick={facets.reload} className="text-red-600">Retry loading filters</button>}
              {availableCategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-gray-700">Category</h3>
                  {availableCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between mb-2 text-sm"
                    >
                      <label className="flex items-center text-gray-700 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={categoryFilters.includes(cat)}
                          onChange={() => handleCategoryChange(cat)}
                          className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="ml-2">{cat}</span>
                        <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700" aria-label={`${categoryCounts.get(cat) || 0} products`}>
                          {categoryCounts.get(cat) || 0}
                        </span>
                      </label>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleCategoryDelete(cat)}
                          className="ml-2 text-red-500 hover:text-red-600"
                          title={`Delete ${cat} category`}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {availableTypes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Type</h3>
                  {availableTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center mb-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={typeFilters.includes(type)}
                        onChange={() => handleTypeChange(type)}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-2">{type}</span>
                    </label>
                  ))}
                </div>
              )}
            </Motion.aside>
          )}
        </AnimatePresence>

        <main ref={listRef} className="md:col-span-9 scroll-mt-24">
          {loading ? <div role="status" className="flex justify-center py-10"><LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-red-500 motion-reduce:animate-none" /><span className="sr-only">Loading products...</span></div> : currentProducts.length === 0 && !page.error ? (
            <p className="text-center text-gray-500 py-10">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
              {currentProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative bg-gray-50 flex items-center justify-center aspect-[4/3] overflow-hidden">
                    <img
                      src={resolveImageUrl(product.images?.[0] || "/placeholder.png")}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4 text-center">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                      {product.title}
                    </h3>

                    {product.type && (
                      <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                        {product.type}
                      </span>
                    )}

                    <div className="flex justify-center items-center mb-1">
                      {renderStars(product.rating || 0)}
                      <span className="ml-1 text-gray-500 text-xs">
                        {product.rating?.toFixed(1)}
                      </span>
                    </div>

                    <p className="text-lg font-semibold text-red-600">
                      ₹{product.price?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {page.error && <div role="alert" className="py-4 text-center text-red-600">
            {page.error} <button type="button" onClick={page.retry} disabled={loading} className="ml-2 underline">Retry</button>
          </div>}
          <div className="mt-8">
            <p role="status" className="mb-3 text-center text-sm text-gray-600">Page {page.page} of {page.totalPages} &middot; 60 per page</p>
            <NumberedPagination page={page.page} totalPages={page.totalPages} loading={loading}
              onPageChange={value => { page.goToPage(value); listRef.current?.scrollIntoView({ block: 'start' }); }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductList;
