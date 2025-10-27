import apiClient from './apiClient';

const BASE = '/cart';

const cartApi = {
  get: () => apiClient.get(BASE),
  add: (productId, quantity = 1) => apiClient.post(BASE, { productId, quantity }),
  update: (productId, quantity) => apiClient.put(BASE, { productId, quantity }),
  remove: (productId) => apiClient.delete(`${BASE}/${productId}`),
  clear: () => apiClient.delete(BASE),
};

export default cartApi;
