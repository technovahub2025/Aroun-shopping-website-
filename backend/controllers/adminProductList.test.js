const { test } = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/productModel');
const handler = require('./adminProductList');

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; } };
}

test('cursor pagination bounds reads and uses the last returned ID, not the lookahead row', async t => {
  const ids = [5, 4, 3, 2, 1].map(n => n.toString(16).padStart(24, '0'));
  const reads = [];
  t.mock.method(Product, 'find', query => {
    const read = { query };
    reads.push(read);
    return {
      setOptions() { return this; },
      sort(value) { read.sort = value; return this; },
      limit(value) { read.limit = value; return this; },
      async lean() {
        return ids.filter(id => !query._id || id < query._id.$lt)
          .slice(0, read.limit).map(_id => ({ _id }));
      },
    };
  });
  let cursor;
  const received = [];
  for (let page = 0; page < 3; page++) {
    const res = response();
    await handler({ query: { limit: '2', ...(cursor ? { cursor } : {}) } }, res);
    assert.equal(res.statusCode, 200);
    received.push(...res.body.items.map(row => row._id));
    cursor = res.body.nextCursor;
    assert.equal(res.body.hasMore, page < 2);
  }
  assert.deepEqual(received, ids);
  assert.equal(cursor, null);
  assert.ok(reads.every(read => read.limit === 3));
  assert.deepEqual(reads[0].sort, { _id: -1 });
  assert.deepEqual(reads[0].query.isDeleted, { $ne: true });
});

test('search is literal, deleted records are isolated, and batch size is capped', async t => {
  let filter, limit;
  t.mock.method(Product, 'find', query => {
    filter = query;
    return { setOptions() { return this; }, sort() { return this; },
      limit(value) { limit = value; return this; }, lean: async () => [] };
  });
  const res = response();
  await handler({ query: { search: 'a.*[b]', deleted: 'true', limit: '500' } }, res);
  assert.equal(limit, 101);
  assert.equal(filter.isDeleted, true);
  const regex = new RegExp(filter.$or[0].title.$regex, 'i');
  assert.equal(regex.test('A.*[B]'), true);
  assert.equal(regex.test('anythingb'), false);
  assert.deepEqual(res.body, { items: [], hasMore: false, nextCursor: null });
});

test('invalid parameters are rejected before accessing the database', async t => {
  const find = t.mock.method(Product, 'find', () => { throw new Error('Unexpected query'); });
  for (const query of [{ cursor: 'bad' }, { limit: '0' }, { limit: '-1' },
    { limit: 'abc' }, { search: {} }, { search: 'a'.repeat(201) }, { deleted: 'yes' }]) {
    const res = response();
    await handler({ query }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(find.mock.callCount(), 0);
});
