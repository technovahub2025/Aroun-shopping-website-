import React from 'react';
import { useSelector } from 'react-redux';
import { User, Mail, Phone, MapPin, LogOut, Settings, ShoppingBag } from 'lucide-react';

const Profile = () => {
  const user = useSelector((state) => state.user?.user);

  const handleLogout = () => {
    // Implement logout logic
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {user ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <User size={40} className="text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-green-100">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-500">Default Address</label>
                  <p className="font-medium text-gray-900">Add your address</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-800">My Orders</span>
            </button>

            <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-800">Settings</span>
            </button>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl hover:bg-red-100 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <User size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Not Signed In</h2>
          <p className="text-gray-500 mb-6">Please log in to view your profile</p>
          <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-all">
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;