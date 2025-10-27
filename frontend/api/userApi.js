import apiClient from './apiClient';

const BASE = '/users';

const userApi = {
  getProfile: () => apiClient.get(`${BASE}/me`),
  updateProfile: (data) => apiClient.put(`${BASE}/me`, data),
};

export default userApi;
