import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  MapPin,
  Phone,
  Menu,
  X,
  Home,
  Package,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/newlogo.png";
import API from "../../api/apiClient";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/userSlice.js";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  const user = useSelector((state) => state.user.user);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLoginModal = () => {
    setShowLoginModal(!showLoginModal);
    setAuthMode("register");
    setError("");
    setFormData({ name: "", phone: "", password: "" });
  };

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

  useEffect(() => {
    if (location.state?.openAuth) {
      setShowLoginModal(true);
      setAuthMode(location.state.authMode || "login");
      // clear state to avoid reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      dispatch(clearUser());
      localStorage.removeItem("token");
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      var ninetyone = "+91";
      if (!formData.phone.startsWith(ninetyone)) {
        formData.phone = ninetyone + formData.phone;
      }
      const { data } = await API.post("/auth/register", {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      });

      
      toast.success("Registration successful!");
      toggleLoginModal();
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    var ninetyone = "+91";
    if (!formData.phone.startsWith(ninetyone)) {
      formData.phone = ninetyone + formData.phone;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      const { data } = await API.post("/auth/login", {
        phone: formData.phone,
        password: formData.password,
      });

      localStorage.setItem("token", data.token);
      console.log(data);

      dispatch(setUser(data.user));

      toast.success("Login successful!");
      toggleLoginModal();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Name or password mismatch. Please check your details."
      );
    }
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setError("");
    setFormData({ name: "", phone: "", password: "" });
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        {/* Top Info Bar */}
        <div className="bg-green-500 text-white text-[16px] md:text-sm px-4 py-2 flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-0 text-center md:text-left">
          <p className="uppercase font-bold text-[16px]  tracking-wide">
            🚚 Free Shipping on Orders Over ₹500
          </p>

          <div className="flex justify-center font-bold md:justify-start items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span  className="uppercase font-bold text-[12px] tracking-wide">Lawspet, Puducherry</span>
            </div>
            <div className="flex items-center font-bold gap-1 hover:text-yellow-200 transition">
              <Phone size={16} />
              <span  className="uppercase font-bold text-[12px]  tracking-wide">+91 9876543210</span>
            </div>
          </div>
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
              className="w-[150px] md:w-[200px] object-contain"
            />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center px-10">
            <form
              onSubmit={handleSearch}
              className="flex items-center w-full max-w-md bg-white border border-green-400 rounded-full px-3 py-2 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-green-400 transition"
            >
              <input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none px-4 p-2  text-gray-700 bg-transparent text-sm"
              />
              <button type="submit">
                <Search
                  className="text-gray-500 hover:text-green-600 transition"
                  size={20}
                />
              </button>
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-gray-700 text-sm bg-green-50 px-3 py-1 rounded-md font-medium">
                  Hi, {user.name || user.firstName}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm shadow-sm flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="hidden md:flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm shadow-sm"
              >
                <LogIn size={16} /> Register / Login
              </button>
            )}

            {/* Cart */}
            <button
              onClick={() => {
                if (user) navigate("/cart");
                else setShowLoginModal(true);
              }}
              className="relative hover:scale-110 transition-transform"
              aria-label="Open cart"
            >
              <ShoppingCart
                className="text-gray-700 hover:text-green-600"
                size={26}
              />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full px-1.5">
                  {cartItems.reduce((s, it) => s + (it.quantity || 0), 0)}
                </span>
              )}
            </button>

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
                <Search
                  className="text-gray-500 hover:text-green-600 transition"
                  size={20}
                />
              </button>
            </form>

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-green-50 text-gray-700 font-medium text-sm"
              onClick={toggleMenu}
            >
              <Home size={16} className="text-green-600" /> Home
            </Link>

            <Link
              to="/product"
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-green-50 text-gray-700 font-medium text-sm"
              onClick={toggleMenu}
            >
              <Package size={16} className="text-green-600" /> All Products
            </Link>

            {/* ✅ My Orders logic */}
            <button
              onClick={() => {
                if (user) {
                  navigate("/orders");
                  toggleMenu();
                } else {
                  setShowLoginModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-green-50 text-gray-700 font-medium text-sm"
            >
              <ClipboardList size={16} className="text-green-600" /> My Orders
            </button>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-green-600 to-lime-500 text-white font-medium text-sm"
                onClick={toggleMenu}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            )}

            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm mt-2"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <button
                onClick={toggleLoginModal}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition font-medium text-sm mt-2"
              >
                <LogIn size={16} /> Register / Login
              </button>
            )}
          </div>
        </div>

        {/* Bottom Links (Desktop) */}
        <div className="hidden md:flex justify-center gap-6 py-2 border-t border-gray-100 bg-white">
          <Link
            to="/"
            className="flex items-center gap-1 bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-green-50 hover:text-green-700 transition font-medium text-sm"
          >
            <Home size={16} /> Home
          </Link>

          <Link
            to="/product"
            className="flex items-center gap-1 bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-green-50 hover:text-green-700 transition font-medium text-sm"
          >
            <Package size={16} /> All Products
          </Link>

          {/* ✅ Desktop My Orders logic */}
          <button
            onClick={() => {
              if (user) navigate("/orders");
              else setShowLoginModal(true);
            }}
            className="flex items-center gap-1 bg-white text-gray-700 px-4 py-1.5 rounded-md shadow-sm hover:bg-green-50 hover:text-green-700 transition font-medium text-sm"
          >
            <ClipboardList size={16} /> My Orders
          </button>

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-lime-500 text-white px-4 py-1.5 rounded-md shadow-sm hover:opacity-90 transition font-medium text-sm"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-slideUp">
            {/* Close Button */}
            <button
              onClick={toggleLoginModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>

            {/* Modal Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {authMode === "register" ? "Register" : "Login"}
            </h2>

            {/* Auth Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => switchAuthMode("register")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  authMode === "register"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Register
              </button>
              <button
                onClick={() => switchAuthMode("login")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  authMode === "login"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Login
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
                {error}
              </div>
            )}

            {/* Register Form */}
            {authMode === "register" && (
              <div className="space-y-4">
                <div className="relative">
                  <label
                    className={`block text-sm font-medium mb-1 transition-all duration-300 ${
                      focusedField === "register-name" || formData.name
                        ? "text-green-600 transform -translate-y-1"
                        : "text-gray-700"
                    }`}
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                        focusedField === "register-name"
                          ? "text-green-600 scale-110"
                          : "text-gray-400"
                      }`}
                      size={18}
                    />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("register-name")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${
                        focusedField === "register-name"
                          ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]"
                          : "border-gray-300"
                      } focus:outline-none`}
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label
                    className={`block text-sm font-medium mb-1 transition-all duration-300 ${
                      focusedField === "register-phone" || formData.phone
                        ? "text-green-600 transform -translate-y-1"
                        : "text-gray-700"
                    }`}
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                        focusedField === "register-phone"
                          ? "text-green-600 scale-110"
                          : "text-gray-400"
                      }`}
                      size={18}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // numbers only
                        if (value.length <= 10) {
                          handleInputChange({
                            target: { name: "phone", value },
                          });
                        }
                      }}
                      maxLength={10}
                      onFocus={() => setFocusedField("register-phone")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${
                        focusedField === "register-phone"
                          ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]"
                          : "border-gray-300"
                      } focus:outline-none`}
                      placeholder="Enter 10 digit phone number"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label
                    className={`block text-sm font-medium mb-1 transition-all duration-300 ${
                      focusedField === "register-password" || formData.password
                        ? "text-green-600 transform -translate-y-1"
                        : "text-gray-700"
                    }`}
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                        focusedField === "register-password"
                          ? "text-green-600 scale-110"
                          : "text-gray-400"
                      }`}
                      size={18}
                    />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("register-password")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${
                        focusedField === "register-password"
                          ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]"
                          : "border-gray-300"
                      } focus:outline-none`}
                      placeholder="Enter your password (min 6 characters)"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Register
                </button>
              </div>
            )}

            {/* Login Form */}
            {authMode === "login" && (
              <div className="space-y-4">
                <div className="relative">
                  <label
                    className={`block text-sm font-medium mb-1 transition-all duration-300 ${
                      focusedField === "login-phone" || formData.phone
                        ? "text-green-600 transform -translate-y-1"
                        : "text-gray-700"
                    }`}
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                        focusedField === "login-name"
                          ? "text-green-600 scale-110"
                          : "text-gray-400"
                      }`}
                      size={18}
                    />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // numbers only
                        if (value.length <= 10) {
                          handleInputChange({
                            target: { name: "phone", value },
                          });
                        }
                      }}
                      maxLength={10}
                      onFocus={() => setFocusedField("login-phone")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${
                        focusedField === "login-phone"
                          ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]"
                          : "border-gray-300"
                      } focus:outline-none`}
                      placeholder="Enter 10 digit phone number"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label
                    className={`block text-sm font-medium mb-1 transition-all duration-300 ${
                      focusedField === "login-password" || formData.password
                        ? "text-green-600 transform -translate-y-1"
                        : "text-gray-700"
                    }`}
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
                        focusedField === "login-password"
                          ? "text-green-600 scale-110"
                          : "text-gray-400"
                      }`}
                      size={18}
                    />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("login-password")}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${
                        focusedField === "login-password"
                          ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]"
                          : "border-gray-300"
                      } focus:outline-none`}
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Login
                </button>

                <p className="text-sm text-gray-600 text-center mt-4">
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchAuthMode("register")}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Register here
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
