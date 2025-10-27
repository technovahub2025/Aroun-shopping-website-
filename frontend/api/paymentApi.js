import apiClient from './apiClient';

const BASE = '/payment';

const paymentApi = {
  process: (payload) => apiClient.post(BASE, payload),
};

export default paymentApi;
