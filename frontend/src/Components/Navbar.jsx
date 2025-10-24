import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../assets/newlogo.jpg";
import LoginArea from "./LoginArea.jsx";
import API from "../../api/apiClient";
import { toast } from "react-toastify";

const Navbar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);

  const toggleLoginModal = () => setShowLoginModal(!showLoginModal);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      }
    };
    checkLogin();
  }, []);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      setUser(null);
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky  top-0 z-50 shadow-md bg-white">
        {/* Top Info Bar */}
        <div className="bg-green-500  text-white text-[8px] md:text-sm px-4 py-1 flex justify-between items-center">
          <div className="flex  items-center gap-2 md:gap-4">
            <div className="flex items-center  gap-1 hover:text-yellow-300 transition">
              <MapPin size={12} />
              <span className="truncate font-medium">Lawspet, Puducherry</span>
            </div>
            <div className="flex items-center gap-1 font-bold hover:text-yellow-300 transition">
              <Phone size={12} />
              <span>+91 9876543210</span>
            </div>
          </div>
          <div className="text-[8px] md:text-xs font-semibold uppercase">
            Free Shipping on Orders Over ₹500
          </div>
        </div>

        {/* Main Navbar */}
        <nav className="max-w-9xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center transform hover:scale-105 transition">
            <img src={Logo} alt="Logo" className="h-10 md:w-[500px] md:h-[100px] md:h-12 object-contain" />
          </Link>



 <div className="px-4 py-2 hidden  md:block">
          <form
            onSubmit={handleSearch}
            className="flex items-center w-full  rounded-full px-3 py-2 shadow-sm hover:shadow-md transition"
          >
            <input
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none px-2 py-1 text-gray-700 bg-transparent"
            />
            <button type="submit">
              <Search className="text-gray-500 hover:text-red-500 transition" size={20} />
            </button>
          </form>
        </div>





          {/* Right icons: Cart + Login/User */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative">
              <ShoppingCart className="text-gray-700 hover:text-red-500" size={26} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium text-sm">{user.phone}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-full hover:bg-gray-300 transition font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="bg-red-500 text-white px-4 py-1.5 rounded-full hover:bg-red-600 transition font-medium text-sm"
              >
                Login
              </button>
            )}
          </div>
        </nav>

        {/* Full-Width Search Bar */}
        <div className="px-4 py-2 md:hidden   shadow-inner">
          <form
            onSubmit={handleSearch}
            className="flex items-center w-full  border border-gray-300 rounded-full px-3 py-2 shadow-sm hover:shadow-md transition"
          >
            <input
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none px-2 py-1 text-gray-700 bg-transparent"
            />
            <button type="submit">
              <Search className="text-gray-500 hover:text-red-500 transition" size={20} />
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-2  flex justify-center md:justify-end gap-5 items-center">
        <Link to="/" className="border-none  shadow-lg px-4 p-2 bg-white    p-1 rounded-md  ">Home</Link>
        <Link to="/product" className="border-none  shadow-lg px-4 p-2 bg-white    p-1 rounded-md  ">All Products</Link>

      </div>
      </div>

      

      {/* Login Modal */}
      {showLoginModal && (
        <LoginArea
          toggleLoginModal={toggleLoginModal}
          onLogin={(userData) => {
            setUser(userData);
            toggleLoginModal();
          }}
        />
      )}
    </>
  );
};

export default Navbar;
