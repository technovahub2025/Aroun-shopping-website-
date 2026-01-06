import apiClient from "./apiClient";

// Base endpoint for products
const BASE_URL = "/products";

const productApi = {
  // Get all products
  getAll: () => apiClient.get(BASE_URL),

  // Get single product by ID
  getById: (id) => apiClient.get(`${BASE_URL}/${id}`),

  // Create new product
  create: (productData) => apiClient.post(BASE_URL, productData),

  // Update product by ID
  update: (id, productData) => apiClient.put(`${BASE_URL}/${id}`, productData),

  // Delete product by ID
  remove: (id) => apiClient.delete(`${BASE_URL}/${id}`),

  //Delete product image by ID
  deleteImage: (id,productData) => apiClient.put(`${BASE_URL}/${id}/image`,productData),
};

export default productApi;
