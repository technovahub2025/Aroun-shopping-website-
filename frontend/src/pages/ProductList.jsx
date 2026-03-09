
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import productApi from "../../api/productApi";
import apiClient from "../../api/apiClient";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaFilter,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/userSlice";

const ProductList = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [typeFilters, setTypeFilters] = useState([]);
  const [sortBy, setSortBy] = useState("Relevant");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [searchParams] = useSearchParams();

  const itemsPerPage = 60;
  const sortOptions = [
    "Relevant",
    "Price: Low to High",
    "Price: High to Low",
    "Newest",
  ];

  const selectedCategory = searchParams.get("category");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get("/auth/me");
        dispatch(setUser(data.user));
      } catch {
        // Ignore auth errors here. Non-admin users should still access product listing.
      }
    };

    if (!user) {
      fetchUser();
    }
  }, [dispatch, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await productApi.getAll();
        const data = res.data || [];

        setProducts(data);

        setAvailableCategories(
          Array.from(new Set(data.map((p) => p.category).filter(Boolean)))
        );

        setAvailableTypes(
          Array.from(new Set(data.map((p) => p.type).filter(Boolean)))
        );

        if (selectedCategory) setCategoryFilters([selectedCategory]);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    setCurrentPage(1);
  };

  const handleTypeChange = (type) => {
    setTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const handleCategoryDelete = async (category) => {
    if (!category) return;
    if (!window.confirm(`Delete all products in "${category}" category?`)) {
      return;
    }

    try {
      await productApi.deleteCategory(category);

      setProducts((prev) => prev.filter((p) => p.category !== category));
      setAvailableCategories((prev) => prev.filter((cat) => cat !== category));
      setCategoryFilters((prev) => prev.filter((cat) => cat !== category));
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let temp = [...products];

    if (categoryFilters.length > 0) {
      temp = temp.filter((p) =>
        categoryFilters.some((f) => p.category === f)
      );
    }

    if (typeFilters.length > 0) {
      temp = temp.filter((p) => typeFilters.includes(p.type));
    }

    switch (sortBy) {
      case "Price: Low to High":
        temp.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        temp.sort((a, b) => b.price - a.price);
        break;
      case "Newest":
        temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    return temp;
  }, [products, categoryFilters, typeFilters, sortBy]);

  const indexOfLast = currentPage * itemsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(
    indexOfLast - itemsPerPage,
    indexOfLast
  );
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 2) {
      startPage = 1;
      endPage = 4;
    }

    if (currentPage >= totalPages - 1) {
      startPage = totalPages - 3;
      endPage = totalPages;
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      pageNumbers.push("...");
    }

    return pageNumbers;
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

  if (loading)
    return (
      <div className="text-center h-[100vh] text-gray-500 py-20">
        Loading products...
      </div>
    );

  if (error)
    return <p className="text-center text-red-500 py-20">Error: {error}</p>;

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
            <motion.div
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
            <motion.aside
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
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="md:col-span-9">
          {filteredAndSortedProducts.length === 0 ? (
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
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.title}
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

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-10">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-red-400 hover:text-white"
                }`}
              >
                Prev
              </button>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {getPageNumbers().map((pageNum, index) => (
                  <button
                    key={`${pageNum}-${index}`}
                    onClick={() =>
                      pageNum !== "..." && setCurrentPage(pageNum)
                    }
                    disabled={pageNum === "..."}
                    className={`min-w-[40px] h-10 rounded-lg px-3 text-sm font-medium transition-all ${
                      pageNum === currentPage
                        ? "bg-red-500 text-white shadow-md"
                        : pageNum === "..."
                        ? "text-gray-400 cursor-default"
                        : "bg-gray-200 text-gray-700 hover:bg-red-400 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductList;
