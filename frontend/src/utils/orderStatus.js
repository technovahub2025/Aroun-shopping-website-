export const orderStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
export const orderStatus = (value) => value === 'created' || !value ? 'Pending' : value[0].toUpperCase() + value.slice(1);
export const orderCustomer = (order) => [order.shipping?.firstName || order.user?.firstName, order.shipping?.lastName || order.user?.lastName].filter(Boolean).join(' ') || 'Not provided';
export const orderAmount = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
export const orderDate = (value) => value ? new Date(value).toLocaleString('en-IN') : 'Not available';
