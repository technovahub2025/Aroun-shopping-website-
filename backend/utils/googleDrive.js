const { createHmac, randomUUID, timingSafeEqual } = require('node:crypto');

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const fail = (message, status = 502) => Object.assign(new Error(message), { status, expose: true });
let token;
let expiresAt = 0;

function config() {
  const names = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN', 'DRIVE_IMAGE_SIGNING_SECRET', 'PUBLIC_API_URL'];
  if (names.some((name) => !process.env[name])) {
    throw fail('Google Drive uploads are not configured. See backend/GOOGLE_DRIVE_SETUP.md.', 503);
  }
  const base = new URL(process.env.PUBLIC_API_URL);
  if (!['http:', 'https:'].includes(base.protocol)) throw fail('Invalid PUBLIC_API_URL.', 503);
  return base.origin;
}

async function accessToken() {
  if (['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN'].some(name => !process.env[name])) {
    throw Object.assign(new Error('Storage is not configured.'), { code: 'STORAGE_NOT_CONFIGURED', status: 503, expose: true });
  }
  if (token && Date.now() < expiresAt) return token;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw fail('Google Drive authorization failed. Check the server credentials.', 503);
  const data = await response.json();
  if (typeof data.access_token !== 'string' || !Number.isFinite(data.expires_in)) throw fail('Google Drive authorization failed.', 503);
  token = data.access_token;
  expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return token;
}

async function driveFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${await accessToken()}` },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    if (response.status === 401) { token = undefined; expiresAt = 0; }
    throw fail('Google Drive request failed. Check account access, storage, and folder settings.');
  }
  return response;
}

function signature(id) {
  config();
  return createHmac('sha256', process.env.DRIVE_IMAGE_SIGNING_SECRET).update(id).digest('hex');
}

function validSignature(id, value) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id) || typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) return false;
  return timingSafeEqual(Buffer.from(signature(id), 'hex'), Buffer.from(value, 'hex'));
}

function validateImage(file) {
  const b = file.buffer;
  const detected = b.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? 'image/jpeg'
    : b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
    : ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString()) ? 'image/gif'
    : b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : null;
  if (!detected || detected !== file.mimetype) throw fail('Choose a valid JPEG, PNG, WebP, or GIF image.', 400);
}

async function uploadImage(file) {
  const base = config();
  validateImage(file);
  const boundary = `drive_${randomUUID()}`;
  const metadata = { name: `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}` };
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) metadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.mimetype}\r\n\r\n`),
    file.buffer, Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true', {
    method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
  });
  const { id } = await response.json();
  return { id, url: `${base}/api/drive-images/${id}?signature=${signature(id)}` };
}

async function deleteImage(id) {
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?supportsAllDrives=true`, { method: 'DELETE' });
}

async function readImage(id) {
  if ([process.env.DRIVE_PRODUCTS_FILE_ID, process.env.DRIVE_ACCOUNTS_FILE_ID, process.env.DRIVE_RECORD_FOLDER_ID].includes(id)) throw fail('Image not found.', 404);
  return driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`);
}

const invalidateAccessToken = () => { token = undefined; expiresAt = 0; };
module.exports = { uploadImage, deleteImage, readImage, validSignature, validateImage, imageTypes, accessToken, invalidateAccessToken };
