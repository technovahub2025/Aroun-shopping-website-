import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  TrendingDown 
} from 'lucide-react';

const DashboardHome = () => {
  const stats = [
    {
      title: "Total Sales",
      value: "₹45,231",
      change: "+12.5%",
      isIncrease: true,
      icon: DollarSign,
      color: "blue"
    },
    {
      title: "Total Orders",
      value: "126",
      change: "+8.2%",
      isIncrease: true,
      icon: ShoppingCart,
      color: "green"
    },
    {
      title: "Total Customers",
      value: "89",
      change: "+23.1%",
      isIncrease: true,
      icon: Users,
      color: "purple"
    },
    {
      title: "Products Stock",
      value: "534",
      change: "-4.5%",
      isIncrease: false,
      icon: Package,
      color: "orange"
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <div className={`flex items-center ${stat.isIncrease ? 'text-green-500' : 'text-red-500'}`}>
                {stat.isIncrease ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-1">{stat.value}</h2>
            <p className="text-gray-500 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">New order received</p>
                  <p className="text-xs text-gray-500">Order #2854 from John Doe</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;