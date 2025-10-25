import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  MapPin,
  Phone,
  LayoutDashboard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/newlogo.jpg";
import Auth from "./Auth.jsx";
import API from "../../api/apiClient";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/userSlice.js";

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  const toggleLoginModal = () => setShowLoginModal(!showLoginModal);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const { data } = await API.get("/auth/me", { withCredentials: true });
        dispatch(setUser(data.user));
      } catch {
        dispatch(clearUser());
      }
    };
    checkLogin();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout", {}, { withCredentials: true });
      dispatch(clearUser());
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  // ✅ Handle Dashboard Button (both mobile & desktop)
  const handleDashboardClick = () => {
    if (user?.role === "admin") {
      navigate("/admin");
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-md border-b border-gray-100">
        {/* Top Info Bar */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-[7px] md:text-sm px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="font-medium">Lawspet, Puducherry</span>
            </div>
            <div className="flex items-center gap-1 font-semibold hover:text-yellow-300 transition">
              <Phone size={14} />
              <span>+91 9876543210</span>
            </div>
          </div>
          <p className="text-[8px] md:text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <span className="animate-bounce">🚚</span>
            Free Shipping on Orders Over ₹500
          </p>
        </div>

        {/* Main Navbar */}
        <nav className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transform hover:scale-105 transition duration-300"
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-[100px] md:w-[200px] object-contain"
            />
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 justify-center px-10">
            <form
              onSubmit={handleSearch}
              className="flex items-center w-full max-w-lg bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-red-400 transition"
            >
              <input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none px-2 py-2 text-gray-700 bg-transparent text-sm"
              />
              <button type="submit">
                <Search
                  className="text-gray-500 hover:text-red-500 transition"
                  size={20}
                />
              </button>
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Admin Dashboard Link (Desktop + protected) */}
            {/* <button
              onClick={handleDashboardClick}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full hover:opacity-90 transition font-medium text-sm shadow-md group"
            >
              <LayoutDashboard
                size={18}
                className="group-hover:rotate-12 transition-transform"
              />
              <span>Dashboard</span>
            </button> */}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 text-[8px] md:text-sm bg-gradient-to-r from-red-50 to-orange-50 px-3 py-1 rounded-md font-medium border border-red-100">
                  Hi, {user.phone}
                  {user?.role === "admin" && (
                    <span className="ml-2 text-[8px] text-red-500 font-bold uppercase">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white md:px-4 md:py-2 text-[10px] px-2 py-2 rounded-full hover:bg-red-600 transition font-medium md:text-md shadow-md hover:scale-105 active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-full hover:opacity-90 transition font-medium text-sm shadow-md hover:scale-105 active:scale-95"
              >
                Login
              </button>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative hover:scale-110 transition-transform"
            >
              <ShoppingCart
                className="text-gray-700 hover:text-red-500"
                size={26}
              />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Mobile Search */}
        <div className="px-4 py-2 md:hidden border-t border-gray-100">
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-red-400 transition"
          >
            <input
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none px-2 text-gray-700 bg-transparent text-sm"
            />
            <button type="submit">
              <Search
                className="text-gray-500 hover:text-red-500 transition"
                size={20}
              />
            </button>
          </form>
        </div>

        {/* Bottom Nav (Mobile) */}
        <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto flex justify-center gap-3 md:gap-5 py-2 px-4 flex-wrap">
            <Link
              to="/"
              className="bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-red-50 hover:text-red-600 transition font-medium text-sm hover:scale-105 active:scale-95"
            >
              Home
            </Link>

            <Link
              to="/product"
              className="bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-red-50 hover:text-red-600 transition font-medium text-sm hover:scale-105 active:scale-95"
            >
              All Products
            </Link>

            {/* ✅ Mobile Dashboard Button */}
            <button
              onClick={handleDashboardClick}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1.5 rounded-md shadow-sm hover:opacity-90 transition font-medium text-sm hover:scale-105 active:scale-95"
            >
              <LayoutDashboard
                size={16}
                className="group-hover:rotate-12 transition-transform"
              />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && <Auth toggleLoginModal={toggleLoginModal} />}
    </>
  );
};

export default Navbar;
