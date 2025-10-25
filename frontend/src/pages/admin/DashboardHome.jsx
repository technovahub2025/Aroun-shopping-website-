import React from 'react';
import { CreditCard, ShoppingBag, Users, TrendingUp } from 'lucide-react';

const DashboardHome = () => {
  const stats = [
    { name: 'Total Sales', value: '₹45,231', icon: CreditCard, change: '+12.3%' },
    { name: 'Total Orders', value: '156', icon: ShoppingBag, change: '+8.2%' },
    { name: 'Total Users', value: '2,345', icon: Users, change: '+15.1%' },
    { name: 'Revenue Growth', value: '32.5%', icon: TrendingUp, change: '+4.5%' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden rounded-lg shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className={`text-${
                  item.change.startsWith('+') ? 'green' : 'red'
                }-600 font-medium`}>
                  {item.change}
                </span>
                <span className="text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white shadow rounded-lg">
          <div className="divide-y divide-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">New order received</p>
                  <p className="text-sm text-gray-500">Order #12345 - ₹499</p>
                </div>
                <span className="text-sm text-gray-500">5 minutes ago</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Product stock updated</p>
                  <p className="text-sm text-gray-500">Smartphone X1 - Stock: 24</p>
                </div>
                <span className="text-sm text-gray-500">1 hour ago</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">New user registered</p>
                  <p className="text-sm text-gray-500">user@example.com</p>
                </div>
                <span className="text-sm text-gray-500">3 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;