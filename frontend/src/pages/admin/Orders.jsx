import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderApi from '../../../api/orderApi';
import NumberedPagination from '../../components/NumberedPagination';
import { orderAmount, orderCustomer, orderDate, orderStatus } from '../../utils/orderStatus';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await orderApi.listAll({ forceRefresh: true });
      setOrders(data);
      setPage(current => Math.min(current, Math.max(1, Math.ceil(data.length / 20))));
    } catch {
      setError('Unable to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return <section className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
      <button onClick={load} disabled={loading} className="rounded border bg-white px-4 py-2 disabled:opacity-50">Refresh</button>
    </div>
    {error && <p role="alert" className="rounded bg-red-50 p-4 text-red-700">{error} <button className="underline" onClick={load}>Retry</button></p>}
    {loading ? <p role="status" className="rounded-lg bg-white p-6 text-gray-500">Loading orders...</p> : !error && <>
      {orders.length === 0 ? <p className="rounded-lg bg-white p-6 text-gray-500">No orders yet.</p> : <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600"><tr>{['Order ID', 'Customer', 'Products', 'Amount', 'Payment', 'Date', 'Status', 'Action'].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead>
          <tbody>{orders.slice((page - 1) * 20, page * 20).map(order => <tr key={order._id} className="border-t">
            <td className="p-4 font-mono text-xs">#{order._id}</td>
            <td className="p-4">{orderCustomer(order)}</td>
            <td className="p-4">{order.items.map((item, index) => <div key={index}>{item.name} × {item.quantity}</div>)}</td>
            <td className="whitespace-nowrap p-4">{orderAmount(order.totalPrice)}</td>
            <td className="p-4 capitalize">{order.payment?.status || 'pending'}</td>
            <td className="p-4">{orderDate(order.createdAt)}</td>
            <td className="p-4">{orderStatus(order.status)}</td>
            <td className="p-4"><Link to={`/admin/orders/${order._id}`} aria-label={`View order ${order._id}`} className="font-medium text-red-600 hover:underline">View</Link></td>
          </tr>)}</tbody>
        </table>
      </div>}
      {orders.length > 20 && <NumberedPagination label="Order pages" page={page} totalPages={Math.ceil(orders.length / 20)} onPageChange={setPage} loading={loading} />}
    </>}
  </section>;
}
