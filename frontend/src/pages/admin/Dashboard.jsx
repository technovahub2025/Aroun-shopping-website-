import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  LayoutGrid, 
  Package, 
  Users, 
  Settings, 
  Menu,
  X,
  ShoppingBag,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const user = useSelector(state => state.user.user);

  const navigation = [
    { name: 'Overview', icon: LayoutGrid, href: '/admin' },
    { name: 'Products', icon: Package, href: '/admin/products' },
    { name: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
    { name: 'Customers', icon: Users, href: '/admin/customers' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm py-4 px-4 flex items-center justify-between">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        <div className="w-6" /> {/* Spacer for alignment */}
      </div>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-xl z-30 w-64 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-500">Welcome, {user?.name || 'Admin'}</p>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600
                  ${isActive ? 'bg-red-50 text-red-600' : ''}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="ml-auto w-5 h-5" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <div className="p-4 lg:p-8">
          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center text-sm text-gray-500 mb-6">
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900">
              {location.pathname === '/admin' ? 'Overview' : 
                navigation.find(n => n.href === location.pathname)?.name || 'Page'}
            </span>
          </div>

          {/* Page Content */}
          <div className="bg-white rounded-lg shadow">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;