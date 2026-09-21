const { test } = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/productModel');
const { getCatalog, getCategoryPreviews, getCatalogFacets } = require('./catalogList');

const response = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
const id = n => n.toString(16).padStart(24, '0');
const rows = Array.from({ length: 9 }, (_, i) => ({
  _id: id(i + 1), price: Math.floor(i / 3) * 10, category: i % 2 ? 'B' : 'A',
  type: 'Retail', createdAt: new Date(`2026-01-0${Math.floor(i / 3) + 1}`), isDeleted: i === 8,
}));

function matches(row, query) {
  return Object.entries(query).every(([field, value]) => {
    if (field === '$or') return value.some(part => matches(row, part));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('$ne' in value) return row[field] !== value.$ne;
      if ('$in' in value) return value.$in.includes(row[field]);
      if ('$gt' in value) return row[field] > value.$gt;
      if ('$lt' in value) return row[field] < value.$lt;
    }
    return row[field] instanceof Date ? +row[field] === +value : row[field] === value;
  });
}

function fakeFind(t, source = rows) {
  const reads = [];
  t.mock.method(Product, 'find', query => {
    const read = { query }; reads.push(read);
    return { setOptions() { return this; }, select() { return this; },
      sort(value) { read.sort = value; return this; }, limit(value) { read.limit = value; return this; },
      async lean() {
        return source.filter(row => matches(row, query)).sort((a, b) => {
          for (const [field, direction] of Object.entries(read.sort)) {
            if (a[field] < b[field]) return -direction;
            if (a[field] > b[field]) return direction;
          }
          return 0;
        }).slice(0, read.limit);
      },
    };
  });
  return reads;
}

for (const sort of ['relevant', 'price-asc', 'price-desc', 'newest']) {
  test(`${sort}: tied values cross page boundaries without missing or duplicate products`, async t => {
    const reads = fakeFind(t);
    let cursor;
    const items = [];
    for (let page = 0; page < 4; page++) {
      const res = response();
      await getCatalog({ query: { limit: '2', sort, ...(cursor ? { cursor } : {}) } }, res);
      assert.equal(res.statusCode, 200);
      items.push(...res.body.items);
      cursor = res.body.nextCursor;
      assert.equal(res.body.hasMore, page < 3);
    }
    const expected = rows.filter(row => !row.isDeleted);
    if (sort === 'price-desc' || sort === 'newest') expected.reverse();
    assert.deepEqual(items.map(row => row._id), expected.map(row => row._id));
    assert.equal(cursor, null);
    assert.ok(reads.every(read => read.limit === 3));
  });
}

test('filters apply before pagination; empty results stop pagination', async t => {
  fakeFind(t);
  const res = response();
  await getCatalog({ query: { categories: JSON.stringify(['A']), types: JSON.stringify(['Retail']) } }, res);
  assert.deepEqual(res.body.items.map(row => row._id), [1, 3, 5, 7].map(id));
  const empty = response();
  await getCatalog({ query: { categories: JSON.stringify(['Missing']) } }, empty);
  assert.deepEqual(empty.body, { items: [], hasMore: false, nextCursor: null });
});

test('invalid cursors, sorts, and filters do not query MongoDB', async t => {
  const find = t.mock.method(Product, 'find', () => { throw Error('Unexpected query'); });
  for (const query of [{ limit: '-1' }, { sort: 'unknown' }, { sort: ['newest'] },
    { categories: '{}' }, { types: '[{}]' }, { cursor: 'bad' }, { cursor: 'bnVsbA' },
    { sort: 'price-asc', cursor: Buffer.from(JSON.stringify({ id: id(1), sort: 'newest', value: 0 })).toString('base64url') }]) {
    const res = response();
    await getCatalog({ query }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(find.mock.callCount(), 0);
});

test('product batch size is capped', async t => {
  const reads = fakeFind(t);
  await getCatalog({ query: { limit: '999' } }, response());
  assert.equal(reads[0].limit, 61);
});

test('category pages fetch at most six previews per returned category', async t => {
  let pipeline;
  t.mock.method(Product, 'aggregate', async stages => {
    pipeline = stages;
    return [{ _id: 'B', count: 100 }, { _id: 'C', count: 500 }];
  });
  const reads = fakeFind(t);
  const res = response();
  await getCategoryPreviews({ query: { limit: '1', cursor: 'A' } }, res);
  assert.equal(pipeline[0].$match.category.$gt, 'A');
  assert.equal(pipeline.at(-1).$limit, 2);
  assert.equal(reads.length, 1);
  assert.equal(reads[0].limit, 6);
  assert.equal(res.body.items[0].count, 100);
  assert.equal(res.body.nextCursor, 'B');
  assert.equal(res.body.hasMore, true);
});

test('facet responses contain counts and types, not full product records', async t => {
  t.mock.method(Product, 'aggregate', async () => [{ categories: [{ _id: 'A', count: 7 }], types: [{ _id: 'Retail' }] }]);
  const res = response();
  await getCatalogFacets({}, res);
  assert.deepEqual(res.body, { categories: [{ name: 'A', count: 7 }], types: ['Retail'] });
});
