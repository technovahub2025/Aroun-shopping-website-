import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import productApi from "../../api/productApi";
import { FaStar, FaStarHalfAlt, FaRegStar, FaFilter, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ProductList = () => {
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

  const itemsPerPage = 6;
  const sortOptions = [
    "Relevant",
    "Price: Low to High",
    "Price: High to Low",
    "Newest",
  ];

  const selectedCategory = searchParams.get("category");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await productApi.getAll();
        setProducts(res.data);
        setAvailableCategories(
          Array.from(new Set(res.data.flatMap((p) => p.categories || [])))
        );
        setAvailableTypes(
          Array.from(new Set(res.data.flatMap((p) => (p.type ? [p.type] : []))))
        );

        // 🟢 Auto-filter by category from URL if exists
        if (selectedCategory) {
          setCategoryFilters([selectedCategory]);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory]);

  // Handle responsive resizing
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

  const filteredAndSortedProducts = useMemo(() => {
    let temp = [...products];
    if (categoryFilters.length > 0)
      temp = temp.filter((p) =>
        categoryFilters.some((f) => p.categories.includes(f))
      );
    if (typeFilters.length > 0)
      temp = temp.filter((p) => typeFilters.some((f) => p.type === f));

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

  const renderStars = (rating) => {
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
    return <p className="text-center text-gray-500 py-20">Loading products...</p>;
  if (error)
    return <p className="text-center text-red-500 py-20">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          {selectedCategory ? `${selectedCategory} Products` : "All Products"}
        </h1>
      </div>

      {/* Filter + Sort */}
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
        {/* Filter Sidebar + Overlay */}
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

              {/* Categories */}
              {availableCategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-gray-700">Categories</h3>
                  {availableCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center mb-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={categoryFilters.includes(cat)}
                        onChange={() => handleCategoryChange(cat)}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-2">{cat}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Types */}
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

        {/* Product Grid */}
        <main className="md:col-span-9">
          {filteredAndSortedProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-10">
              {currentProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative bg-gray-50 flex items-center justify-center aspect-[4/3] overflow-hidden">
                    <img
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.name}
                      className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4 text-center">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                      {product.name}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === i + 1
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-gray-200 hover:bg-red-400 hover:text-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductList;
