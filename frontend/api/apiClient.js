import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,   // /api append pannunga
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor to add token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
