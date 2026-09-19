const Product = require('../models/productModel');
const { parsePage, getProductPage } = require('../utils/productPagination');

const invalid = () => Object.assign(new Error('Invalid catalog parameters'), { status: 400 });
const batchLimit = (value = '20', max = 60) => {
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1) throw invalid();
  return Math.min(Number(value), max);
};
const listFilter = value => {
  if (value === undefined) return [];
  if (typeof value !== 'string' || value.length > 5000) throw invalid();
  const values = JSON.parse(value);
  if (!Array.isArray(values) || values.length > 100 || values.some(v => typeof v !== 'string' || v.length > 200)) throw invalid();
  return values;
};
const sorts = { relevant: { _id: 1 }, newest: { createdAt: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 }, 'price-desc': { price: -1, _id: -1 } };

exports.getCatalog = async (req, res) => {
  try {
    const limit = batchLimit(req.query.limit);
    const sortName = req.query.sort || 'relevant';
    if (typeof sortName !== 'string' || !Object.hasOwn(sorts, sortName)) throw invalid();
    const sort = sorts[sortName];
    const query = { isDeleted: { $ne: true } };
    const categories = listFilter(req.query.categories), types = listFilter(req.query.types);
    if (categories.length) query.category = { $in: categories };
    if (types.length) query.type = { $in: types };
    const page = parsePage(req.query.page, req.query.cursor);
    if (page !== null) return res.json(await getProductPage(Product, query, sort, limit, page,
      '_id title description price mrp discount rating category type images createdAt stock'));
    const field = Object.keys(sort)[0], comparison = sort[field] === 1 ? '$gt' : '$lt';
    if (req.query.cursor !== undefined) {
      if (typeof req.query.cursor !== 'string' || req.query.cursor.length > 1000) throw invalid();
      const cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64url').toString());
      if (!cursor || cursor.sort !== sortName || typeof cursor.id !== 'string' || !/^[a-f\d]{24}$/i.test(cursor.id)) throw invalid();
      if (field === '_id') query._id = { [comparison]: cursor.id };
      else {
        let value = cursor.value;
        if (field === 'price' && (typeof value !== 'number' || !Number.isFinite(value))) throw invalid();
        if (field === 'createdAt') {
          if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw invalid();
          value = new Date(value);
        }
        query.$or = [{ [field]: { [comparison]: value } }, { [field]: value, _id: { [comparison]: cursor.id } }];
      }
    }
    const rows = await Product.find(query).setOptions({ strictQuery: false }).sort(sort)
      .limit(limit + 1).select('_id title description price mrp discount rating category type images createdAt stock').lean();
    const items = rows.slice(0, limit), hasMore = rows.length > limit, last = items.at(-1);
    const nextCursor = hasMore ? Buffer.from(JSON.stringify({ sort: sortName, id: String(last._id), value: last[field] })).toString('base64url') : null;
    res.json({ items, hasMore, nextCursor });
  } catch (err) {
    res.status(err.status || (err instanceof SyntaxError ? 400 : 500)).json({ message: err.status || err instanceof SyntaxError ? 'Invalid catalog parameters' : 'Failed to load catalog' });
  }
};

exports.getCategoryPreviews = async (req, res) => {
  try {
    const limit = batchLimit(req.query.limit || '6', 12);
    const cursor = req.query.cursor;
    if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 200)) throw invalid();
    const match = { isDeleted: { $ne: true }, category: { $type: 'string', $ne: '' } };
    if (cursor !== undefined) match.category.$gt = cursor;
    const groups = await Product.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: limit + 1 },
    ]);
    const hasMore = groups.length > limit;
    const selected = groups.slice(0, limit);
    // Fetch only a small preview for each category, never the entire category.
    const items = await Promise.all(selected.map(async group => ({
      _id: group._id, name: group._id, count: group.count,
      products: await Product.find({ category: group._id, isDeleted: { $ne: true } })
        .setOptions({ strictQuery: false }).sort({ _id: 1 }).limit(6).select('_id title images').lean(),
    })));
    res.json({ items, hasMore, nextCursor: hasMore ? selected.at(-1)._id : null });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to load categories' });
  }
};

exports.getCatalogFacets = async (_req, res) => {
  try {
    const [data] = await Product.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $facet: {
        categories: [{ $match: { category: { $type: 'string', $ne: '' } } },
          { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        types: [{ $match: { type: { $type: 'string', $ne: '' } } },
          { $group: { _id: '$type' } }, { $sort: { _id: 1 } }],
      } },
    ]);
    res.json({ categories: data.categories.map(row => ({ name: row._id, count: row.count })), types: data.types.map(row => row._id) });
  } catch {
    res.status(500).json({ message: 'Failed to load catalog filters' });
  }
};
