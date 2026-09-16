const { test } = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/productModel');
const drive = require('../utils/googleDrive');
const controller = require('../controllers/productController');

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } });

test('Drive product image lifecycle preserves order, clears images, and cleans up failed saves', async () => {
  const original = { create: Product.create, find: Product.findById, upload: drive.uploadImage, remove: drive.deleteImage };
  const originalError = console.error;
  const deleted = [];
  try {
    console.error = () => {};
    drive.uploadImage = async () => ({ id: 'new-id', url: 'https://shop.example/image' });
    drive.deleteImage = async (id) => deleted.push(id);
    Product.create = async (data) => data;
    const req = { body: { title: 'Product', imageStorage: 'google-drive', imageOrder: JSON.stringify([
      { type: 'file', index: 0 }, { type: 'url', url: 'https://example.com/existing.png' },
    ]) }, files: [{ buffer: Buffer.from('GIF89a'), mimetype: 'image/gif' }] };
    const created = response();
    await controller.createProduct(req, created);
    assert.equal(created.statusCode, 201);
    assert.deepEqual(created.body.images, ['https://shop.example/image', 'https://example.com/existing.png']);
    assert.deepEqual(deleted, []);

    const product = { images: ['https://example.com/old.png'], save: async () => {} };
    Product.findById = async () => product;
    await controller.updateProduct({ params: { id: 'product' }, body: { imageStorage: 'google-drive', imageOrder: '[]' }, files: [] }, response());
    assert.deepEqual(product.images, []);

    Product.create = async () => { throw new Error('Database save failed'); };
    const failed = response();
    await controller.createProduct(req, failed);
    assert.equal(failed.statusCode, 500);
    assert.deepEqual(deleted, ['new-id']);
  } finally {
    Product.create = original.create;
    Product.findById = original.find;
    drive.uploadImage = original.upload;
    drive.deleteImage = original.remove;
    console.error = originalError;
  }
});
