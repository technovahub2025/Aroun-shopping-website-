const legacyOrigins = new Set([
  'https://aroun-shopping-website-ysi0.onrender.com',
  'https://aroun-shopping-website-fekt.onrender.com',
  'https://arounstorebackend-fdpa.onrender.com',
]);

function publicApiOrigin() {
  try {
    const url = new URL(process.env.PUBLIC_API_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw Object.assign(new Error('PUBLIC_API_URL must be the public backend origin without /api.'),
      { status: 503, code: 'INVALID_PUBLIC_API_URL', expose: true });
  }
}

// Change only known backend references. Never sign a client-supplied file ID.
function canonicalImageUrl(value) {
  if (typeof value !== 'string') return value;
  let url;
  try { url = new URL(value, 'http://relative.invalid'); } catch { return value; }
  if (!/^\/api\/drive-images\/[A-Za-z0-9_-]+$/.test(url.pathname)) return value;
  const relative = value.startsWith('/api/drive-images/');
  if (!relative && !legacyOrigins.has(url.origin) && url.origin !== process.env.PUBLIC_API_URL?.replace(/\/$/, '')) return value;
  // Preserve the HMAC and other query parameters byte for byte across host changes.
  return `${publicApiOrigin()}${url.pathname}${url.search}${url.hash}`;
}

function canonicalProductPayload(value) {
  if (Array.isArray(value)) return value.map(canonicalProductPayload);
  if (value && typeof value.toObject === 'function') value = value.toObject();
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    key === 'images' && Array.isArray(item) ? item.map(canonicalImageUrl) : canonicalProductPayload(item)]));
}

module.exports = { publicApiOrigin, canonicalImageUrl, canonicalProductPayload };
