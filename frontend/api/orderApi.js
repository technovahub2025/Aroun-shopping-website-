
import apiClient from './apiClient';

const BASE = '/orders';
const CACHE_PREFIX = 'order_api_cache:';
const CACHE_TTL_MS = 60 * 1000;
const inMemoryCache = new Map();

const readCache = (key) => {
  const memoryEntry = inMemoryCache.get(key);
  if (memoryEntry && Date.now() - memoryEntry.timestamp < CACHE_TTL_MS) {
    return memoryEntry.data;
  }

  const raw = sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp >= CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    inMemoryCache.set(key, parsed);
    return parsed.data;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

const writeCache = (key, data) => {
  const entry = { data, timestamp: Date.now() };
  inMemoryCache.set(key, entry);
  sessionStorage.setItem(key, JSON.stringify(entry));
};

const clearOrderCache = () => {
  inMemoryCache.clear();
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
};

const orderApi = {
  create: async (payload) => {
    const response = await apiClient.post(BASE, payload);
    clearOrderCache();
    return response;
  },
  myOrders: async (options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = `${CACHE_PREFIX}my`;
    if (!forceRefresh) {
      const cachedData = readCache(cacheKey);
      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }
    }

    const response = await apiClient.get(`${BASE}/my`);
    writeCache(cacheKey, response.data);
    return response;
  },
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  listAll: async (options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = `${CACHE_PREFIX}all`;
    if (!forceRefresh) {
      const cachedData = readCache(cacheKey);
      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }
    }

    const response = await apiClient.get(BASE);
    writeCache(cacheKey, response.data);
    return response;
  }, // admin
  update: async (id, payload) => {
    const response = await apiClient.put(`${BASE}/${id}`, payload);
    clearOrderCache();
    return response;
  },
  prefetchForRole: (role) =>
    role === 'admin' ? orderApi.listAll() : orderApi.myOrders(),
  clearCache: clearOrderCache,
};

export default orderApi;
