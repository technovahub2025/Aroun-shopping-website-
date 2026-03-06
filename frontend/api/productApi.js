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

  // Get deleted products (admin)
  getDeleted: async () => {
    try {
      return await apiClient.get(`${BASE_URL}/deleted/list`);
    } catch (error) {
      if (error?.response?.status === 404) {
        const response = await apiClient.get(`${BASE_URL}?deletedOnly=true`);
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
        return { ...response, data: onlyDeleted };
      }
      throw error;
    }
  },

  // Restore deleted product
  restore: (id) => apiClient.patch(`${BASE_URL}/${id}/restore`),

  // Delete category and all products in it
  deleteCategory: (category) =>
    apiClient.delete(`${BASE_URL}/deletecategory/${encodeURIComponent(category)}`),
};

export default productApi;
