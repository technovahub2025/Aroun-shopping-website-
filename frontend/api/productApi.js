import apiClient from "./apiClient";

// Base endpoint for products
const BASE_URL = "/products";

const productApi = {
  // Get all products
  getAll: () => apiClient.get(BASE_URL),

  // Get single product by ID
  getById: (id) => apiClient.get(`${BASE_URL}/${id}`),

  // Create new product
  create: (productData) => {
    const formData = new FormData();
    
    // Append text fields
    formData.append("title", productData.title);
    formData.append("description", productData.description);
    formData.append("price", productData.price);
    formData.append("stock", productData.stock);
    formData.append("rating", productData.rating || 0);
    
    // Append categories as JSON string
    formData.append("categories", JSON.stringify(productData.categories));
    
    // Append image files
    if (productData.images) {
      for (let image of productData.images) {
        formData.append("images", image);
      }
    }

    return apiClient.post(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Update product by ID
  update: (id, productData) => {
    const formData = new FormData();
    
    // Append text fields if they exist
    if (productData.title) formData.append("title", productData.title);
    if (productData.description) formData.append("description", productData.description);
    if (productData.price) formData.append("price", productData.price);
    if (productData.stock) formData.append("stock", productData.stock);
    if (productData.rating) formData.append("rating", productData.rating);
    
    // Append categories if provided
    if (productData.categories) {
      formData.append("categories", JSON.stringify(productData.categories));
    }
    
    // Append new images if provided
    if (productData.images && productData.images.length > 0) {
      for (let image of productData.images) {
        formData.append("images", image);
      }
    }

    // If some existing images should be removed, send their identifiers/urls
    if (productData.removedImages && productData.removedImages.length > 0) {
      formData.append("removedImages", JSON.stringify(productData.removedImages));
    }

    return apiClient.put(`${BASE_URL}/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete product by ID
  remove: (id) => apiClient.delete(`${BASE_URL}/${id}`),
};

export default productApi;
