import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import productApi from "../../api/productApi";
import { FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items || []);

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
          const sameCat = p.categories?.some((c) => product.categories?.includes(c));
          return sameType || sameCat;
        });
        setRelated(relatedProducts.slice(0, 4));
      } catch (err) {
        console.error("Failed to load related products", err);
      }
    };
    fetchRelated();
  }, [product]);

  const handleAddToCart = () => {
    const token = localStorage.getItem("token");
    const exists = cartItems.some((item) => item.id === product._id);
    if (exists) {
      return toast.info("This product is already in your cart!");
    }
    if (!token) {
      toast.info("Please login to continue");
      navigate("/", {
        state: {
          openAuth: true,
          authMode: "login",
        },
      });
      return;
    }

    dispatch(addToCart({ product, qty: 1 }));
    toast.success("Added to cart!");
  };

  if (loading)
    return <p className="text-center text-gray-500 py-20">Loading product...</p>;
  if (error)
    return <p className="text-center text-red-500 py-20">Error: {error}</p>;
  if (!product)
    return <p className="text-center text-gray-500 py-20">Product not found.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Back Button */}
      <Link
        to="/product"
        className="inline-flex items-center text-red-500 mb-6 hover:underline text-sm"
      >
        <FaArrowLeft className="mr-2" /> Back to Products
      </Link>

      {/* Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left: Image Gallery */}
        <div>
          <div
            className="w-full h-[400px] md:h-[450px] bg-gray-50 rounded-2xl overflow-hidden mb-4 flex items-center justify-center cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <img
              src={mainImage}
              alt={product.name}
              className="max-h-full object-contain transition duration-300 hover:scale-105"
            />
          </div>

          {/* Thumbnail preview */}
          <div className="flex gap-3 justify-center flex-wrap">
            {(product.images?.length ? product.images : [mainImage]).map(
              (img, idx) => (
                <img
                  key={idx}
                  src={img || "/placeholder.png"}
                  alt={`Thumbnail ${idx}`}
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all duration-200 ${
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
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
            {product.title}
          </h1>

          <p className="text-gray-700 leading-relaxed">
            {product.description ||
              "No description available for this product."}
          </p>

          <div className="flex items-center space-x-2">
            {renderStars(product.rating || 0)}
            <span className="text-gray-600 text-sm">
              {product.rating?.toFixed(1)}
            </span>
          </div>

          {product.type && (
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
              {product.type}
            </span>
          )}

          {product.categories?.length > 0 && (
            <p className="text-sm text-gray-500">
              Categories:{" "}
              <span className="text-gray-700 font-medium">
                {product.categories.join(", ")}
              </span>
            </p>
          )}
          <div className="flex items-center gap-3">
            {/* Price + MRP */}
            <div className="flex flex-row gap-3.5">
              <p className="text-3xl font-semibold text-red-600">
                ₹{product.price?.toLocaleString()}
              </p>
              {/* MRP */}
              {product.mrp && (
                <p className="text-lg text-gray-500 line-through">
                  ₹{product.mrp.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {/* Discount Badge */}
          {product.discount && (
            <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-1 rounded-md">
              {product.discount}% OFF
            </span>
          )}

          <p className="text-lg font-semibold text-green-600 mt-2">
            Stock : {product.stock}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <button
              onClick={handleAddToCart}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition duration-300"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8 text-gray-800 text-center md:text-left">
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <Link
                key={item._id}
                to={`/products/${item._id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-transform transform hover:scale-[1.02] duration-300"
              >
                <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.images?.[0] || "/placeholder.png"}
                    alt={item.name}
                    className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-red-600 font-semibold text-sm mt-2">
                    ₹{item.price?.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-md p-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-green-600 bg-red-200 p-3 text-2xl hover:text-gray-300"
          >
            <FaTimes />
          </button>
          <img
            src={mainImage}
            alt="Full View"
            className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
