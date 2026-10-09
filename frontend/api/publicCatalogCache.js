const PREFIX = 'public_catalog_v1:';
const MAX_AGE = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 30;
const memory = new Map();
const pending = new Map();
let generation = 0;

// Scope snapshots to the API origin as well as the endpoint and filters.
export function createPublicCatalogFetcher(client, endpoint) {
  const keyFor = (params = {}) => PREFIX + JSON.stringify([
    client.defaults.baseURL, endpoint,
    Object.entries(params).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b)),
  ]);
  const fetchPage = async (params = {}, config = {}) => {
    const key = keyFor(params);
    const version = generation;
    if (!pending.has(key)) {
      // Each caller handles its own cancellation; shared requests must survive unmounts.
      const requestConfig = { ...config };
      delete requestConfig.signal;
      const request = client.get(endpoint, { ...requestConfig, params, publicCatalog: true, withCredentials: false });
      pending.set(key, request);
      request.finally(() => {
        if (pending.get(key) === request) pending.delete(key);
      }).catch(() => {});
    }
    const response = await pending.get(key);
    if (config.signal?.aborted) return response;
    if (version !== generation) return response;
    const entry = { timestamp: Date.now(), data: response.data };
    memory.delete(key);
    memory.set(key, entry);
    if (memory.size > MAX_ENTRIES) memory.delete(memory.keys().next().value);
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(PREFIX));
      if (!keys.includes(key) && keys.length >= MAX_ENTRIES) {
        const oldest = keys.sort((a, b) => {
          try { return JSON.parse(localStorage.getItem(a)).timestamp - JSON.parse(localStorage.getItem(b)).timestamp; }
          catch { return 0; }
        })[0];
        localStorage.removeItem(oldest);
      }
      localStorage.setItem(key, JSON.stringify(entry));
    } catch { /* Memory caching still works when storage is unavailable. */ }
    return response;
  };
  fetchPage.getCached = (params = {}) => {
    const key = keyFor(params);
    try {
      const entry = memory.get(key) || JSON.parse(localStorage.getItem(key));
      const valid = endpoint.endsWith('/catalog-facets')
        ? Array.isArray(entry?.data?.categories) && Array.isArray(entry?.data?.types)
        : Array.isArray(entry?.data?.items);
      return valid && Date.now() - entry.timestamp < MAX_AGE ? entry.data : null;
    } catch { return null; }
  };
  return fetchPage;
}

export function clearPublicCatalogCache() {
  generation += 1;
  pending.clear();
  memory.clear();
  try {
    Object.keys(localStorage).filter(key => key.startsWith(PREFIX)).forEach(key => localStorage.removeItem(key));
  } catch { /* Storage may be disabled. */ }
}
