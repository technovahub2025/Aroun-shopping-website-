import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Package, ShoppingCart, ClipboardList, User, LogIn } from "lucide-react";
import { useSelector } from "react-redux";


const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const user = useSelector((state) => state.user.user);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const toggleLoginModal = () => setShowLoginModal(!showLoginModal);

  const handleNavClick = (path) => {
    if (["/cart", "/orders", "/profile"].includes(path)) {
      if (user) {
        navigate(path);
      } else {
        setShowLoginModal(true);
      }
    } else {
      navigate(path);
    }
  };

  const navItems = [
    { path: "/", icon: <Home size={24} />, label: "Home" },
    { path: "/product", icon: <Package size={24} />, label: "Products" },
    { path: "/cart", icon: <ShoppingCart size={24} />, label: "Cart" },
    { path: "/orders", icon: <ClipboardList size={24} />, label: "Orders" },
    
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-b from-white to-green-50">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl relative ${
                isActive(item.path)
                  ? "text-green-600 bg-green-100/80 shadow-sm"
                  : "text-gray-600 hover:text-green-500 hover:bg-green-50 transition-all duration-200"
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.label === "Cart" && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full shadow-md">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

   
    </>
  );
};

export default BottomNav;
