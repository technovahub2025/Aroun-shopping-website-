import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, MapPin, Phone, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../assets/newlogo.jpg";
import Auth from "./Auth.jsx";
import API from "../../api/apiClient";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/userSlice.js";

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useSelector((state) => state.user.user);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const dispatch = useDispatch();

  const toggleLoginModal = () => setShowLoginModal(!showLoginModal);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const { data } = await API.get("/auth/me");
        dispatch(setUser(data.user));
      } catch {
        dispatch(clearUser());
      }
    };
    checkLogin();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      dispatch(clearUser());
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        {/* Top Info Bar */}
        <div className="bg-green-500 text-white text-[10px] md:text-sm px-4 py-2 flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-0 text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>Lawspet, Puducherry</span>
            </div>
            <div className="flex items-center gap-1 hover:text-yellow-200 transition">
              <Phone size={14} />
              <span>+91 9876543210</span>
            </div>
          </div>
          <p className="uppercase font-semibold text-[10px] md:text-sm tracking-wide">
            🚚 Free Shipping on Orders Over ₹500
          </p>
        </div>

        {/* Main Navbar */}
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:scale-105 transition-transform duration-300"
          >
            <img
              src={Logo}
              alt="Logo"
              className="w-[110px] md:w-[180px] object-contain"
            />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center px-10">
            <form
              onSubmit={handleSearch}
              className="flex items-center w-full max-w-md bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-green-400 transition"
            >
              <input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none px-2 text-gray-700 bg-transparent text-sm"
              />
              <button type="submit">
                <Search className="text-gray-500 hover:text-green-600 transition" size={20} />
              </button>
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-gray-700 text-sm bg-green-50 px-3 py-1 rounded-md font-medium">
                  Hi, {user.phone}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="hidden md:block bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm shadow-sm"
              >
                Login
              </button>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative hover:scale-110 transition-transform"
            >
              <ShoppingCart className="text-gray-700 hover:text-green-600" size={26} />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full px-1.5">
                  {cartItems.reduce((s, it) => s + (it.quantity || 0), 0)}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-gray-700 hover:text-green-600"
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden bg-white border-t border-gray-200 transition-all duration-300 overflow-hidden ${
            menuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-3 flex flex-col gap-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-green-400 transition"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none px-2 text-gray-700 bg-transparent text-sm"
              />
              <button type="submit">
                <Search className="text-gray-500 hover:text-green-600 transition" size={20} />
              </button>
            </form>

            <Link
              to="/"
              className="px-4 py-2 rounded-md hover:bg-green-50 text-gray-700 font-medium text-sm"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/product"
              className="px-4 py-2 rounded-md hover:bg-green-50 text-gray-700 font-medium text-sm"
              onClick={toggleMenu}
            >
              All Products
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-md bg-gradient-to-r from-green-600 to-lime-500 text-white font-medium text-sm"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
            )}

            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm mt-2"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm mt-2"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Bottom Links (Desktop only) */}
        <div className="hidden md:flex justify-center gap-5 py-2 border-t border-gray-100">
          <Link
            to="/"
            className="bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-green-50 hover:text-green-700 transition font-medium text-sm"
          >
            Home
          </Link>
          <Link
            to="/product"
            className="bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-green-50 hover:text-green-700 transition font-medium text-sm"
          >
            All Products
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="bg-gradient-to-r from-green-600 to-lime-500 text-white px-4 py-1.5 rounded-md shadow-sm hover:opacity-90 transition font-medium text-sm"
            >
              Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      {showLoginModal && <Auth toggleLoginModal={toggleLoginModal} />}
    </>
  );
};

export default Navbar;
