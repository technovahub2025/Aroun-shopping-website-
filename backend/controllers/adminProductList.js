const Product = require('../models/productModel');
const { parsePage, getProductPage } = require('../utils/productPagination');

// Use the indexed _id cursor instead of skipping an ever-growing number of rows.
module.exports = async (req, res) => {
  const { cursor, search = '', deleted = 'false', limit = '20' } = req.query;
  if ((cursor !== undefined && (typeof cursor !== 'string' || !/^[a-f\d]{24}$/i.test(cursor))) ||
      typeof search !== 'string' || search.length > 200 ||
      !['true', 'false'].includes(deleted) ||
      typeof limit !== 'string' || !/^\d+$/.test(limit) || Number(limit) < 1) {
    return res.status(400).json({ message: 'Invalid product list parameters' });
  }
  const batchSize = Math.min(Number(limit), 100);
  const query = { isDeleted: deleted === 'true' ? true : { $ne: true } };
  if (cursor) query._id = { $lt: cursor };
  if (search.trim()) {
    const literal = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['title', 'category'].map(field => ({ [field]: { $regex: literal, $options: 'i' } }));
  }
  try {
    const page = parsePage(req.query.page, cursor);
    if (page !== null) return res.json(await getProductPage(Product, query, { _id: -1 }, batchSize, page));
    const rows = await Product.find(query).setOptions({ strictQuery: false })
      .sort({ _id: -1 }).limit(batchSize + 1).lean();
    const hasMore = rows.length > batchSize;
    const items = rows.slice(0, batchSize);
    return res.json({ items, hasMore, nextCursor: hasMore ? String(items.at(-1)._id) : null });
  } catch (error) {
    console.error('Failed to fetch admin products:', error);
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Failed to fetch products' });
  }
};
