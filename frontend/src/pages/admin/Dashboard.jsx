import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutGrid, Package, Users, Settings } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
          </div>
          <nav className="mt-4">
            <Link
              to="/admin"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <LayoutGrid className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <Package className="w-5 h-5 mr-3" />
              Products
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <Users className="w-5 h-5 mr-3" />
              Users
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;