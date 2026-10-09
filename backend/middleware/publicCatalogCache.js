// Only register this middleware on catalog responses shared by all visitors.
const TTL = 30 * 1000;
const MAX_ENTRIES = 100;
const MAX_BYTES = 512 * 1024;
const entries = new Map();
let generation = 0;

function clear() {
  generation += 1;
  entries.clear();
}

function catalogCache(req, res, next) {
  const key = req.originalUrl;
  const entry = entries.get(key);
  const headers = () => res.set('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
  if (entry && Date.now() - entry.timestamp < TTL) {
    headers();
    return res.json(entry.body);
  }
  entries.delete(key);
  const version = generation;
  const send = res.json;
  res.json = function (body) {
    if (res.statusCode === 200) {
      headers();
      if (version === generation && Buffer.byteLength(JSON.stringify(body)) <= MAX_BYTES) {
        if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
        entries.set(key, { body, timestamp: Date.now() });
      }
    } else res.set('Cache-Control', 'no-store');
    return send.call(this, body);
  };
  next();
}

function invalidateCatalog(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) clear();
    });
  }
  next();
}

module.exports = { catalogCache, invalidateCatalog, clear };
