// import apiClient from "./apiClient";

// // Base endpoint for products
// const BASE_URL = "/products";

// const productApi = {
//   // Get all products
//   getAll: () => apiClient.get(BASE_URL),

//   // Get single product by ID
//   getById: (id) => apiClient.get(`${BASE_URL}/${id}`),

//   // Create new product
//   create: (productData) => apiClient.post(BASE_URL, productData),

//   // Update product by ID
//   update: (id, productData) => apiClient.put(`${BASE_URL}/${id}`, productData),

//   // Delete product by ID
//   remove: (id) => apiClient.delete(`${BASE_URL}/${id}`),
// };

// export default productApi;

import apiClient from "./apiClient";

// Base endpoint for products
const BASE_URL = "/products";
const CACHE_PREFIX = "product_api_cache:";
const CACHE_TTL_MS = 60 * 1000;
const inMemoryCache = new Map();

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
  remove: async (id) => {
    const response = await apiClient.delete(`${BASE_URL}/${id}`);
    clearProductCache();
    return response;
  },

  // Get deleted products (admin) with fallback for older backend route versions
  getDeleted: async () => {
    try {
      return await apiClient.get(`${BASE_URL}/deleted/list`);
    } catch (error) {
      if (error?.response?.status === 404) {
        const response = await apiClient.get(`${BASE_URL}?deletedOnly=true`);
        const rows = response.data || [];
        const hasDeleteField = rows.some((p) => Object.prototype.hasOwnProperty.call(p || {}, "isDeleted"));
        if (rows.length > 0 && !hasDeleteField) {
          throw new Error(
            "Backend is running old product API (no soft delete). Redeploy backend with deleted-products routes."
          );
        }
        const onlyDeleted = rows.filter((p) => p?.isDeleted === true);
        return { ...response, data: onlyDeleted };
      }
      throw error;
    }
  },

  // Restore deleted product (admin)
  restore: async (id) => {
    const response = await apiClient.patch(`${BASE_URL}/${id}/restore`);
    clearProductCache();
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

  clearCache: clearProductCache,
};

export default productApi;
