import React, { useEffect, useState, useMemo } from "react";
import productApi from "../../api/productApi";
import { FaStar, FaStarHalfAlt, FaRegStar, FaFilter } from "react-icons/fa";

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
  const [showFilters, setShowFilters] = useState(false); // Mobile toggle

  const itemsPerPage = 6;
  const sortOptions = ["Relevant", "Price: Low to High", "Price: High to Low", "Newest"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await productApi.getAll();
        setProducts(res.data);

        const categories = Array.from(new Set(res.data.flatMap((p) => p.categories || [])));
        setAvailableCategories(categories);

        const types = Array.from(new Set(res.data.flatMap((p) => p.type ? [p.type] : [])));
        setAvailableTypes(types);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = (cat) => {
    setCategoryFilters(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  const handleTypeChange = (type) => {
    setTypeFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let temp = [...products];

    if (categoryFilters.length > 0) {
      temp = temp.filter(p => categoryFilters.some(f => p.categories.includes(f)));
    }
    if (typeFilters.length > 0) {
      temp = temp.filter(p => typeFilters.some(f => p.type === f));
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
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push(<FaStar key={i} className="text-yellow-400" />);
      else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      else stars.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
    return stars;
  };

  if (loading) return <p className="text-center text-gray-500 py-20">Loading products...</p>;
  if (error) return <p className="text-center text-red-500 py-20">Error: {error}</p>;

  return (
    <div className="max-w-9xl mx-auto px-4 py-6">
          <h1 className="text-xl md:text-3xl md:mb-4 font-bold text-gray-800 mb-3">ALL Products</h1>
      <div className="flex justify-between items-center mb-4">
      

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <button
            className="sm:hidden flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-lg shadow"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>

          <label className="text-sm text-gray-600 mr-2 hidden sm:block">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-none  px-3 py-2 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-400 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <aside className={`md:col-span-3 border-none shadow-lg p-10 pr-6 sticky top-0 h-full ${showFilters ? "block" : "hidden"} md:block bg-white z-10`}>
          <h2 className="text-lg font-bold mb-4 text-gray-800">FILTER</h2>

          {availableCategories.length > 0 && (
            <div className="mb-6 border p-3 rounded-lg">
              <h3 className="font-semibold mb-2">CATEGORIES</h3>
              {availableCategories.map(cat => (
                <div key={cat} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`cat-${cat}`}
                    checked={categoryFilters.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor={`cat-${cat}`} className="ml-2 text-sm text-gray-700 cursor-pointer">{cat}</label>
                </div>
              ))}
            </div>
          )}

          {availableTypes.length > 0 && (
            <div className="mb-6 border p-3 rounded-lg">
              <h3 className="font-semibold mb-2">TYPE</h3>
              {availableTypes.map(type => (
                <div key={type} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={typeFilters.includes(type)}
                    onChange={() => handleTypeChange(type)}
                    className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700 cursor-pointer">{type}</label>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-9">
          {filteredAndSortedProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No products found matching your filters.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-10">
              {currentProducts.map(product => (
                <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:scale-105 duration-300">
                  <div className="relative">
                    <img
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.name}
                      className="w-[300px] h-[100px] md:w-[600px] md:h-[400px] object-cover "
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h2 className="text-sm font-medium mb-1 text-gray-800 line-clamp-2">{product.name}</h2>

                   

                    {/* Type Badge */}
                    {product.type && (
                      <div className="flex justify-center mb-1">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {product.type}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center items-center mb-1 text-xs">
                      {renderStars(product.rating || 0)}
                      <span className="ml-1 text-gray-600 text-[10px]">{product.rating?.toFixed(1)}</span>
                    </div>

                    <p className="font-semibold text-base text-gray-900">₹{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    currentPage === i + 1
                      ? "bg-red-500 text-white shadow-lg"
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
