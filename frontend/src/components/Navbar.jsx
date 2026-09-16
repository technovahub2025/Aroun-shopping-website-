import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart, Search, MapPin, Phone, Menu, X, Home, Package, ClipboardList, LayoutDashboard, LogIn, LogOut, User, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/apiClient";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/userSlice.js";
import { useLocation } from "react-router-dom";
const Navbar = () => {
  const modalRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: ""
  });
  const [focusedField, setFocusedField] = useState(null);
  const user = useSelector(state => state.user.user);
  const cartItems = useSelector(state => state.cart?.items || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toggleLoginModal = () => {
    setShowLoginModal(!showLoginModal);
    setAuthMode("register");
    setError("");
    setFormData({
      name: "",
      phone: "",
      password: ""
    });
  };
  useEffect(() => {
    if (!showLoginModal) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.querySelector('button')?.focus();
    const onKey = event => {
      if (event.key === 'Escape') setShowLoginModal(false);
      if (event.key === 'Tab') {
        const controls = modalRef.current?.querySelectorAll('button, input, a[href]');
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [showLoginModal]);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleSearch = e => {
    e.preventDefault();
    navigate(`/product?q=${encodeURIComponent(searchTerm.trim())}`);
    setMenuOpen(false);
  };
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const {
          data
        } = await API.get("/auth/me");
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
      navigate(location.pathname, {
        replace: true,
        state: {}
      });
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
  const handleInputChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };
  const handleRegister = async e => {
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
      await API.post("/auth/register", {
        name: formData.name,
        phone: formData.phone,
        password: formData.password
      });
      toast.success("Registration successful!");
      toggleLoginModal();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };
  const handleLogin = async e => {
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
      const {
        data
      } = await API.post("/auth/login", {
        phone: formData.phone,
        password: formData.password
      });
      localStorage.setItem("token", data.token);
      console.log(data);
      dispatch(setUser(data.user));
      toast.success("Login successful!");
      toggleLoginModal();
    } catch (err) {
      setError(err.response?.data?.message || "Name or password mismatch. Please check your details.");
    }
  };
  const switchAuthMode = mode => {
    setAuthMode(mode);
    setError("");
    setFormData({
      name: "",
      phone: "",
      password: ""
    });
  };
  return <>
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

      <header className="store-header">
 <div className="announcement"><span>Everyday essentials. A little closer to home.</span><span><MapPin size={13} /> Lawspet, Puducherry</span></div>
 <nav className="store-nav shell" aria-label="Main navigation"><Link to="/" className="wordmark" aria-label="Aroun Store home">aroun<span>STORE</span><i /></Link>
 <form onSubmit={handleSearch} className="store-search"><Search size={19} /><input aria-label="Search products" placeholder="Search your everyday essentials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><button type="submit">Search</button></form>
 <div className="nav-actions"><button className="account-button" onClick={() => user ? navigate('/profile') : toggleLoginModal()}><User size={21} /><span>{user ? user.name || 'My account' : 'Sign in'}</span></button><button className="cart-button" onClick={() => user ? navigate('/cart') : toggleLoginModal()} aria-label="Open shopping bag"><ShoppingCart size={20} /><span>My bag</span><b>{cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</b></button><button className="mobile-menu-button" onClick={toggleMenu} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button></div></nav>
 <div className={`store-links shell ${menuOpen ? 'is-open' : ''}`}><Link className={location.pathname === '/' ? 'active' : ''} to="/" onClick={() => setMenuOpen(false)}>Home</Link><Link className={location.pathname === '/product' ? 'active' : ''} to="/product" onClick={() => setMenuOpen(false)}>Shop all essentials</Link><button onClick={() => {
          user ? navigate('/orders') : toggleLoginModal();
          setMenuOpen(false);
        }}>My orders</button>{user?.role === 'admin' && <Link to="/admin">Dashboard</Link>}{user && <button onClick={handleLogout}><LogOut size={14} /> Sign out</button>}<a className="nav-contact" href="tel:+919629600230"><Phone size={14} /> Here to help: +91 96296 00230</a></div>
 </header>

      {/* Auth Modal */}
      {showLoginModal && <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="auth-title" className="auth-dialog bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-slideUp">
            {/* Close Button */}
            <button onClick={toggleLoginModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <X size={24} />
            </button>

            {/* Modal Title */}
            <h2 id="auth-title" className="text-2xl font-bold text-gray-800 mb-6">
              {authMode === "register" ? "Register" : "Login"}
            </h2>

            {/* Auth Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => switchAuthMode("register")} className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${authMode === "register" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Register
              </button>
              <button onClick={() => switchAuthMode("login")} className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${authMode === "login" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Login
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
                {error}
              </div>}

            {/* Register Form */}
            {authMode === "register" && <div className="space-y-4">
                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 transition-all duration-300 ${focusedField === "register-name" || formData.name ? "text-green-600 transform -translate-y-1" : "text-gray-700"}`}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${focusedField === "register-name" ? "text-green-600 scale-110" : "text-gray-400"}`} size={18} />
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} onFocus={() => setFocusedField("register-name")} onBlur={() => setFocusedField(null)} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${focusedField === "register-name" ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]" : "border-gray-300"} focus:outline-none`} placeholder="Enter your name" />
                  </div>
                </div>

                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 transition-all duration-300 ${focusedField === "register-phone" || formData.phone ? "text-green-600 transform -translate-y-1" : "text-gray-700"}`}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${focusedField === "register-phone" ? "text-green-600 scale-110" : "text-gray-400"}`} size={18} />
                    <input type="tel" aria-label="Phone number" name="phone" value={formData.phone} onChange={e => {
                const value = e.target.value.replace(/\D/g, ""); // numbers only
                if (value.length <= 10) {
                  handleInputChange({
                    target: {
                      name: "phone",
                      value
                    }
                  });
                }
              }} maxLength={10} onFocus={() => setFocusedField("register-phone")} onBlur={() => setFocusedField(null)} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${focusedField === "register-phone" ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]" : "border-gray-300"} focus:outline-none`} placeholder="Enter 10 digit phone number" />
                  </div>
                </div>

                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 transition-all duration-300 ${focusedField === "register-password" || formData.password ? "text-green-600 transform -translate-y-1" : "text-gray-700"}`}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${focusedField === "register-password" ? "text-green-600 scale-110" : "text-gray-400"}`} size={18} />
                    <input type="password" aria-label="Password" name="password" value={formData.password} onChange={handleInputChange} onFocus={() => setFocusedField("register-password")} onBlur={() => setFocusedField(null)} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${focusedField === "register-password" ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]" : "border-gray-300"} focus:outline-none`} placeholder="Enter your password (min 6 characters)" />
                  </div>
                </div>

                <button onClick={handleRegister} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium">
                  Register
                </button>
              </div>}

            {/* Login Form */}
            {authMode === "login" && <div className="space-y-4">
                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 transition-all duration-300 ${focusedField === "login-phone" || formData.phone ? "text-green-600 transform -translate-y-1" : "text-gray-700"}`}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${focusedField === "login-name" ? "text-green-600 scale-110" : "text-gray-400"}`} size={18} />
                    <input type="text" aria-label="Phone number" name="phone" value={formData.phone} onChange={e => {
                const value = e.target.value.replace(/\D/g, ""); // numbers only
                if (value.length <= 10) {
                  handleInputChange({
                    target: {
                      name: "phone",
                      value
                    }
                  });
                }
              }} maxLength={10} onFocus={() => setFocusedField("login-phone")} onBlur={() => setFocusedField(null)} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${focusedField === "login-phone" ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]" : "border-gray-300"} focus:outline-none`} placeholder="Enter 10 digit phone number" />
                  </div>
                </div>

                <div className="relative">
                  <label className={`block text-sm font-medium mb-1 transition-all duration-300 ${focusedField === "login-password" || formData.password ? "text-green-600 transform -translate-y-1" : "text-gray-700"}`}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${focusedField === "login-password" ? "text-green-600 scale-110" : "text-gray-400"}`} size={18} />
                    <input type="password" aria-label="Password" name="password" value={formData.password} onChange={handleInputChange} onFocus={() => setFocusedField("login-password")} onBlur={() => setFocusedField(null)} className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all duration-300 ${focusedField === "login-password" ? "border-green-500 ring-2 ring-green-200 shadow-md transform scale-[1.02]" : "border-gray-300"} focus:outline-none`} placeholder="Enter your password" />
                  </div>
                </div>

                <button onClick={handleLogin} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium">
                  Login
                </button>

                <p className="text-sm text-gray-600 text-center mt-4">
                  Don't have an account?{" "}
                  <button onClick={() => switchAuthMode("register")} className="text-green-600 hover:text-green-700 font-medium">
                    Register here
                  </button>
                </p>
              </div>}
          </div>
        </div>}
    </>;
};
export default Navbar;
