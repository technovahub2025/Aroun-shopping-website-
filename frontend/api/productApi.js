import apiClient from "./apiClient";

// Base endpoint for products
const BASE_URL = "/products";
const CACHE_PREFIX = "product_api_cache:";
const CACHE_TTL_MS = 60 * 1000;
const inMemoryCache = new Map();
const pendingRequests = new Map();
const DELETED_CACHE_KEY = `${CACHE_PREFIX}deleted:list`;

const buildCacheKey = (query) => {
  if (!query) return `${CACHE_PREFIX}all`;
  if (typeof query === "string") {
    const normalizedQuery = query.startsWith("?") ? query : `?${query}`;
    return `${CACHE_PREFIX}${normalizedQuery}`;
  }
  return `${CACHE_PREFIX}${JSON.stringify(query)}`;
};

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

const safeArray = (value) => (Array.isArray(value) ? value : []);

const patchCacheList = (key, patcher) => {
  const current = readCache(key);
  if (!current) return null;
  const next = patcher(safeArray(current));
  writeCache(key, next);
  return next;
};

const upsertById = (rows, row) => {
  if (!row || !row._id) return rows;
  const next = rows.filter((p) => p?._id !== row._id);
  next.unshift(row);
  return next;
};

const clearProductCache = () => {
  inMemoryCache.clear();
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
};

const productApi = {
  // Get all products
  getAll: async (query, options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = buildCacheKey(query);

    if (!forceRefresh) {
      const cachedData = readCache(cacheKey);
      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const request = (async () => {
      let response;

      if (!query) {
        response = await apiClient.get(BASE_URL);
      } else if (typeof query === "string") {
        const normalizedQuery = query.startsWith("?") ? query : `?${query}`;
        response = await apiClient.get(`${BASE_URL}${normalizedQuery}`);
      } else {
        response = await apiClient.get(BASE_URL, { params: query });
      }

      writeCache(cacheKey, response.data);
      return response;
    })();

    pendingRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  },

  // Get single product by ID
  getById: (id) => apiClient.get(`${BASE_URL}/${id}`),

  // Create new product
  create: async (productData) => {
    const response = await apiClient.post(BASE_URL, productData);
    clearProductCache();
    return response;
  },

  // Update product by ID
  update: async (id, productData) => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, productData);
    clearProductCache();
    return response;
  },

  // Delete product by ID
  remove: async (id, options = {}) => {
    const { product } = options;
    const response = await apiClient.delete(`${BASE_URL}/${id}`);

    // Keep cached lists so admin pages render instantly; patch the relevant caches optimistically.
    patchCacheList(buildCacheKey(), (rows) => rows.filter((p) => p?._id !== id));

    if (product) {
      const deletedProduct = {
        ...product,
        isDeleted: true,
        deletedAt: product.deletedAt || new Date().toISOString(),
      };
      const existingDeleted = readCache(DELETED_CACHE_KEY) || [];
      writeCache(DELETED_CACHE_KEY, upsertById(safeArray(existingDeleted), deletedProduct));
    }

    return response;
  },

  // Get deleted products (admin) with fallback for older backend route versions
  getDeleted: async (options = {}) => {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cachedData = readCache(DELETED_CACHE_KEY);
      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }
    }

    if (pendingRequests.has(DELETED_CACHE_KEY)) {
      return pendingRequests.get(DELETED_CACHE_KEY);
    }

    const request = (async () => {
      let response;

      try {
        response = await apiClient.get(`${BASE_URL}/deleted/list`);
      } catch (error) {
        if (error?.response?.status === 404) {
          response = await apiClient.get(`${BASE_URL}?deletedOnly=true`);
          const rows = response.data || [];
          const hasDeleteField = rows.some((p) =>
            Object.prototype.hasOwnProperty.call(p || {}, "isDeleted")
          );
          if (rows.length > 0 && !hasDeleteField) {
            throw new Error(
              "Backend is running old product API (no soft delete). Redeploy backend with deleted-products routes."
            );
          }
          const onlyDeleted = rows.filter((p) => p?.isDeleted === true);
          response = { ...response, data: onlyDeleted };
        } else {
          throw error;
        }
      }

      writeCache(DELETED_CACHE_KEY, response.data);
      return response;
    })();

    pendingRequests.set(DELETED_CACHE_KEY, request);

    try {
      return await request;
    } finally {
      pendingRequests.delete(DELETED_CACHE_KEY);
    }
  },

  getCachedDeleted: () => readCache(DELETED_CACHE_KEY),

  // Restore deleted product (admin)
  restore: async (id, options = {}) => {
    const { product } = options;
    const response = await apiClient.patch(`${BASE_URL}/${id}/restore`);

    // Keep cached lists so admin pages render instantly; patch the relevant caches optimistically.
    patchCacheList(DELETED_CACHE_KEY, (rows) => rows.filter((p) => p?._id !== id));

    if (product) {
      const restoredProduct = { ...product, isDeleted: false, deletedAt: undefined };
      patchCacheList(buildCacheKey(), (rows) => upsertById(rows, restoredProduct));
    }

    return response;
  },

  // Delete category and all products in it
  deleteCategory: async (category) => {
    const response = await apiClient.delete(
      `${BASE_URL}/deletecategory/${encodeURIComponent(category)}`
    );
    clearProductCache();
    return response;
  },

  prefetchAll: () => productApi.getAll(undefined, { forceRefresh: false }),
  prefetchDeleted: () => productApi.getDeleted({ forceRefresh: false }),

  getCachedAll: (query) => readCache(buildCacheKey(query)),

  clearCache: clearProductCache,
};

export default productApi;
