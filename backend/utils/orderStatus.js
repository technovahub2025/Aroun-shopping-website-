const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const LEGACY_STATUSES = { created: 'Pending', pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
const normalizeOrderStatus = (status) => LEGACY_STATUSES[status] || status || 'Pending';

module.exports = { ORDER_STATUSES, LEGACY_STATUSES, normalizeOrderStatus };
