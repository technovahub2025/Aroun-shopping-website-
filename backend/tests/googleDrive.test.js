const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const drive = require('../utils/googleDrive');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test('rejects unsupported and mislabeled image bytes', () => {
  assert.throws(() => drive.validateImage({ buffer: Buffer.from('<svg/>'), mimetype: 'image/png' }), /valid JPEG/);
  assert.throws(() => drive.validateImage({ buffer: Buffer.from('GIF89a'), mimetype: 'image/jpeg' }), /valid JPEG/);
  assert.doesNotThrow(() => drive.validateImage({ buffer: Buffer.from('GIF89a'), mimetype: 'image/gif' }));
});

test('missing configuration prevents uploads before network access', async () => {
  global.fetch = () => { throw new Error('Unexpected network call'); };
  await assert.rejects(drive.uploadImage({}), /not configured/);
});

test('uploads multipart bytes, signs image URLs, and refuses tampered IDs', async () => {
  Object.assign(process.env, {
    GOOGLE_DRIVE_CLIENT_ID: 'test-client', GOOGLE_DRIVE_CLIENT_SECRET: 'test-secret',
    GOOGLE_DRIVE_REFRESH_TOKEN: 'test-refresh', DRIVE_IMAGE_SIGNING_SECRET: 'test-signing-secret',
    PUBLIC_API_URL: 'https://shop-api.example.com',
  });
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(url.includes('oauth2')
      ? { access_token: 'access', expires_in: 3600 } : { id: 'image_123' }), { status: 200 });
  };
  const image = await drive.uploadImage({ originalname: 'test.gif', mimetype: 'image/gif', buffer: Buffer.from('GIF89a') });
  assert.equal(calls.length, 2);
  assert.match(calls[1].options.headers['Content-Type'], /^multipart\/related; boundary=/);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer access');
  assert.ok(calls[1].options.body.includes(Buffer.from('GIF89a')));
  const url = new URL(image.url);
  assert.equal(url.origin, 'https://shop-api.example.com');
  assert.ok(drive.validSignature(image.id, url.searchParams.get('signature')));
  assert.equal(drive.validSignature('another-file', url.searchParams.get('signature')), false);
  assert.equal(drive.validSignature(image.id, ['bad']), false);
  assert.equal(drive.validSignature(image.id, 'bad'), false);
  global.fetch = async () => new Response('{}', { status: 403 });
  await assert.rejects(drive.uploadImage({ originalname: 'test.gif', mimetype: 'image/gif', buffer: Buffer.from('GIF89a') }), /Drive request failed/);
});
