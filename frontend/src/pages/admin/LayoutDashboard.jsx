import React, { useState } from "react";
import { Menu, X, Home, ShoppingCart, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import AdminRoutes from './Routes';

const LayoutDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed z-40 inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-200 ease-in-out bg-white w-64 shadow-lg md:translate-x-0 md:static md:shadow-none`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4 flex flex-col space-y-1 px-4">
          <Link
            to="/admin"
            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200"
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/admin/products"
            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Products</span>
          </Link>

          <Link
            to="/admin/users"
            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200"
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </Link>

          <Link
            to="/admin/settings"
            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar (mobile) */}
        <header className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button onClick={toggleSidebar} className="p-2 rounded hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 p-6">
          <AdminRoutes />
        </main>
      </div>
    </div>
  );
};

export default LayoutDashboard;
