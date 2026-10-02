import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import orderApi from '../../../api/orderApi';
import { orderAmount, orderCustomer, orderDate, orderStatus, orderStatuses } from '../../utils/orderStatus';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await orderApi.getById(id);
      setOrder(data);
      setStatus(orderStatus(data.status));
    } catch (err) {
      setError(err.response?.status === 404 ? 'Order not found.' : err.response?.status === 400 ? 'Invalid order ID.' : 'Unable to load this order. Please try again.');
    } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await orderApi.update(id, { status });
      setOrder(current => ({ ...data, user: current.user }));
      setStatus(orderStatus(data.status));
      toast.success('Order status updated');
    } catch {
      toast.error('Unable to update the order status. Please try again.');
    } finally { setSaving(false); }
  };

  return <section className="space-y-6">
    <Link to="/admin/orders" className="text-red-600 hover:underline">Back to orders</Link>
    <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
    {loading ? <p role="status">Loading order...</p> : error ? <p role="alert" className="rounded bg-red-50 p-4 text-red-700">{error} <button onClick={load} className="underline">Retry</button></p> : order && <div className="space-y-6 rounded-lg bg-white p-6 shadow">
      <div className="break-words"><p className="font-semibold">Order ID: #{order._id}</p><p className="text-gray-600">Order date: {orderDate(order.createdAt)}</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div><h2 className="mb-2 font-semibold">Customer Details</h2>
          <p>Name: {orderCustomer(order)}</p>
          <p className="break-words">Email: {order.shipping?.email || order.user?.email || 'Not provided'}</p>
          <p>Phone: {order.shipping?.phone || order.user?.phone || 'Not provided'}</p>
        </div>
        <div><h2 className="mb-2 font-semibold">Delivery Address</h2>
          <p className="whitespace-pre-line break-words">{[order.shipping?.street, order.shipping?.city, order.shipping?.state, order.shipping?.zipcode, order.shipping?.country].filter(Boolean).join('\n') || 'Not provided'}</p>
        </div>
      </div>
      <div><h2 className="mb-2 font-semibold">Products</h2>
        {order.items.map((item, index) => <div key={index} className="flex justify-between gap-4 border-b py-3"><div><p>{item.name}</p><p className="text-sm text-gray-600">Quantity: {item.quantity}</p></div><p>{orderAmount(item.price * item.quantity)}</p></div>)}
      </div>
      <div><p className="text-lg font-semibold">Total Amount: {orderAmount(order.totalPrice)}</p><p className="capitalize">Payment Status: {order.payment?.status || 'pending'}</p><p>Current Order Status: {orderStatus(order.status)}</p></div>
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <label className="space-y-1"><span className="block text-sm font-medium">Order Status</span><select value={status} onChange={event => setStatus(event.target.value)} disabled={saving} className="rounded border px-3 py-2">{orderStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <button disabled={saving || status === orderStatus(order.status)} className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save status'}</button>
      </form>
    </div>}
  </section>;
}
