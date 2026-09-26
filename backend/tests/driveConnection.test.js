const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Connection = require('../models/driveConnectionModel');
const credentials = require('../utils/driveCredentials');
const drive = require('../utils/googleDrive');
const router = require('../routes/googleDriveRoute');
const originals = { find: Connection.findById, update: Connection.findOneAndUpdate, fetch: global.fetch };
const environment = { ...process.env };
afterEach(() => {
  Connection.findById = originals.find;
  Connection.findOneAndUpdate = originals.update;
  global.fetch = originals.fetch;
  process.env = { ...environment };
  drive.invalidateAccessToken();
});

function database(record) {
  Connection.findById = (id) => {
    assert.equal(id, 'client');
    return { select: () => ({ lean: async () => record }) };
  };
  Object.assign(process.env, { GOOGLE_DRIVE_CLIENT_ID: 'client', GOOGLE_DRIVE_CLIENT_SECRET: 'secret' });
}

test('saved connection survives module reload and takes precedence over environment token', async () => {
  let persisted;
  database(null);
  Connection.findOneAndUpdate = async (filter, update, options) => {
    assert.equal(filter._id, 'client');
    assert.equal(options.upsert, true);
    persisted = update.$set;
  };
  await credentials.saveRefreshToken('saved-refresh');
  database(persisted);
  process.env.GOOGLE_DRIVE_REFRESH_TOKEN = 'old-refresh';
  delete require.cache[require.resolve('../utils/driveCredentials')];
  const reloaded = require('../utils/driveCredentials');
  assert.equal(await reloaded.getRefreshToken(), 'saved-refresh');
  delete process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  assert.equal(await reloaded.getRefreshToken(), 'saved-refresh');
});

test('legacy environment credentials work when no connection has been saved', async () => {
  database(null);
  process.env.GOOGLE_DRIVE_REFRESH_TOKEN = 'legacy';
  assert.equal(await credentials.getRefreshToken(), 'legacy');
});

test('database errors do not silently fall back to stale credentials or report a successful save', async () => {
  database(null);
  Connection.findOneAndUpdate = async () => { throw new Error('database unavailable'); };
  await assert.rejects(credentials.saveRefreshToken('new-token'), /database unavailable/);
  Connection.findById = () => { throw new Error('database unavailable'); };
  await assert.rejects(credentials.getRefreshToken(), /database unavailable/);
});

test('Drive retries an expired access token and uses persisted refresh credentials', async () => {
  database({ refreshToken: 'saved-refresh' });
  let refreshes = 0, requests = 0;
  global.fetch = async (url, options) => {
    if (url.includes('oauth2')) {
      assert.equal(options.body.get('refresh_token'), 'saved-refresh');
      return Response.json({ access_token: `access-${++refreshes}`, expires_in: 3600 });
    }
    requests++;
    assert.equal(options.headers.Authorization, `Bearer access-${requests}`);
    return new Response('image', { status: requests === 1 ? 401 : 200 });
  };
  assert.equal((await drive.readImage('image-id')).status, 200);
  assert.equal(refreshes, 2);
  assert.equal(requests, 2);
});

test('a reconnected account invalidates cached access tokens', async () => {
  const record = { refreshToken: 'first' };
  database(record);
  global.fetch = async (url, options) => Response.json({ access_token: options.body.get('refresh_token'), expires_in: 3600 });
  assert.equal(await drive.accessToken(), 'first');
  record.refreshToken = 'second';
  assert.equal(await drive.accessToken(), 'second');
});

test('revoked credentials are reported without deleting the saved connection', async () => {
  database({ refreshToken: 'revoked' });
  global.fetch = async () => Response.json({ error: 'invalid_grant' }, { status: 400 });
  await assert.rejects(drive.accessToken(), { code: 'invalid_grant' });
  assert.equal(await credentials.getRefreshToken(), 'revoked');
});

async function status() {
  const handler = router.stack.find(layer => layer.route?.path === '/status').route.stack[0].handle;
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({}, response);
  return response;
}

test('connection status accepts My Drive without a configured folder', async () => {
  database({ refreshToken: 'saved' });
  delete process.env.GOOGLE_DRIVE_FOLDER_ID;
  global.fetch = async url => Response.json(url.includes('oauth2')
    ? { access_token: 'access', expires_in: 3600 }
    : { user: { emailAddress: 'owner@example.com' } });
  const response = await status();
  assert.equal(response.body.connected, true);
  assert.equal(response.body.folderAccessible, true);
});

test('temporary Google failures are unavailable while revoked tokens require reconnecting', async () => {
  database({ refreshToken: 'saved' });
  global.fetch = async () => { throw new Error('network timeout'); };
  assert.equal((await status()).statusCode, 503);
  global.fetch = async () => Response.json({ error: 'invalid_grant' }, { status: 400 });
  const response = await status();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.connected, false);
});
