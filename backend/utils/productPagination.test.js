const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parsePage, getProductPage } = require('./productPagination');

test('page inputs reject invalid and mixed cursor requests', () => {
  assert.equal(parsePage(undefined), null);
  assert.equal(parsePage('7'), 7);
  for (const value of ['0', '-1', '1.5', 'abc', [], '9007199254740992']) {
    assert.throws(() => parsePage(value), { status: 400 });
  }
  assert.throws(() => parsePage('2', 'cursor'), { status: 400 });
});

test('direct page jumps use matching filters and bounded reads; stale pages clamp to the last page', async () => {
  const filter = { category: 'Shoes', isDeleted: { $ne: true } };
  let offset, limit;
  const Model = {
    countDocuments(query) { assert.equal(query, filter); return { setOptions: async () => 85 }; },
    find(query) {
      assert.equal(query, filter);
      return { setOptions() { return this; }, sort() { return this; },
        skip(value) { offset = value; return this; }, limit(value) { limit = value; return this; },
        lean: async () => Array.from({ length: Math.min(limit, 85 - offset) }, (_, i) => ({ _id: offset + i })),
      };
    },
  };
  const fourth = await getProductPage(Model, filter, { _id: 1 }, 20, 4);
  assert.equal(offset, 60);
  assert.equal(limit, 20);
  assert.equal(fourth.totalPages, 5);
  assert.equal(fourth.items.length, 20);
  assert.equal(fourth.hasMore, true);
  const last = await getProductPage(Model, filter, { _id: 1 }, 20, 100);
  assert.equal(offset, 80);
  assert.equal(last.page, 5);
  assert.equal(last.items.length, 5);
  assert.equal(last.hasMore, false);
});

test('empty collections return page one with no next page', async () => {
  const Model = {
    countDocuments: () => ({ setOptions: async () => 0 }),
    find: () => ({ setOptions() { return this; }, sort() { return this; },
      skip(value) { assert.equal(value, 0); return this; }, limit() { return this; }, lean: async () => [] }),
  };
  assert.deepEqual(await getProductPage(Model, {}, { _id: 1 }, 20, 3),
    { items: [], page: 1, total: 0, totalPages: 1, hasMore: false });
});
