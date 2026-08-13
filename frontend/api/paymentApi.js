import apiClient from "./apiClient";

const BASE = "/payment";

const paymentApi = {
  createOrder: (payload) => apiClient.post(`${BASE}/create-order`, payload),
  verify: (payload) => apiClient.post(`${BASE}/verify`, payload),
};

export default paymentApi;
