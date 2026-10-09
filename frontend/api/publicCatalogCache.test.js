import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPublicCatalogFetcher, clearPublicCatalogCache } from './publicCatalogCache.js';
Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true, configurable: true });

function storage() {
  const values = {};
  return Object.assign(values, {
    getItem: key => values[key] || null,
    setItem: (key, value) => { values[key] = value; },
    removeItem: key => { delete values[key]; },
  });
}

test('snapshots persist, respect filters and origin, expire, and refresh from the network', async t => {
  t.mock.property(globalThis, 'localStorage', storage());
  clearPublicCatalogCache();
  let now = 1000;
  t.mock.method(Date, 'now', () => now);
  let reads = 0;
  const client = { defaults: { baseURL: 'https://store.example/api' },
    get: async () => ({ data: { items: [{ _id: String(++reads) }], page: 1, totalPages: 1 } }),
  };
  const fetchPage = createPublicCatalogFetcher(client, '/products/catalog');
  await fetchPage({ limit: 20, page: 1 });
  assert.equal(fetchPage.getCached({ page: 1, limit: 20 }).items[0]._id, '1');
  assert.equal(fetchPage.getCached({ page: 2, limit: 20 }), null);
  const other = createPublicCatalogFetcher({ ...client, defaults: { baseURL: 'https://other.example/api' } }, '/products/catalog');
  assert.equal(other.getCached({ page: 1, limit: 20 }), null);
  await fetchPage({ page: 1, limit: 20 });
  assert.equal(fetchPage.getCached({ limit: 20, page: 1 }).items[0]._id, '2');
  now += 24 * 60 * 60 * 1000;
  assert.equal(fetchPage.getCached({ page: 1, limit: 20 }), null);
});

test('prefetch and rendering share a request; cancelling one consumer does not cancel the other', async t => {
  t.mock.property(globalThis, 'localStorage', storage());
  clearPublicCatalogCache();
  let finish, reads = 0;
  const client = { defaults: { baseURL: '/api' }, get: (_endpoint, config) => {
    reads++;
    assert.equal(config.signal, undefined);
    assert.equal(config.withCredentials, false);
    assert.equal(config.publicCatalog, true);
    return new Promise(resolve => { finish = resolve; });
  } };
  const fetchPage = createPublicCatalogFetcher(client, '/products/category-previews');
  const controller = new AbortController();
  const first = fetchPage({ limit: 6 }, { signal: controller.signal });
  const second = fetchPage({ limit: 6 });
  controller.abort();
  finish({ data: { items: [{ _id: 'category' }], hasMore: false } });
  await Promise.all([first, second]);
  assert.equal(reads, 1);
  assert.equal(fetchPage.getCached({ limit: 6 }).items[0]._id, 'category');
});

test('in-flight responses cannot restore snapshots after product changes; storage may be disabled', async t => {
  t.mock.property(globalThis, 'localStorage', undefined);
  clearPublicCatalogCache();
  let finish;
  const client = { defaults: { baseURL: '/api' },
    get: () => new Promise(resolve => { finish = resolve; }),
  };
  const fetchPage = createPublicCatalogFetcher(client, '/products/catalog');
  const pending = fetchPage();
  clearPublicCatalogCache();
  finish({ data: { items: [{ _id: 'outdated' }] } });
  await pending;
  assert.equal(fetchPage.getCached(), null);
  const fresh = fetchPage();
  finish({ data: { items: [{ _id: 'fresh' }] } });
  await fresh;
  assert.equal(fetchPage.getCached().items[0]._id, 'fresh');
});
