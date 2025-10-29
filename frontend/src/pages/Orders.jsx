import React, { useEffect, useState } from 'react';
import orderApi from '../../api/orderApi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const statusOptions = ['created', 'processing', 'shipped', 'delivered', 'cancelled'];

const Orders = () => {
  const user = useSelector((s) => s.user?.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const resp = user?.role === 'admin' ? await orderApi.listAll() : await orderApi.myOrders();
      setOrders(resp.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.update(orderId, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Loading orders...</div>
    </div>
  );

  if (!orders || orders.length === 0) return (
    <div className="max-w-7xl mx-auto  px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="bg-white rounded-lg shadow h-[100vh] p-6 text-center text-gray-500">No orders yet.</div>
    </div>
  );

  return (
    <div className="max-w-7xl  mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Order ID: <span className="font-mono text-xs">{order._id}</span></div>
                <div className="text-sm text-gray-500">Placed: {new Date(order.createdAt).toLocaleString()}</div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.payment?.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {order.payment?.status === 'paid' ? 'Paid' : order.payment?.status || 'Pending'}
                  </span>
                  <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-sm text-gray-700">
                  <div>Total</div>
                  <div className="text-xl font-semibold">₹{(order.totalPrice || 0).toLocaleString()}</div>
                </div>
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Change status</label>
                    <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                {order.items.map((it) => (
                  <div key={it.product} className="flex items-center gap-3 border-b pb-3">
                    <img src={it.image || '/placeholder.png'} alt={it.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-500">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-right font-medium">₹{((it.price||0) * (it.quantity||1)).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-600">Ship To</div>
                <div className="font-medium">{order.shipping?.firstName} {order.shipping?.lastName}</div>
                <div className="text-sm text-gray-600">{order.shipping?.street}</div>
                <div className="text-sm text-gray-600">{order.shipping?.city} - {order.shipping?.zipcode}</div>
                <div className="text-sm text-gray-600">Phone: {order.shipping?.phone}</div>
                <div className="text-sm text-gray-600">Email: {order.shipping?.email}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;