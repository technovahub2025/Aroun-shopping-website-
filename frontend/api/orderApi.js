import apiClient from './apiClient';

const BASE = '/orders';

const orderApi = {
  create: (payload) => apiClient.post(BASE, payload),
  myOrders: () => apiClient.get(`${BASE}/my`),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  listAll: () => apiClient.get(BASE), // admin
  update: (id, payload) => apiClient.put(`${BASE}/${id}`, payload),
};

export default orderApi;
