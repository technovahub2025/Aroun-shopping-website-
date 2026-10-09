const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { catalogCache, invalidateCatalog, clear } = require('./publicCatalogCache');

function response(statusCode = 200) {
  return Object.assign(new EventEmitter(), { statusCode, headers: {},
    set(key, value) { this.headers[key] = value; return this; },
    json(body) { this.body = body; return this; },
  });
}

test('public responses are reused, separated by filters, and expire', t => {
  clear();
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  let reads = 0;
  const request = url => {
    const res = response();
    catalogCache({ originalUrl: url }, res, () => { reads++; res.json({ items: [reads] }); });
    return res;
  };
  const url = '/api/products/catalog?page=1';
  assert.deepEqual(request(url).body, request(url).body);
  assert.equal(reads, 1);
  request('/api/products/catalog?page=2');
  assert.equal(reads, 2);
  now += 30001;
  request(url);
  assert.equal(reads, 3);
  assert.match(request(url).headers['Cache-Control'], /s-maxage=30/);
});

test('successful writes invalidate cached products; failures and reads do not', () => {
  clear();
  const url = '/api/products/category-previews';
  const seed = response();
  catalogCache({ originalUrl: url }, seed, () => seed.json({ items: [] }));
  for (const [method, statusCode] of [['GET', 200], ['PUT', 403]]) {
    const res = response(statusCode);
    invalidateCatalog({ method }, res, () => {});
    res.emit('finish');
    let missed = false;
    catalogCache({ originalUrl: url }, response(), () => { missed = true; });
    assert.equal(missed, false);
  }
  const res = response();
  invalidateCatalog({ method: 'DELETE' }, res, () => {});
  res.emit('finish');
  let missed = false;
  catalogCache({ originalUrl: url }, response(), () => { missed = true; });
  assert.equal(missed, true);
});

test('errors and responses started before invalidation cannot populate the cache', () => {
  clear();
  const req = { originalUrl: '/api/products/catalog' };
  const error = response(500);
  catalogCache(req, error, () => error.json({ message: 'Failed' }));
  assert.equal(error.headers['Cache-Control'], 'no-store');
  const pending = response();
  let missed = false;
  catalogCache(req, pending, () => { missed = true; });
  assert.equal(missed, true);
  clear();
  pending.json({ items: ['old'] });
  missed = false;
  catalogCache(req, response(), () => { missed = true; });
  assert.equal(missed, true);
});
