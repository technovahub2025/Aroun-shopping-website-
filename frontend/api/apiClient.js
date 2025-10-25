import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Don't set Content-Type for FormData (multipart/form-data)
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  
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
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Refresh the page only if not already on the home page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
