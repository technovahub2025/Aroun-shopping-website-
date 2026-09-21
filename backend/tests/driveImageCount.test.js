const { test } = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/productModel');
const { getDriveImageProductCount } = require('../controllers/productController');

test('Drive image response groups pending products and preserves counts and completion', async () => {
  const original = { find: Product.find, countDocuments: Product.countDocuments };
  let pending = [
    { _id: '1', title: 'Rice', category: 'Grains' },
    { _id: '2', title: 'Wheat', category: 'Grains' },
    { _id: '3', title: 'Other', category: '' },
  ];
  let imageFilter;
  Product.countDocuments = async (filter) => { imageFilter = filter; return 2; };
  Product.find = (filter) => {
    assert.deepEqual(filter, { $nor: [imageFilter] });
    return {
      select(fields) { assert.equal(fields, '_id title category'); return this; },
      sort() { return this; },
      async lean() { return pending; },
    };
  };
  const res = { json(body) { this.body = body; }, status(code) { this.statusCode = code; return this; } };
  try {
    await getDriveImageProductCount({}, res);
    assert.equal(res.body.totalProducts, 5);
    assert.equal(res.body.totalProductsWithDriveImages, 2);
    assert.equal(res.body.remainingProducts, 3);
    assert.equal(res.body.status, 'pending');
    assert.deepEqual(res.body.pendingCategories, [
      { category: 'Grains', count: 2, products: [{ _id: '1', title: 'Rice' }, { _id: '2', title: 'Wheat' }] },
      { category: 'Uncategorized', count: 1, products: [{ _id: '3', title: 'Other' }] },
    ]);
    pending = [];
    await getDriveImageProductCount({}, res);
    assert.equal(res.body.status, 'completed');
    assert.equal(res.body.remainingProducts, 0);
    assert.deepEqual(res.body.pendingCategories, []);
  } finally {
    Object.assign(Product, original);
  }
});
