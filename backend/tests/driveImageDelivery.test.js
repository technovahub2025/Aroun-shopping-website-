const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const drive = require('../utils/googleDrive');
const credentials = require('../utils/driveCredentials');
const { publicApiOrigin, canonicalImageUrl, canonicalProductPayload } = require('../utils/driveImageUrls');
const router = require('../routes/driveImageRoute');
const handler = router.stack.find(layer => layer.route).route.stack[0].handle;
const env = { ...process.env };
const originals = { fetch: global.fetch, credentials: credentials.getRefreshToken, error: console.error };
afterEach(() => {
  process.env = { ...env };
  global.fetch = originals.fetch;
  credentials.getRefreshToken = originals.credentials;
  console.error = originals.error;
  drive.invalidateAccessToken();
});
const id = 'file_123';
function configure() {
  Object.assign(process.env, { PUBLIC_API_URL: 'https://new-api.example',
    GOOGLE_DRIVE_CLIENT_ID: 'test-client', GOOGLE_DRIVE_CLIENT_SECRET: 'test-client-secret',
    DRIVE_IMAGE_SIGNING_SECRET: 'test-signing-secret' });
  credentials.getRefreshToken = async () => 'test-refresh';
}
function response() {
  return { headers: {}, headersSent: false, statusCode: 200,
    set(name, value) { Object.assign(this.headers, typeof name === 'string' ? { [name]: value } : name); return this; },
    status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
function signedQuery() { return { signature: new URL(drive.imageUrl(id)).searchParams.get('signature') }; }

test('legacy product and nested catalog references change origin without changing HMAC or stored data', () => {
  configure();
  const hmac = createHmac('sha256', process.env.DRIVE_IMAGE_SIGNING_SECRET).update(id).digest('hex');
  const path = `/api/drive-images/${id}?signature=${hmac}&v=2`;
  const stored = { items: [{ products: [{ images: [`https://aroun-shopping-website-ysi0.onrender.com${path}`] }] }] };
  const result = canonicalProductPayload(stored);
  assert.equal(result.items[0].products[0].images[0], `https://new-api.example${path}`);
  assert.match(stored.items[0].products[0].images[0], /ysi0/);
  assert.ok(drive.validSignature(id, hmac));
  delete process.env.PUBLIC_API_URL;
  delete process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  assert.ok(drive.validSignature(id, hmac), 'verification depends only on signing key');
});

test('origin validation rejects paths and credentials; unrelated image URLs stay unchanged', () => {
  configure();
  for (const url of ['https://api.example/api', 'https://user:password@api.example', 'invalid', 'ftp://api.example']) {
    process.env.PUBLIC_API_URL = url;
    assert.throws(publicApiOrigin, { code: 'INVALID_PUBLIC_API_URL' });
  }
  for (const url of ['https://other.example/api/drive-images/id?signature=anything', '/placeholder.svg',
    'https://aroun-shopping-website-ysi0.onrender.com/api/drive-images/id/extra']) {
    assert.equal(canonicalImageUrl(url), url);
  }
});

test('proxy distinguishes OAuth failure, denied file access, missing files, quota and Google outage without leaking secrets', async () => {
  configure();
  const logs = [];
  console.error = (...args) => logs.push(args);
  for (const [stage, upstreamStatus, reason, expected] of [
    ['oauth', 400, 'invalid_grant', 503], ['drive', 403, 'insufficientPermissions', 502],
    ['drive', 404, 'notFound', 404], ['drive', 429, 'rateLimitExceeded', 503],
    ['drive', 503, 'backendError', 503],
  ]) {
    drive.invalidateAccessToken();
    global.fetch = async url => url.includes('oauth2') && stage !== 'oauth'
      ? Response.json({ access_token: 'do-not-log-access-token', expires_in: 3600 })
      : Response.json({ error: stage === 'oauth' ? reason : { errors: [{ reason }],
        message: 'do-not-log-upstream-message' }, error_description: 'do-not-log-description' }, { status: upstreamStatus });
    const res = response();
    await handler({ params: { id }, query: signedQuery() }, res);
    assert.equal(res.statusCode, expected);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(logs.at(-1)[1].upstreamStatus, upstreamStatus);
    assert.equal(logs.at(-1)[1].upstreamReason, reason);
    assert.equal(res.body.requestId, res.headers['X-Request-ID']);
  }
  const serialized = JSON.stringify(logs);
  assert.doesNotMatch(serialized, /do-not-log|signature=|test-refresh|test-client-secret|test-signing-secret|https:/);
});

test('proxy reports missing credentials and transport timeouts; tampered signatures never reach Google', async () => {
  configure();
  console.error = () => {};
  global.fetch = async () => { throw new DOMException('sensitive network text', 'TimeoutError'); };
  const timeout = response();
  await handler({ params: { id }, query: signedQuery() }, timeout);
  assert.equal(timeout.statusCode, 503);
  delete process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const missing = response();
  await handler({ params: { id }, query: signedQuery() }, missing);
  assert.equal(missing.statusCode, 503);
  global.fetch = () => { assert.fail('Invalid signature must not access Google'); };
  const forbidden = response();
  await handler({ params: { id }, query: { signature: '0'.repeat(64) } }, forbidden);
  assert.equal(forbidden.statusCode, 403);
});

test('migration defaults to a pure URL transformation and retains signatures and unrelated URLs', () => {
  configure();
  const { migrateImageUrl } = require('../migrateDriveImageUrls');
  const path = `/api/drive-images/${id}?signature=unchanged&v=2`;
  assert.deepEqual(migrateImageUrl(`https://aroun-shopping-website-ysi0.onrender.com${path}`),
    { changed: true, url: `https://new-api.example${path}` });
  assert.deepEqual(migrateImageUrl('https://cdn.example/image.png'),
    { changed: false, url: 'https://cdn.example/image.png' });
});
