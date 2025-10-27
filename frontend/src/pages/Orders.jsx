import React, { useEffect, useState } from "react";
import orderApi from "../../api/orderApi";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Loader2, PackageCheck, Truck, CheckCircle2, XCircle } from "lucide-react";

const statusOptions = ["created", "processing", "shipped", "delivered", "cancelled"];

const statusIcons = {
  created: <PackageCheck size={18} className="text-blue-500" />,
  processing: <Loader2 size={18} className="text-orange-500 animate-spin" />,
  shipped: <Truck size={18} className="text-purple-500" />,
  delivered: <CheckCircle2 size={18} className="text-green-600" />,
  cancelled: <XCircle size={18} className="text-red-500" />,
};

const Orders = () => {
  const user = useSelector((s) => s.user?.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const resp =
        user?.role === "admin"
          ? await orderApi.listAll()
          : await orderApi.myOrders();

      let fetchedOrders = resp.data || [];

      if (user?.role !== "admin") {
        fetchedOrders = fetchedOrders.filter(
          (order) => order.user?._id === user?._id
        );
      }

      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Failed to load orders", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.update(orderId, { status: newStatus });
      toast.success("Order status updated");
      // Update UI immediately
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );

  if (!orders || orders.length === 0)
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <p className="text-gray-500">No orders yet.</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {user?.role === "admin" ? "All Orders" : "My Orders"}
      </h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between gap-4 p-5 border-b">
              <div>
                <div className="text-sm text-gray-500">
                  Order ID:{" "}
                  <span className="font-mono text-xs text-gray-700">
                    {order._id}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Placed: {new Date(order.createdAt).toLocaleString()}
                </div>
                {user?.role === "admin" && order.user && (
                  <div className="text-sm text-gray-500 mt-1">
                    Customer:{" "}
                    <span className="font-medium text-gray-800">
                      {order.user?.phone}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-xl font-bold text-green-700">
                  ₹{(order.totalPrice || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="flex justify-between items-center px-5 py-3 bg-gray-50">
              <div className="flex items-center gap-2">
                {statusIcons[order.status]}
                <span
                  className={`font-semibold capitalize ${
                    order.status === "delivered"
                      ? "text-green-600"
                      : order.status === "cancelled"
                      ? "text-red-500"
                      : "text-gray-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {user?.role === "admin" && (
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(order._id, e.target.value)
                  }
                  className="border text-sm rounded-lg px-3 py-1 focus:ring-2 focus:ring-green-400"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Items */}
            <div className="p-5 space-y-3 border-t">
              {order.items.map((it) => (
                <div
                  key={it.product}
                  className="flex items-center justify-between border-b pb-2 last:border-none"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={it.image || "/placeholder.png"}
                      alt={it.name}
                      className="w-14 h-14 rounded-lg object-cover border"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{it.name}</div>
                      <div className="text-sm text-gray-500">
                        Qty: {it.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-medium text-gray-800">
                    ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 px-5 py-4 text-sm text-gray-700">
              <div className="font-semibold text-gray-800 mb-1">Shipping Address</div>
              <div>{order.shipping?.firstName} {order.shipping?.lastName}</div>
              <div>{order.shipping?.street}</div>
              <div>{order.shipping?.city} - {order.shipping?.zipcode}</div>
              <div>📞 {order.shipping?.phone}</div>
              <div>✉️ {order.shipping?.email}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
