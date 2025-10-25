import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import productApi from "../../api/productApi";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaArrowLeft,
  FaShoppingCart,
  FaBolt,
} from "react-icons/fa";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productApi.getById(id);
        setProduct(res.data);
        setMainImage(res.data.images?.[0] || "/placeholder.png");
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const fetchRelated = async () => {
      try {
        const res = await productApi.getAll();
        const all = res.data;
        const relatedProducts = all.filter((p) => {
          if (p._id === product._id) return false;
          const sameType = p.type === product.type;
          const sameCat = p.categories?.some((c) =>
            product.categories?.includes(c)
          );
          return sameType || sameCat;
        });
        setRelated(relatedProducts.slice(0, 4));
      } catch (err) {
        console.error("Failed to load related products", err);
      }
    };
    fetchRelated();
  }, [product]);

  if (loading)
    return <p className="text-center text-gray-500 py-20">Loading product...</p>;
  if (error)
    return <p className="text-center text-red-500 py-20">Error: {error}</p>;
  if (!product)
    return <p className="text-center text-gray-500 py-20">Product not found.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-28 md:pb-10 pt-6 md:pt-10">
      {/* 🔙 Back Button */}
      <Link
        to="/product"
        className="inline-flex items-center text-red-500 mb-4 md:mb-6 hover:underline text-sm font-medium"
      >
        <FaArrowLeft className="mr-2" /> Back to Products
      </Link>

      {/* 🖼 Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
        {/* Left: Image Gallery */}
        <div>
          {/* Main Image */}
          <div className="w-full h-[380px] md:h-[450px] bg-gray-100 rounded-2xl overflow-hidden shadow-lg mb-4 flex items-center justify-center">
            <img
              src={mainImage}
              alt={product.name}
              className="max-h-full object-contain transition duration-300"
            />
          </div>

          {/* Thumbnails — scrollable on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2 justify-start md:justify-center">
            {(product.images?.length ? product.images : [mainImage]).map(
              (img, idx) => (
                <img
                  key={idx}
                  src={img || "/placeholder.png"}
                  alt={`Thumbnail ${idx}`}
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 flex-shrink-0 object-cover rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                    mainImage === img
                      ? "border-red-500"
                      : "border-transparent hover:border-gray-300"
                  }`}
                />
              )
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="space-y-5">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 leading-snug">
            {product.title}
          </h1>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            {renderStars(product.rating || 0)}
            <span className="text-gray-600 text-sm">
              {product.rating?.toFixed(1)}
            </span>
          </div>

          {/* Price & Stock */}
          <div>
            <p className="text-3xl font-semibold text-red-600 mb-1">
              ₹{product.price?.toLocaleString()}
            </p>
            <p className="text-sm font-semibold text-green-600">
              Stock: {product.stock}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              {product.description || "No description available for this product."}
            </p>
          </div>

          {/* Type & Categories */}
          <div className="flex flex-wrap items-center gap-2">
            {product.type && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                {product.type}
              </span>
            )}
            {product.categories?.length > 0 && (
              <span className="text-sm text-gray-500">
                Categories:{" "}
                <span className="text-gray-700 font-medium">
                  {product.categories.join(", ")}
                </span>
              </span>
            )}
          </div>

          {/* Buttons (Desktop only) */}
          <div className="hidden md:flex gap-4 mt-6">
            <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition duration-300">
              <FaShoppingCart /> Add to Cart
            </button>
            <button className="flex items-center gap-2 border border-red-500 text-red-500 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition duration-300">
              <FaBolt /> Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16 md:mt-20">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-8">
            {related.map((item) => (
              <Link
                key={item._id}
                to={`/products/${item._id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-transform hover:scale-[1.02] duration-300"
              >
                <div className="w-full h-40 md:h-56 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.images?.[0] || "/placeholder.png"}
                    alt={item.name}
                    className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 md:p-4 text-center">
                  <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-red-600 font-semibold text-sm mt-1">
                    ₹{item.price?.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 📱 Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden flex justify-around items-center py-3 z-50">
        <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md text-sm">
          <FaShoppingCart /> Add to Cart
        </button>
        <button className="flex items-center gap-2 border border-red-500 text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 text-sm">
          <FaBolt /> Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
